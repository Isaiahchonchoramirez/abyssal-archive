import { useFrame } from '@react-three/fiber';
import { useStore } from '../app/store';
import { PROJECTS } from '../projects/projectData';
import { ProjectLandmark } from '../projects/ProjectLandmark';
import { JellyfishPlayer } from '../creatures/JellyfishPlayer';
import { Wildlife } from '../creatures/Wildlife';
import { FollowCamera } from './controllers/FollowCamera';
import { input } from './controllers/input';
import { player } from './controllers/player';
import { Godrays } from './environment/Godrays';
import { MarineSnow } from './environment/MarineSnow';
import { Seafloor } from './environment/Seafloor';
import { WaterSurface } from './environment/WaterSurface';
import { FOG_COLOR, FOG_DENSITY } from './oceanConfig';

/** Consumes the interact flag centrally so landmarks stay presentational. */
function InteractHandler() {
  useFrame(() => {
    if (!input.interact) return;
    input.interact = false;
    const { nearby, active, open } = useStore.getState();
    if (nearby && !active) open(nearby);
  });
  return null;
}

/**
 * Names the closest landmark for the HUD.
 *
 * The jellyfish used to be the guide, so "where do I go next" was answered by
 * watching it. Now that you drive it, nothing pointed anywhere — fifteen
 * beacons in fog with no hint which is nearest. Fifteen distance checks a frame
 * is nothing; the store only hears about it when the answer changes.
 */
function NavigationTracker() {
  useFrame(() => {
    let best: string | null = null;
    let bestDist = Infinity;
    for (const p of PROJECTS) {
      const dx = player.position.x - p.position[0];
      const dy = player.position.y - p.position[1];
      const dz = player.position.z - p.position[2];
      const d = dx * dx + dy * dy + dz * dz;
      if (d < bestDist) {
        bestDist = d;
        best = p.slug;
      }
    }
    const store = useStore.getState();
    if (store.target !== best) store.setTarget(best);
    const rounded = Math.round(Math.sqrt(bestDist));
    if (store.targetDistance !== rounded) store.setTargetDistance(rounded);
  });
  return null;
}

export function World() {
  return (
    <>
      <fogExp2 attach="fog" args={[FOG_COLOR, FOG_DENSITY]} />
      {/* Matching the fog colour: otherwise the water plane clips against a
          different background at the far plane and draws a visible horizon seam. */}
      <color attach="background" args={[FOG_COLOR]} />

      {/* Deep water is dark. Fill light exists to keep silhouettes readable,
          not to light the scene like a showroom. */}
      <hemisphereLight args={['#7fd8ff', '#07202b', 0.35]} />
      <ambientLight color="#3d7f95" intensity={0.22} />
      <directionalLight
        position={[14, 40, 8]}
        color="#a8ecff"
        intensity={0.9}
      />

      <WaterSurface />
      <Seafloor />
      <Godrays />
      <MarineSnow />
      <Wildlife />
      <JellyfishPlayer />

      {PROJECTS.map((project) => (
        <ProjectLandmark key={project.slug} project={project} />
      ))}

      <FollowCamera />
      <InteractHandler />
      <NavigationTracker />
    </>
  );
}
