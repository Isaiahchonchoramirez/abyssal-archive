/**
 * Mutable input singleton.
 *
 * Deliberately NOT React state: keyboard, pointer and touch all write here every
 * frame, and routing that through setState would re-render the tree 60x/second.
 * R3F's own guidance is to keep per-frame values out of React. Consumers read it
 * inside useFrame.
 */
export const input = {
  /** -1..1, positive = swim forward */
  forward: 0,
  /** -1..1, positive = strafe right */
  strafe: 0,
  /** -1..1, positive = rise */
  rise: 0,
  /** Look deltas accumulated since the last frame, consumed and zeroed by the controller. */
  lookX: 0,
  lookY: 0,
  /** Set on E / tap, consumed centrally in World. */
  interact: false,
};

export function resetLook() {
  input.lookX = 0;
  input.lookY = 0;
}

export function clearInput() {
  input.forward = 0;
  input.strafe = 0;
  input.rise = 0;
  resetLook();
}
