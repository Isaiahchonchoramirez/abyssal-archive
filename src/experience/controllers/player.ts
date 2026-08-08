import * as THREE from 'three';

/**
 * Where the player actually is.
 *
 * The jellyfish owns this; the camera, the landmarks and the wildlife read it.
 * Same reasoning as the input singleton — this changes every frame, so it must
 * not live in React state or the whole tree re-renders 60x/second.
 *
 * Before the control inversion the camera *was* the player, so everything could
 * just read `state.camera.position`. It can't any more: the camera trails the
 * jellyfish by design, and proximity measured from a lagging camera pops the
 * inspect prompt at the wrong moment.
 */
export const player = {
  position: new THREE.Vector3(0, 0, 0),
  velocity: new THREE.Vector3(),
  /** Body heading in radians. 0 points down -Z, matching the camera rig. */
  heading: 0,
  /** 0..1 fraction of cruise speed. Drives the camera's FOV push. */
  speedRatio: 0,
};

/**
 * The orbit the camera hangs on.
 *
 * The jellyfish builds its movement basis from `yaw` directly rather than from
 * the live camera, because the camera lags on purpose. Reading the lagging
 * transform back as the input basis is a feedback loop: you steer, the basis
 * you steered against arrives late, and hard turns wander.
 */
export const rig = {
  yaw: 0,
  /** Positive looks down on the jellyfish from above. */
  pitch: 0.16,
  /**
   * 7.5 was the old guide's standoff and it is far too close to sit behind:
   * the bell filled two-thirds of the frame and you could not see the reef you
   * were steering through.
   */
  distance: 13,
};

// Dev-only handle for driving the camera around from the console while
// checking model orientation and scale. Stripped from production builds.
if (import.meta.env.DEV) {
  Object.assign(globalThis, { __player: player, __rig: rig });
}

export function resetPlayer() {
  player.position.set(0, 0, 0);
  player.velocity.set(0, 0, 0);
  player.heading = 0;
  player.speedRatio = 0;
  rig.yaw = 0;
  rig.pitch = 0.16;
}

/** Horizontal basis for "away from the camera", derived from the orbit yaw. */
export function movementBasis(forward: THREE.Vector3, right: THREE.Vector3) {
  const s = Math.sin(rig.yaw);
  const c = Math.cos(rig.yaw);
  forward.set(-s, 0, -c);
  right.set(c, 0, -s);
}

/** Where the camera wants to sit relative to the jellyfish. */
export function rigOffset(out: THREE.Vector3) {
  const cp = Math.cos(rig.pitch);
  return out.set(
    Math.sin(rig.yaw) * cp,
    Math.sin(rig.pitch),
    Math.cos(rig.yaw) * cp,
  ).multiplyScalar(rig.distance);
}
