import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../../app/store';

const BOX = 70;

const VERT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCam;
  uniform float uBox;
  uniform float uSize;
  attribute float aScale;
  attribute float aSpeed;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    p.y -= uTime * aSpeed;
    p.x += sin(uTime * 0.25 + position.z * 0.4) * 0.6;
    p.z += cos(uTime * 0.19 + position.x * 0.4) * 0.6;

    // Wrap the field into a box that travels with the camera, so a finite
    // number of particles reads as an endless drift.
    vec3 rel = mod(p - uCam + uBox * 0.5, uBox) - uBox * 0.5;
    vec4 mv = modelViewMatrix * vec4(uCam + rel, 1.0);
    float dist = -mv.z;

    // Fade in past the near lens and out before the wrap seam.
    vAlpha = smoothstep(1.5, 6.0, dist) * (1.0 - smoothstep(uBox * 0.3, uBox * 0.5, dist));

    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * (210.0 / max(dist, 0.001));
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);
    if (d > 0.25) discard;
    gl_FragColor = vec4(uColor, smoothstep(0.25, 0.0, d) * vAlpha * 0.28);
  }
`;

/** Suspended particulate. Sells scale and motion more cheaply than any geometry. */
export function MarineSnow() {
  const lowQuality = useStore((s) => s.lowQuality);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const count = lowQuality ? 500 : 1400;
  const { camera } = useThree();
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * BOX;
      positions[i * 3 + 1] = (Math.random() - 0.5) * BOX;
      positions[i * 3 + 2] = (Math.random() - 0.5) * BOX;
      scales[i] = 0.4 + Math.random() * 1.6;
      speeds[i] = 0.15 + Math.random() * 0.5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    // The shader repositions every point, so an auto-computed sphere would be
    // wrong and cull the whole field.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCam: { value: new THREE.Vector3() },
      uBox: { value: BOX },
      uSize: { value: 0.62 },
      uColor: { value: new THREE.Color('#cfefff') },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (!matRef.current) return;
    if (!reducedMotion) uniforms.uTime.value += Math.min(delta, 1 / 30);
    uniforms.uCam.value.copy(camera.position);
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}
