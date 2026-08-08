import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../../app/store';
import { BOUNDS_TOP, seafloorHeightAt } from '../oceanConfig';
import { input, resetLook } from './input';
import { player, rig, rigOffset } from './player';

const PITCH_MIN = THREE.MathUtils.degToRad(-38);
const PITCH_MAX = THREE.MathUtils.degToRad(72);

/** Underdamped on purpose: ζ ≈ 0.69, so hard turns overshoot a little and settle. */
const SPRING = 26;
const DAMPING = 7;
/** Reduced motion gets a critically damped rig — it still follows, it just never overshoots. */
const RM_SPRING = 90;
const RM_DAMPING = 19;

const LOOK_HEIGHT = 1.1; // aim above the bell rather than at its centre
const AIM_LAG = 9;
const CAMERA_CLEARANCE = 1.2;

const FOV_BASE = 62;
const FOV_RUSH = 69;

/**
 * Third-person rig. The camera trails the jellyfish; the mouse orbits it.
 *
 * The lag is the whole point — a rigid offset reads as a camera bolted to a
 * stick, and the jellyfish stops looking like it is moving through anything.
 * Position runs on a real spring rather than an exponential approach precisely
 * so it can overshoot: an exponential can only ever arrive, never swing past.
 */
export function FollowCamera() {
  const { camera } = useThree();

  const camVel = useRef(new THREE.Vector3());
  const desired = useRef(new THREE.Vector3());
  const offset = useRef(new THREE.Vector3());
  const aim = useRef(new THREE.Vector3(0, 0, 0));
  const aimTarget = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const { phase, active, reducedMotion } = useStore.getState();
    const frozen = phase !== 'diving' || active !== null;

    // ---- orbit ------------------------------------------------------------
    if (!frozen) {
      rig.yaw -= input.lookX;
      rig.pitch = THREE.MathUtils.clamp(
        rig.pitch + input.lookY,
        PITCH_MIN,
        PITCH_MAX,
      );
    }
    resetLook();

    // ---- follow -----------------------------------------------------------
    rigOffset(offset.current);
    desired.current.copy(player.position).add(offset.current);

    // Keep the lens out of the seabed and out of the surface. Without this the
    // camera buries itself in sand every time you swim along the floor.
    const floor = seafloorHeightAt(desired.current.x, desired.current.z);
    desired.current.y = THREE.MathUtils.clamp(
      desired.current.y,
      floor + CAMERA_CLEARANCE,
      BOUNDS_TOP + 4,
    );

    const stiffness = reducedMotion ? RM_SPRING : SPRING;
    const damping = reducedMotion ? RM_DAMPING : DAMPING;

    camVel.current
      .addScaledVector(desired.current, stiffness * dt)
      .addScaledVector(camera.position, -stiffness * dt)
      .multiplyScalar(Math.exp(-damping * dt));
    camera.position.addScaledVector(camVel.current, dt);

    // ---- aim --------------------------------------------------------------
    aimTarget.current.copy(player.position);
    aimTarget.current.y += LOOK_HEIGHT;
    aim.current.lerp(aimTarget.current, 1 - Math.exp(-AIM_LAG * dt));
    camera.lookAt(aim.current);

    // ---- speed rush -------------------------------------------------------
    const cam = camera as THREE.PerspectiveCamera;
    const targetFov = reducedMotion
      ? FOV_BASE
      : THREE.MathUtils.lerp(FOV_BASE, FOV_RUSH, player.speedRatio);
    if (Math.abs(cam.fov - targetFov) > 0.01) {
      cam.fov = THREE.MathUtils.damp(cam.fov, targetFov, 3, dt);
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
