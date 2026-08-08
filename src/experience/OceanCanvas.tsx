import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { PerformanceMonitor } from '@react-three/drei';
import { Suspense, useState } from 'react';
import * as THREE from 'three';
import { useStore } from '../app/store';
import { World } from './World';

export function OceanCanvas({
  onCanvasReady,
}: {
  onCanvasReady: (el: HTMLCanvasElement | null) => void;
}) {
  const lowQuality = useStore((s) => s.lowQuality);
  const [dpr, setDpr] = useState(lowQuality ? 1 : 1.5);

  return (
    <Canvas
      ref={onCanvasReady}
      dpr={dpr}
      gl={{
        antialias: !lowQuality,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        // Headroom so a bright emissive rolls off instead of clipping to white.
        toneMappingExposure: 0.9,
      }}
      camera={{ fov: 62, near: 0.1, far: 220, position: [0, 0, 12] }}
    >
      {/* Drop resolution before dropping frames — cheaper than culling content. */}
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(0.75, d - 0.25))}
        onIncline={() => setDpr((d) => Math.min(lowQuality ? 1 : 1.75, d + 0.25))}
      />
      <Suspense fallback={null}>
        <World />
        <EffectComposer enableNormalPass={false}>
          {/* Threshold is the whole ballgame. At 0.22 the fog, the caustics and
              every emissive bloomed at once and looking at a landmark washed the
              frame to white. At 0.85 only genuinely hot pixels glow. */}
          <Bloom
            intensity={lowQuality ? 0.3 : 0.45}
            luminanceThreshold={0.85}
            luminanceSmoothing={0.28}
            mipmapBlur
          />
          <Vignette offset={0.28} darkness={0.72} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
