import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../../app/store';
import { FOG_COLOR, FOG_DENSITY, SURFACE_Y } from '../oceanConfig';

const SIZE = 900;
const SEGMENTS = 180;

const VERT = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vWaveHeight;

  float wave(vec2 p, vec2 direction, float frequency, float speed, float amplitude) {
    return sin(dot(p, normalize(direction)) * frequency + uTime * speed) * amplitude;
  }

  float waterHeight(vec2 p) {
    float h = 0.0;
    h += wave(p, vec2(1.0, 0.35), 0.105, 0.68, 1.05);
    h += wave(p, vec2(-0.42, 1.0), 0.18, 1.02, 0.52);
    h += wave(p, vec2(0.72, -1.0), 0.32, 1.38, 0.24);
    h += wave(p, vec2(-1.0, -0.18), 0.56, 1.9, 0.1);
    return h;
  }

  void main() {
    vec3 displaced = position;
    displaced.z += waterHeight(position.xy);

    // Central differences keep the geometric waves and lighting normal in sync.
    float e = 0.18;
    float dx = waterHeight(position.xy + vec2(e, 0.0)) - waterHeight(position.xy - vec2(e, 0.0));
    float dy = waterHeight(position.xy + vec2(0.0, e)) - waterHeight(position.xy - vec2(0.0, e));
    vec3 objectNormal = normalize(vec3(-dx, -dy, 2.0 * e));

    vec4 wp = modelMatrix * vec4(displaced, 1.0);
    vWorldPos = wp.xyz;
    vNormal = normalize(mat3(modelMatrix) * objectNormal);
    vWaveHeight = displaced.z;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCamPos;
  uniform vec3 uDeep;
  uniform vec3 uSky;
  uniform vec3 uSun;
  uniform vec3 uSunDir;
  uniform vec3 uFogColor;
  uniform float uFogDensity;

  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vWaveHeight;

  /**
   * Analytic normal from three travelling sine waves. Cheaper and smoother than
   * sampling a normal map, and it never tiles visibly across a 900-unit plane.
   */
  vec3 detailNormal(vec2 p, float t) {
    float dx = 0.0;
    float dz = 0.0;

    vec2 k1 = vec2(0.14, 0.09);
    float ph1 = dot(k1, p) + t * 0.9;
    dx += 0.9 * k1.x * cos(ph1);
    dz += 0.9 * k1.y * cos(ph1);

    vec2 k2 = vec2(-0.19, 0.23);
    float ph2 = dot(k2, p) + t * 1.3;
    dx += 0.5 * k2.x * cos(ph2);
    dz += 0.5 * k2.y * cos(ph2);

    vec2 k3 = vec2(0.41, -0.33);
    float ph3 = dot(k3, p) + t * 1.9;
    dx += 0.22 * k3.x * cos(ph3);
    dz += 0.22 * k3.y * cos(ph3);

    vec2 k4 = vec2(-0.73, -0.51);
    float ph4 = dot(k4, p) + t * 2.35;
    dx += 0.08 * k4.x * cos(ph4);
    dz += 0.08 * k4.y * cos(ph4);

    return normalize(vec3(-dx, 1.0, -dz));
  }

  void main() {
    float surfaceDistance = length(vWorldPos - uCamPos);
    float proximity = 1.0 - smoothstep(5.0, 28.0, surfaceDistance);
    vec3 micro = detailNormal(vWorldPos.xz * 1.7, uTime);
    vec3 n = normalize(vNormal + vec3(micro.x, 0.0, micro.z) * mix(0.42, 0.78, proximity));
    vec3 viewDir = normalize(vWorldPos - uCamPos); // water to air incident ray

    float cosT = clamp(dot(viewDir, n), 0.0, 1.0);

    // Water-to-air refraction (IOR 1.33). A zero vector means total internal
    // reflection. This makes the sky and sun bend with the actual wave normals
    // instead of painting a caustic texture onto the ceiling.
    vec3 refracted = refract(viewDir, -n, 1.33);
    float transmits = step(0.001, dot(refracted, refracted));
    refracted = normalize(refracted + vec3(0.00001));
    float skyHeight = smoothstep(0.0, 0.92, max(refracted.y, 0.0));
    vec3 sky = mix(vec3(0.24, 0.66, 0.78), uSky, skyHeight);
    float sunAmt = pow(max(dot(refracted, uSunDir), 0.0), 180.0);
    sky = mix(sky, uSun, sunAmt);

    // Schlick Fresnel for water. At grazing angles the underside reflects the
    // dark water column; face-on it opens into the bright refracted sky.
    const float f0 = 0.02037;
    float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosT, 5.0);
    float window = transmits * smoothstep(0.62, 0.72, cosT);
    vec3 reflectedWater = mix(uDeep, vec3(0.035, 0.19, 0.24), n.y * 0.5 + 0.5);
    vec3 col = mix(reflectedWater, sky, window * (1.0 - fresnel));

    // Facet shading gives the bright Snell window internal structure. This is
    // illumination from the changing surface normal, not a caustic texture.
    float facet = clamp(
      0.82 + n.y * 0.16 + dot(n.xz, normalize(vec2(0.72, -0.38))) * 0.16,
      0.72,
      1.12
    );
    col *= mix(1.0, facet, window * mix(0.45, 0.9, proximity));

    // Subtle crest/trough tonality follows displaced geometry, not a projected
    // pattern. It is strongest nearby so the surface visibly rolls overhead.
    float crest = smoothstep(0.35, 1.45, vWaveHeight);
    float trough = 1.0 - smoothstep(-1.45, -0.25, vWaveHeight);
    col += uSky * crest * mix(0.015, 0.09, proximity);
    col *= 1.0 - trough * mix(0.02, 0.11, proximity);

    // Sun streaks stretch naturally across wave facets.
    float sunFacet = pow(max(dot(n, uSunDir), 0.0), 48.0) * window;
    col += uSun * sunFacet * 0.38;

    // Manual fog: this is a raw ShaderMaterial, so three's fog chunks are not
    // injected and the surface would otherwise stay sharp out to the horizon.
    float fogAmt = 1.0 - exp(-uFogDensity * uFogDensity * surfaceDistance * surfaceDistance);
    col = mix(col, uFogColor, clamp(fogAmt, 0.0, 1.0));

    gl_FragColor = vec4(col, 1.0);
  }
`;

/**
 * The underside of the ocean surface.
 *
 * Without this the scene has no ceiling, so looking up shows empty fog and the
 * world reads as a sealed box no matter how far the walls are pushed out.
 */
export function WaterSurface() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const reducedMotion = useStore((s) => s.reducedMotion);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCamPos: { value: new THREE.Vector3() },
      uDeep: { value: new THREE.Color('#06222f') },
      uSky: { value: new THREE.Color('#9fe4ff') },
      uSun: { value: new THREE.Color('#fff4d6') },
      uSunDir: { value: new THREE.Vector3(14, 40, 8).normalize() },
      uFogColor: { value: new THREE.Color(FOG_COLOR) },
      uFogDensity: { value: FOG_DENSITY },
    }),
    [],
  );

  useFrame((state, delta) => {
    if (!matRef.current) return;
    if (!reducedMotion) uniforms.uTime.value += Math.min(delta, 1 / 30);
    uniforms.uCamPos.value.copy(state.camera.position);
  });

  return (
    <mesh position={[0, SURFACE_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
      <planeGeometry args={[SIZE, SIZE, SEGMENTS, SEGMENTS]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
