import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../../app/store';
import { FLOOR_Y, seafloorReliefAt, SEAFLOOR_SIZE as SIZE } from '../oceanConfig';

export function Seafloor() {
  const lowQuality = useStore((s) => s.lowQuality);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const timeRef = useRef({ value: 0 });

  const geometry = useMemo(() => {
    // Kept proportional to SIZE so the relief density survived widening the world.
    const segments = lowQuality ? 64 : 140;
    const g = new THREE.PlaneGeometry(SIZE, SIZE, segments, segments);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      // Plane is built in XY and rotated flat later, so y here is world z.
      // Local plane Y becomes negative world Z after the mesh rotation.
      pos.setZ(i, seafloorReliefAt(pos.getX(i), -pos.getY(i)));
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, [lowQuality]);

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: '#80765d',
      roughness: 0.96,
      metalness: 0,
    });

    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = timeRef.current;

      shader.vertexShader = shader.vertexShader
        .replace('void main()', 'varying vec2 vFloorUv;\nvoid main()')
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvFloorUv = (modelMatrix * vec4(position, 1.0)).xz;',
        );

      // Hooking emissive keeps three's own fog and lighting chunks intact —
      // the caustics ride on top of the standard material instead of replacing it.
      shader.fragmentShader = shader.fragmentShader
        .replace(
          'void main()',
          `
          uniform float uTime;
          varying vec2 vFloorUv;

          float hash21(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }

          float valueNoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
              mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), f.x),
              f.y
            );
          }

          // Analytic slope of the same current ripples used by the sand color.
          // This gives the ridges physical light response without a 600 MB map
          // or the million-plus vertices their tight spacing would require.
          vec2 sandRippleGradient(vec2 p) {
            float bend = sin(p.y * 2.075) * 1.7
                       + sin(p.y * 2.021 + 3.4) * 3.2;
            float bendDy = cos(p.y * 2.075) * 2.075 * 1.7
                         + cos(p.y * 2.021 + 3.4) * 2.021 * 3.2;
            float phase = p.x * 10.0 + bend;
            // 0.075 world units of apparent relief. Clamp the slope so the
            // tight user-set frequency stays sandy rather than corrugated metal.
            float slope = cos(phase) * 0.075;
            return clamp(vec2(slope * 10.0, slope * bendDy), vec2(-0.72), vec2(0.72));
          }

          float caustic(vec2 p, float t) {
            vec2 i = p;
            float c = 1.0;
            const float inten = 0.005;
            for (int n = 0; n < 3; n++) {
              float tt = t * (1.0 - (3.5 / float(n + 1)));
              i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
              c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
            }
            c /= 3.0;
            // 1.0/length() above can spike arbitrarily high, and pow(x, 8.0)
            // then turns that into thousands. Unclamped it wrote wave-shaped
            // white patches straight into emissive. Bound it before the power.
            c = clamp(1.17 - pow(c, 1.4), 0.0, 1.0);
            return pow(c, 8.0);
          }

          void main()`,
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
           // Broad mineral variation stops the 460-unit floor reading as one
           // painted plane. Two scales avoid obvious tiling.
           float mineral = valueNoise(vFloorUv * 0.035);
           mineral = mix(mineral, valueNoise(vFloorUv * 0.11), 0.28);

           // Long, slightly wandering ridges shaped by a prevailing current.
           // The narrow bright lip and broad dark lee side give each ripple relief.
           float bend = sin(vFloorUv.y * 2.075) * 1.7
                      + sin(vFloorUv.y * 2.021 + 3.4) * 3.2;
           float phase = vFloorUv.x * 10.0 + bend;
           float rippleWave = sin(phase);
           float ridge = pow(max(rippleWave, 0.0), 10.0);
           float lee = smoothstep(-0.85, 0.2, -rippleWave);

           // Fine grain is deliberately low contrast and fades with screen
           // footprint, preventing noisy shimmer in the distance.
           float grain = valueNoise(vFloorUv * 3.4);
           float microGrain = valueNoise(vFloorUv * 11.5 + vec2(17.2, -8.4));
           float coarseGrain = valueNoise(vFloorUv * 1.35 + vec2(-3.1, 9.7));
           float footprint = max(fwidth(vFloorUv.x), fwidth(vFloorUv.y));
           float grainFade = 1.0 - smoothstep(0.12, 0.8, footprint);

           vec3 silt = vec3(0.19, 0.205, 0.17);
           vec3 wetSand = vec3(0.34, 0.315, 0.235);
           vec3 shellSand = vec3(0.49, 0.445, 0.31);
           vec3 sand = mix(silt, wetSand, 0.35 + mineral * 0.48);
           sand *= 0.88 + lee * 0.09;
           sand = mix(sand, shellSand, ridge * 0.34);
           float grainMix = (grain - 0.5) * 0.22
                          + (microGrain - 0.5) * 0.16
                          + (coarseGrain - 0.5) * 0.12;
           sand *= 0.96 + grainMix * grainFade;
           // Sparse pale grains suggest shell fragments without becoming dots.
           float shellFleck = smoothstep(0.91, 0.985, microGrain) * grainFade;
           sand = mix(sand, shellSand, shellFleck * 0.2);
           diffuseColor.rgb = sand;`,
        )
        .replace(
          '#include <normal_fragment_maps>',
          `#include <normal_fragment_maps>
           vec2 rippleGrad = sandRippleGradient(vFloorUv);
           vec3 rippleWorldNormal = normalize(vec3(-rippleGrad.x, 1.0, -rippleGrad.y));
           vec3 rippleViewNormal = normalize(mat3(viewMatrix) * rippleWorldNormal);
           // Blend preserves the large terrain normals while giving each sand
           // ridge enough thickness to catch caustics and directional light.
           normal = normalize(mix(normal, rippleViewNormal, 0.58));`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
           float caus = caustic(vFloorUv * 0.35, uTime * 0.35);
           // Strong enough to read as focused sunlight, but below the original
           // level that made the terrain itself resemble a water surface.
           totalEmissiveRadiance += vec3(0.15, 0.4, 0.48) * caus * 0.62;`,
        );
    };

    return m;
  }, []);

  useFrame((state) => {
    if (!reducedMotion) timeRef.current.value = state.clock.elapsedTime;
  });

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, FLOOR_Y, 0]}
      receiveShadow={false}
    />
  );
}
