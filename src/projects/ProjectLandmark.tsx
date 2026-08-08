import { Float, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState, type CSSProperties } from 'react';
import * as THREE from 'three';
import { useStore } from '../app/store';
import { player } from '../experience/controllers/player';
import type { Project } from './projectData';

const PROMPT_DISTANCE = 20;

/**
 * Layers 1 and 2 of project discovery: a silhouette readable from across the
 * zone, and a compact card that resolves as you approach. Layer 3 (the case
 * study) is HTML outside the canvas — long-form text does not belong in 3D.
 */
export function ProjectLandmark({ project }: { project: Project }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const [visible, setVisible] = useState(false);
  const wasNear = useRef(false);
  const reducedMotion = useStore((s) => s.reducedMotion);

  const anchor = useMemo(
    () => new THREE.Vector3(...project.position),
    [project.position],
  );
  const accent = useMemo(() => new THREE.Color(project.accent), [project.accent]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    // Measured from the jellyfish, not the camera. The camera trails by ~7.5
    // units and lags on a spring, so using it would arm the prompt before you
    // arrived and hold it after you left.
    const near = player.position.distanceTo(anchor) < PROMPT_DISTANCE;

    // Only touch React state on the threshold crossing, never per frame.
    if (near !== wasNear.current) {
      wasNear.current = near;
      setVisible(near);
      const store = useStore.getState();
      if (near) store.setNearby(project.slug);
      else if (store.nearby === project.slug) store.setNearby(null);
    }

    if (ringsRef.current && !reducedMotion) {
      ringsRef.current.rotation.x += dt * 0.18;
      ringsRef.current.rotation.y += dt * 0.24;
    }
  });

  return (
    <group ref={groupRef} position={project.position}>
      <Float
        speed={reducedMotion ? 0 : 1.2}
        rotationIntensity={reducedMotion ? 0 : 0.25}
        floatIntensity={reducedMotion ? 0 : 0.8}
      >
        <mesh>
          <icosahedronGeometry args={[2.1, 0]} />
          <meshStandardMaterial
            color="#0d222c"
            roughness={0.35}
            metalness={0.7}
            emissive={accent}
            emissiveIntensity={0.22}
          />
        </mesh>

        <group ref={ringsRef}>
          {[
            { r: 3.4, tube: 0.06, rot: [0, 0, 0] },
            { r: 4.2, tube: 0.045, rot: [Math.PI / 2.4, 0.4, 0] },
            { r: 5.1, tube: 0.03, rot: [0.6, 1.2, 0.3] },
          ].map((ring, i) => (
            <mesh key={i} rotation={ring.rot as [number, number, number]}>
              <torusGeometry args={[ring.r, ring.tube, 8, 64]} />
              {/* toneMapped must stay on: opting out sends raw linear colour
                  past ACES straight into bloom, which is what blew out. */}
              <meshBasicMaterial color={accent} />
            </mesh>
          ))}
        </group>
      </Float>

      {/* Beacon: the part that survives the fog and reads from 60m out. */}
      <mesh position={[0, 22, 0]}>
        <cylinderGeometry args={[0.35, 0.9, 44, 12, 1, true]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={0.03}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Physical units: with decay 2 the surface of the 2.1-radius core sits at
          intensity/d². 26 put it at ~6x white. 5 lands just above 1. */}
      <pointLight color={accent} distance={28} decay={2} intensity={5} />

      {visible && (
        <Html center distanceFactor={16} position={[0, 6.4, 0]} zIndexRange={[20, 0]}>
          <div className="prompt" style={{ '--accent': project.accent } as CSSProperties}>
            <p className="prompt__eyebrow">{project.category.toUpperCase()}</p>
            <h2 className="prompt__title">{project.title}</h2>
            <p className="prompt__summary">{project.summary}</p>
            <p className="prompt__tech">{project.technologies.join(' · ')}</p>
            <button
              type="button"
              className="prompt__cta"
              onClick={() => useStore.getState().open(project.slug)}
            >
              Inspect <kbd>E</kbd>
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}
