import { useEffect } from 'react';
import { useStore } from '../../app/store';
import { input, clearInput } from './input';

const KEY_MAP: Record<string, keyof typeof BINDINGS> = {
  keyw: 'forward',
  arrowup: 'forward',
  keys: 'back',
  arrowdown: 'back',
  keya: 'left',
  arrowleft: 'left',
  keyd: 'right',
  arrowright: 'right',
  space: 'up',
  shiftleft: 'down',
  shiftright: 'down',
};

const BINDINGS = {
  forward: false,
  back: false,
  left: false,
  right: false,
  up: false,
  down: false,
};

const LOOK_SENSITIVITY = 0.0022;

function applyAxes() {
  input.forward = (BINDINGS.forward ? 1 : 0) - (BINDINGS.back ? 1 : 0);
  input.strafe = (BINDINGS.right ? 1 : 0) - (BINDINGS.left ? 1 : 0);
  input.rise = (BINDINGS.up ? 1 : 0) - (BINDINGS.down ? 1 : 0);
}

/**
 * Binds keyboard + pointer-lock look to the input singleton.
 * Mounted once, outside the Canvas, so it survives WebGL context changes.
 */
export function useInputBindings(canvas: HTMLElement | null) {
  useEffect(() => {
    const isTyping = () => {
      const el = document.activeElement;
      if (!el) return false;
      return (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        (el as HTMLElement).isContentEditable
      );
    };

    const setKey = (down: boolean) => (e: KeyboardEvent) => {
      if (isTyping()) return;
      const code = e.code.toLowerCase();
      const binding = KEY_MAP[code];
      if (binding) {
        // Space would otherwise scroll the page behind the canvas.
        if (code === 'space') e.preventDefault();
        BINDINGS[binding] = down;
        applyAxes();
        return;
      }
      if (!down) return;
      if (code === 'keye') input.interact = true;
      if (code === 'keyp') useStore.getState().togglePerf();
      if (code === 'escape') useStore.getState().close();
    };

    const onDown = setKey(true);
    const onUp = setKey(false);
    // Held keys would stick "on" forever if the user alt-tabs mid-swim.
    const onBlur = () => {
      (Object.keys(BINDINGS) as (keyof typeof BINDINGS)[]).forEach(
        (k) => (BINDINGS[k] = false),
      );
      clearInput();
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    if (!canvas) return;

    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      input.lookX += e.movementX * LOOK_SENSITIVITY;
      input.lookY += e.movementY * LOOK_SENSITIVITY;
    };

    const onLockChange = () => {
      const locked = document.pointerLockElement === canvas;
      useStore.getState().setPointerLocked(locked);
      if (!locked) clearInput();
    };

    const onClick = () => {
      const { phase, active } = useStore.getState();
      if (phase !== 'diving' || active) return;
      if (document.pointerLockElement !== canvas) {
        // Safari rejects the promise if the user exited lock <1s ago; harmless.
        void (canvas.requestPointerLock() as unknown as Promise<void> | undefined)?.catch?.(
          () => {},
        );
      }
    };

    canvas.addEventListener('click', onClick);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('pointerlockchange', onLockChange);
    return () => {
      canvas.removeEventListener('click', onClick);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('pointerlockchange', onLockChange);
    };
  }, [canvas]);
}
