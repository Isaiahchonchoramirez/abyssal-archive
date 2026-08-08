import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../app/store';
import { seafloorHeightAt } from '../experience/oceanConfig';

type Species = {
  slug: string;
  model: string;
  /** Clip to play. Undefined means the model ships no animation. */
  clip?: string;
  /** World length nose-to-tail, in metres. Drives the uniform scale. */
  length: number;
  /**
   * Axis of the *bounding box* that spans nose-to-tail. Drives the scale only.
   *
   * For a skinned mesh this is an axis of bind space, which is not the frame
   * the animal renders in — the whale shark's box is longest on Z while its
   * skeleton runs along X. The extent is still the body length, so it is still
   * the right number to scale by; only the axis label differs from `orient`.
   */
  lengthAxis: 'x' | 'y' | 'z';
  /**
   * Euler that lays the *rendered* model out so its nose points -Z and its back
   * points +Y, applied after recentring and before the heading.
   *
   * Explicit per model, because nothing about a GLB reliably says which end is
   * the head. These three were read off the skeleton: the whale shark ships
   * bones called `Head_15` and `Jaw_14` sitting at +X, and the great white's
   * pectoral-fin and dorsal-fin bones put its head at +Z. The manta has no
   * skeleton, so it was read off a broadside render instead.
   */
  orient: [number, number, number];
  /**
   * Optional procedural wing flap for models that ship no animation clip.
   * `halfSpanAxis` is the local axis running out to the wingtips; displacement
   * is along `liftAxis`.
   */
  flap?: {
    halfSpanAxis: 'x' | 'y' | 'z';
    liftAxis: 'x' | 'y' | 'z';
    /** Peak wingtip travel as a fraction of half-span. */
    amplitude: number;
    /** Radians per second. A real manta beats at roughly 0.3 Hz. */
    frequency: number;
    /** Phase lag from spine to tip, in radians — this is what makes it a wave. */
    wave: number;
  };
  /** Lissajous route: radii, vertical band, and how fast it is walked. */
  route: {
    rx: number;
    rz: number;
    y: number;
    yAmp: number;
    speed: number;
    phase: number;
    /** Sub-multipliers per axis, so the loop never reads as a plain circle. */
    wobble: [number, number, number];
  };
  /** Bank strength going into turns. */
  bank: number;
};

/**
 * Measured bounding boxes, for reference when tuning `lengthAxis`:
 *   manta-ray          x 2.014  y 0.338  z 1.127   → span X, thickness Y, body Z
 *   whale-shark        x 2.884  y 2.103  z 7.051   → body 7.05 (bind space)
 *   great-white-shark  x 0.946  y 2.500  z 0.830   → body 2.50 (bind space)
 *
 * And the skeletons, which is where `orient` comes from:
 *   whale-shark        Head_15 +2.24 X, Jaw_14 +2.53 X, tail flippers −3.6 X
 *   great-white-shark  pectorals +0.45 Z, dorsal +0.19 Z, tail chain −0.91 Z
 */
const SPECIES: Species[] = [
  {
    slug: 'manta-ray',
    model: '/models/manta-ray.glb',
    length: 4.2,
    lengthAxis: 'z',
    // Already noses along -Z.
    orient: [0, 0, 0],
    // Ships no clip at all, so the wings are driven in the vertex shader.
    // Amplitude is a fraction of half-span: the body is only 0.34 deep against
    // a 1.01 half-span, so 0.5 folded the wings through the animal. 0.18 gives
    // about 0.7 m of wingtip travel on a 4.2 m ray.
    flap: {
      halfSpanAxis: 'x',
      liftAxis: 'y',
      amplitude: 0.18,
      frequency: 1.9,
      wave: 1.5,
    },
    route: { rx: 46, rz: 54, y: -2, yAmp: 7, speed: 0.055, phase: 0.9, wobble: [1, 0.37, 0.83] },
    bank: 0.9,
  },
  {
    slug: 'whale-shark',
    model: '/models/whale-shark.glb',
    clip: 'Animation',
    length: 11,
    lengthAxis: 'z',
    // Head sits at +X; a quarter turn about Y brings it round to -Z.
    orient: [0, Math.PI / 2, 0],
    route: { rx: 96, rz: 88, y: 4, yAmp: 5, speed: 0.032, phase: 2.4, wobble: [1, 0.29, 1.13] },
    bank: 0.5,
  },
  {
    slug: 'great-white-shark',
    model: '/models/great-white-shark.glb',
    // 'Swim', not 'Bite' — the other two clips would have it snapping at
    // nothing on a loop in the middle of a portfolio.
    clip: 'Swim',
    length: 5.4,
    lengthAxis: 'y',
    // Head sits at +Z, so it needs turning right round to face -Z.
    orient: [0, Math.PI, 0],
    route: { rx: 124, rz: 118, y: -12, yAmp: 6, speed: 0.041, phase: 4.1, wobble: [1, 0.43, 0.91] },
    bank: 0.7,
  },
];

const AXIS_INDEX = { x: 0, y: 1, z: 2 } as const;

/**
 * Bounds of `root` in its OWN frame, ignoring wherever it currently sits.
 *
 * `Box3.setFromObject` cannot be used here: it calls `updateWorldMatrix(true, …)`
 * and walks *up* the parent chain, so it returns a world-space box that already
 * contains the fit scale and the body's current heading. Measuring with it makes
 * the fit depend on which way the animal happened to be facing when the memo
 * ran — the axis choice flips as it turns, and the model ends up facing a
 * direction that has nothing to do with travel.
 */
function localBounds(root: THREE.Object3D) {
  root.updateWorldMatrix(false, true); // descendants only — never the parents
  const toLocal = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const rel = new THREE.Matrix4();
  const box = new THREE.Box3();
  const part = new THREE.Box3();

  root.traverse((o) => {
    const geometry = (o as THREE.Mesh).geometry;
    if (!geometry) return;
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    if (!geometry.boundingBox) return;
    rel.multiplyMatrices(toLocal, o.matrixWorld);
    part.copy(geometry.boundingBox).applyMatrix4(rel);
    box.union(part);
  });

  return box;
}

/** Where a creature is at time t. Shared by the position and the heading probe. */
function sampleRoute(s: Species, t: number, out: THREE.Vector3) {
  const { rx, rz, y, yAmp, phase, wobble } = s.route;
  const u = t * s.route.speed + phase;
  return out.set(
    Math.sin(u * wobble[0]) * rx,
    y + Math.sin(u * wobble[1]) * yAmp,
    Math.cos(u * wobble[2]) * rz,
  );
}

function Creature({ species }: { species: Species }) {
  const { scene, animations } = useGLTF(species.model);
  const reducedMotion = useStore((s) => s.reducedMotion);

  // Mounted straight from the cached GLTF, not cloned. Object3D.clone does not
  // rebind a skeleton to the copied bones, so a cloned whale shark animates by
  // dragging its mesh through the original's skeleton. Each species appears
  // once, so there is nothing to clone for.
  const model = scene;
  const { actions } = useAnimations(animations, model);

  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const pos = useRef(new THREE.Vector3());
  const ahead = useRef(new THREE.Vector3());
  const bank = useRef(0);
  const prevHeading = useRef(0);

  /**
   * Normalise scale and facing from the model's own bounds rather than trusting
   * three downloads to share a unit or an axis convention. They do not: these
   * arrive somewhere between 1 and 8 units long, pointing in different
   * directions.
   *
   * The transform is reset before measuring because `model` is the GLTF cache's
   * object, not a copy. Measuring it while it still carries a previous mount's
   * scale and recentring offset feeds that offset back into the next one, and
   * the animal walks itself out of the scene a few metres at a time.
   */
  const fit = useMemo(() => {
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    model.scale.set(1, 1, 1);

    const box = localBounds(model);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    const bodyLength = size.getComponent(AXIS_INDEX[species.lengthAxis]);
    const scale = species.length / Math.max(bodyLength, 0.001);
    const halfSpan = species.flap
      ? size.getComponent(AXIS_INDEX[species.flap.halfSpanAxis]) / 2
      : 0;

    if (import.meta.env.DEV) {
      const g = globalThis as unknown as { __fit?: Record<string, unknown> };
      g.__fit ??= {};
      g.__fit[species.slug] = {
        size: size.toArray().map((v) => +v.toFixed(3)),
        lengthAxis: species.lengthAxis,
        bodyLength: +bodyLength.toFixed(3),
        scale: +scale.toFixed(3),
      };
    }

    return {
      scale,
      halfSpan,
      // Applied to a wrapper group this component owns, so the shared cache
      // object never carries layout state of its own.
      offset: centre.clone().multiplyScalar(-scale),
    };
  }, [model, species]);

  /**
   * Wing flap for models with no skeleton to animate.
   *
   * The manta ships a single static mesh, so there is nothing to drive with an
   * AnimationMixer. Displacing the vertices instead costs one shader patch and
   * no CPU: lift rises with the square of the distance from the spine, so the
   * body stays rigid and the tips travel, and the phase lags outward so it
   * reads as a wave rolling down the wing rather than a flat see-saw.
   */
  const flapTime = useRef({ value: 0 });
  useEffect(() => {
    const cfg = species.flap;
    if (!cfg) return;

    const span = cfg.halfSpanAxis;
    const lift = cfg.liftAxis;
    const half = Math.max(fit.halfSpan, 0.001);
    const patched: THREE.Material[] = [];

    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        if (!material || patched.includes(material)) continue;
        material.onBeforeCompile = (shader) => {
          shader.uniforms.uFlapTime = flapTime.current;
          shader.vertexShader =
            'uniform float uFlapTime;\n' +
            shader.vertexShader.replace(
              '#include <begin_vertex>',
              `#include <begin_vertex>
               float wing = clamp(abs(transformed.${span}) / ${half.toFixed(4)}, 0.0, 1.0);
               transformed.${lift} += sin(uFlapTime * ${cfg.frequency.toFixed(3)} - wing * ${cfg.wave.toFixed(3)})
                 * wing * wing * ${(cfg.amplitude * half).toFixed(4)};`,
            );
        };
        // Normals are deliberately left alone. Recomputing them per vertex
        // would double the shader patch for a shading difference invisible at
        // the distance these are seen from.
        material.needsUpdate = true;
        patched.push(material);
      }
    });

    return () => {
      for (const material of patched) {
        material.onBeforeCompile = () => {};
        material.needsUpdate = true;
      }
    };
  }, [model, species, fit.halfSpan]);

  // Dev-only registry so the wildlife can be located and inspected without
  // waiting out a two-minute orbit. Stripped from production builds.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const g = globalThis as unknown as { __wildlife?: Record<string, THREE.Group | null> };
    g.__wildlife ??= {};
    g.__wildlife[species.slug] = groupRef.current;
  });

  useEffect(() => {
    const action = species.clip ? actions[species.clip] : null;
    action?.reset().play();
    model.traverse((n) => {
      n.frustumCulled = false;
      // Wildlife is scenery. Letting it swallow clicks would steal the pointer
      // from the landmarks, which are the only thing here you can interact with.
      n.raycast = () => {};
    });
    return () => {
      action?.stop();
    };
  }, [actions, model, species.clip]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const g = groupRef.current;
    const body = bodyRef.current;
    if (!g || !body) return;

    // Reduced motion still moves them — a frozen shark reads as a bug — it just
    // slows the circuit right down and drops the banking.
    const t = state.clock.elapsedTime * (reducedMotion ? 0.25 : 1);
    flapTime.current.value = t;

    sampleRoute(species, t, pos.current);
    // Heading from a probe slightly along the route, which is cheaper and
    // steadier than differentiating three sines by hand.
    sampleRoute(species, t + 0.35, ahead.current);

    // Never let a route sample push an animal through the seabed.
    const floor = seafloorHeightAt(pos.current.x, pos.current.z);
    pos.current.y = Math.max(pos.current.y, floor + species.length * 0.6);

    const dx = ahead.current.x - pos.current.x;
    const dz = ahead.current.z - pos.current.z;
    const dy = ahead.current.y - pos.current.y;
    const heading = Math.atan2(-dx, -dz);

    const turn = ((heading - prevHeading.current + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    prevHeading.current = heading;
    const targetBank = reducedMotion
      ? 0
      : THREE.MathUtils.clamp((turn / (dt || 1)) * species.bank, -0.6, 0.6);
    bank.current = THREE.MathUtils.damp(bank.current, targetBank, 2.5, dt);

    const pitch = THREE.MathUtils.clamp(
      Math.atan2(dy, Math.hypot(dx, dz)) * -1,
      -0.35,
      0.35,
    );

    g.position.copy(pos.current);
    // Model-space orientation is a separate group below, so this only ever
    // carries travel: yaw first, then pitch about the body's own right axis.
    body.rotation.set(pitch, heading, bank.current, 'YXZ');
  });

  return (
    <group ref={groupRef}>
      <group ref={bodyRef}>
        {/* Orientation sits outside the recentring group on purpose: the inner
            group centres and scales in the model's own frame, and rotating that
            result keeps the animal on its origin. Rotating first would swing
            the centre off and the creature would orbit its own position. */}
        <group rotation={species.orient}>
          <group scale={fit.scale} position={fit.offset}>
            <primitive object={model} />
          </group>
        </group>
      </group>
    </group>
  );
}

/**
 * Ambient wildlife.
 *
 * These do nothing and are not meant to. The world was one jellyfish and some
 * particulate; scale only reads once something large passes at a distance you
 * cannot reach. Every model is CC-BY — see ASSETS.md and the in-site credits.
 */
export function Wildlife() {
  const lowQuality = useStore((s) => s.lowQuality);
  // Three skinned meshes is a real cost on a phone, and the whale shark is the
  // one that sells the scale, so it is the one that survives the cut.
  const cast = lowQuality ? SPECIES.filter((s) => s.slug === 'whale-shark') : SPECIES;

  return (
    <>
      {cast.map((s) => (
        <Creature key={s.slug} species={s} />
      ))}
    </>
  );
}

SPECIES.forEach((s) => useGLTF.preload(s.model));
