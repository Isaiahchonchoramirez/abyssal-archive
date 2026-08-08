import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../app/store';
import { input } from '../experience/controllers/input';
import { movementBasis, player } from '../experience/controllers/player';
import {
  BOUNDS_BOTTOM,
  BOUNDS_RADIUS,
  BOUNDS_TOP,
  seafloorHeightAt,
} from '../experience/oceanConfig';
import { bySlug } from '../projects/projectData';

const MODEL = '/models/jellyfish.glb';

const SPEED = 15; // target cruise speed, world units/sec
const DRAG = 2.4; // how fast velocity converges on the target — the "thickness" of the water
const FLOOR_CLEARANCE = 1.6;

const TURN_RATE = 3.4; // how fast the bell swings round to face travel
const MAX_TILT = 0.5;
const MAX_BANK = 0.55;

/** Shortest signed path between two angles, so heading never unwinds the long way. */
function angleDelta(from: number, to: number) {
  return ((to - from + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
}

/**
 * You are the jellyfish.
 *
 * It used to be an autonomous guide that held station relative to the camera,
 * which is exactly backwards: the mascot chased the lens instead of being the
 * thing you drive. Now it owns movement and the camera trails it.
 *
 * The underwater feel is unchanged and still costs no physics engine: velocity
 * approaches its target exponentially rather than snapping, and a slow ambient
 * current means the world is never completely still.
 */
export function JellyfishPlayer() {
  const { scene, animations } = useGLTF(MODEL);
  const { actions } = useAnimations(animations, scene);
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const reducedMotion = useStore((s) => s.reducedMotion);

  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const desired = useRef(new THREE.Vector3());
  const current = useRef(new THREE.Vector3());
  const bank = useRef(0);
  const tilt = useRef(0);

  const baseColor = useMemo(() => new THREE.Color('#8fdcff'), []);
  const accentColor = useMemo(() => new THREE.Color(), []);
  const liveColor = useMemo(() => new THREE.Color('#8fdcff'), []);

  useEffect(() => {
    Object.values(actions).forEach((a) => a?.reset().play());
    scene.traverse((n) => {
      n.frustumCulled = false;
    });
  }, [actions, scene]);

  useFrame((state, delta) => {
    // A backgrounded tab hands back a huge delta on return; clamping stops the
    // jellyfish from teleporting across the map on refocus.
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;
    const g = groupRef.current;
    const body = bodyRef.current;
    if (!g || !body) return;

    const { phase, active, nearby } = useStore.getState();
    const frozen = phase !== 'diving' || active !== null;

    // ---- swim -------------------------------------------------------------
    // Basis comes from the orbit yaw, not the camera transform. See player.ts.
    movementBasis(forward.current, right.current);

    desired.current.set(0, 0, 0);
    if (!frozen) {
      desired.current
        .addScaledVector(forward.current, input.forward)
        .addScaledVector(right.current, input.strafe);
      desired.current.y += input.rise;
      if (desired.current.lengthSq() > 1) desired.current.normalize();
      desired.current.multiplyScalar(SPEED);
    }

    // Exponential approach: instant response at the start of a stroke, long
    // coast at the end. This is the single biggest contributor to "underwater".
    player.velocity.lerp(desired.current, 1 - Math.exp(-DRAG * dt));

    if (reducedMotion) {
      current.current.set(0, 0, 0);
    } else {
      // Two out-of-phase sines per axis so the drift never visibly repeats.
      current.current.set(
        Math.sin(t * 0.11) * 0.5 + Math.sin(t * 0.037) * 0.35,
        Math.sin(t * 0.083) * 0.22,
        Math.cos(t * 0.094) * 0.5 + Math.cos(t * 0.041) * 0.3,
      );
    }

    player.position
      .addScaledVector(player.velocity, dt)
      .addScaledVector(current.current, dt);

    // ---- soft bounds ------------------------------------------------------
    const flat = Math.hypot(player.position.x, player.position.z);
    if (flat > BOUNDS_RADIUS) {
      const pull = (flat - BOUNDS_RADIUS) / flat;
      player.position.x -= player.position.x * pull;
      player.position.z -= player.position.z * pull;
      player.velocity.multiplyScalar(0.9);
    }
    const localFloor = seafloorHeightAt(player.position.x, player.position.z);
    const minimumY = Math.max(BOUNDS_BOTTOM, localFloor + FLOOR_CLEARANCE);
    player.position.y = THREE.MathUtils.clamp(player.position.y, minimumY, BOUNDS_TOP);
    // Kill only downward momentum on contact. Horizontal swimming and lifting
    // off again stay responsive instead of feeling glued to the terrain.
    if (player.position.y <= minimumY + 0.001 && player.velocity.y < 0) {
      player.velocity.y = 0;
    }

    player.speedRatio = Math.min(player.velocity.length() / SPEED, 1);

    // ---- orientation ------------------------------------------------------
    const planarSpeed = Math.hypot(player.velocity.x, player.velocity.z);
    if (planarSpeed > 0.6) {
      // Body forward is (-sin h, 0, -cos h), matching the movement basis.
      const targetHeading = Math.atan2(-player.velocity.x, -player.velocity.z);
      const d = angleDelta(player.heading, targetHeading);
      const step = 1 - Math.exp(-TURN_RATE * dt);
      player.heading += d * step;
      // Bank into the turn in proportion to how hard it is, scaled by speed so
      // a stationary nudge does not roll the bell over.
      const turnRate = (d * step) / (dt || 1);
      const targetBank = reducedMotion
        ? 0
        : THREE.MathUtils.clamp(turnRate * 0.28, -MAX_BANK, MAX_BANK) *
          (planarSpeed / SPEED);
      bank.current = THREE.MathUtils.damp(bank.current, targetBank, 4, dt);
    } else {
      bank.current = THREE.MathUtils.damp(bank.current, 0, 4, dt);
    }

    // Nose follows vertical travel — a jellyfish rising should not stay flat.
    const targetTilt = reducedMotion
      ? 0
      : THREE.MathUtils.clamp(-player.velocity.y * 0.06, -MAX_TILT, MAX_TILT);
    tilt.current = THREE.MathUtils.damp(tilt.current, targetTilt, 3.5, dt);

    g.position.copy(player.position);
    // YXZ, not the default XYZ: yaw has to resolve first so the pitch that
    // follows is about the body's own right axis. Under XYZ a jellyfish facing
    // east would take its "nose up" as a barrel roll instead.
    body.rotation.set(tilt.current, player.heading, bank.current, 'YXZ');

    // Bell pulse rate rides the throttle, so hard swimming reads as effort.
    Object.values(actions).forEach((a) => {
      if (a) a.timeScale = reducedMotion ? 0.6 : 0.75 + player.speedRatio * 0.9;
    });

    // ---- light ------------------------------------------------------------
    if (lightRef.current) {
      const pulse = reducedMotion ? 1 : 0.75 + Math.sin(t * 2.1) * 0.25;
      const project = bySlug(nearby);
      const reach = project ? 1.4 : 1;
      // The bell sits ~7 units from the lens, so its light still hits the
      // camera harder than anything else in the scene. Keep it low.
      lightRef.current.intensity = 4 * pulse * reach;

      accentColor.set(project ? project.accent : baseColor);
      liveColor.lerp(accentColor, 1 - Math.exp(-1.5 * dt));
      lightRef.current.color.copy(liveColor);
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={bodyRef}>
        {/* 0.5 made a four-metre jellyfish. It read as a set piece when it was
            the guide; as the thing you pilot it needs to look like an animal in
            a large ocean, not a blimp. */}
        <primitive
          object={scene}
          scale={0.3}
          rotation={[Math.PI / 2, 1.6, 0]}
          raycast={null}
        />
      </group>
      <pointLight ref={lightRef} distance={20} decay={2} intensity={4} />
    </group>
  );
}

useGLTF.preload(MODEL);
