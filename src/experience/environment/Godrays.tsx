import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../../app/store';

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uSeed;
  varying vec2 vUv;
  varying float vDepth;

  void main() {
    // uv.y runs 0 at the base to 1 at the apex on a cone.
    float vertical = smoothstep(0.0, 0.55, vUv.y) * (1.0 - smoothstep(0.75, 1.0, vUv.y));
    // Break the cone into shafts and drift them, so it reads as light through
    // a moving surface rather than a solid cone.
    float shafts = 0.5 + 0.5 * sin(vUv.x * 34.0 + uSeed + uTime * 0.48);
    shafts *= 0.62 + 0.38 * sin(vUv.x * 11.0 - uTime * 0.3 + uSeed);
    // A second moving interference field breaks each broad shaft into soft,
    // caustic-like ribbons throughout the water column.
    shafts *= 0.72 + 0.28 * sin(vUv.y * 29.0 + vUv.x * 17.0 + uTime * 0.56 + uSeed);
    // These cones are 46 units tall, so the diver swims straight through them.
    // Additive geometry at point-blank range is what turned the screen white;
    // fade a shaft out as you enter it.
    float near = smoothstep(3.0, 18.0, vDepth);
    gl_FragColor = vec4(uColor, vertical * shafts * near * 0.045);
  }
`;

type Shaft = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  seed: number;
};

/** Sunlight columns from the surface. Additive, depth-write off, no lighting cost. */
export function Godrays() {
  const lowQuality = useStore((s) => s.lowQuality);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const groupRef = useRef<THREE.Group>(null);
  const uniformsRef = useRef<THREE.ShaderMaterial[]>([]);

  const shafts = useMemo<Shaft[]>(() => {
    const n = lowQuality ? 5 : 9;
    return Array.from({ length: n }, (_, i) => {
      const angle = (i / n) * Math.PI * 2 + i * 0.7;
      const radius = i === 0 ? 0 : 12 + ((i * 17) % 62);
      return {
        // Centred so the wide end of each cone reaches the surface overhead and
        // the narrow end tapers into the dark.
        position: [Math.cos(angle) * radius, -1, Math.sin(angle) * radius],
        rotation: [Math.PI, ((i % 3) - 1) * 0.09, ((i % 5) - 2) * 0.05],
        scale: [8 + (i % 4) * 4, 44, 8 + (i % 4) * 4],
        seed: i * 2.4,
      };
    });
  }, [lowQuality]);

  useFrame((state) => {
    // Keep a broad field of shafts around the diver. The old fixed ring left
    // the starting area and most travel paths with no volumetric water light.
    if (groupRef.current) {
      groupRef.current.position.x = state.camera.position.x;
      groupRef.current.position.z = state.camera.position.z;
    }
    if (reducedMotion) return;
    for (const mat of uniformsRef.current) {
      if (mat) mat.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <group ref={groupRef}>
      {shafts.map((s, i) => (
        <mesh key={i} position={s.position} rotation={s.rotation} scale={s.scale}>
          <coneGeometry args={[1, 1, 14, 1, true]} />
          <shaderMaterial
            ref={(m) => {
              if (m) uniformsRef.current[i] = m;
            }}
            vertexShader={VERT}
            fragmentShader={FRAG}
            uniforms={{
              uColor: { value: new THREE.Color('#8fe3ff') },
              uTime: { value: 0 },
              uSeed: { value: s.seed },
            }}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
