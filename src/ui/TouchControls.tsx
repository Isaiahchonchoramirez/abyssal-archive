import { useEffect, useRef, useState } from 'react';
import { input } from '../experience/controllers/input';

const STICK_RADIUS = 56;
const LOOK_SENSITIVITY = 0.005;

/**
 * Touch fallback: a virtual stick on the left half for swimming, drag anywhere
 * on the right to look. Writes to the same input singleton as the keyboard, so
 * the controller needs no knowledge of the input device.
 */
export function TouchControls() {
  const layerRef = useRef<HTMLDivElement>(null);
  const stickId = useRef<number | null>(null);
  const lookId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const lastLook = useRef({ x: 0, y: 0 });
  const [knob, setKnob] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      const isLeft = e.clientX < window.innerWidth * 0.5;
      if (isLeft && stickId.current === null) {
        stickId.current = e.pointerId;
        origin.current = { x: e.clientX, y: e.clientY };
        setKnob({ x: 0, y: 0 });
      } else if (!isLeft && lookId.current === null) {
        lookId.current = e.pointerId;
        lastLook.current = { x: e.clientX, y: e.clientY };
      }
      el.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerId === stickId.current) {
        const dx = e.clientX - origin.current.x;
        const dy = e.clientY - origin.current.y;
        const dist = Math.hypot(dx, dy);
        const clamp = Math.min(dist, STICK_RADIUS);
        const nx = dist > 0 ? (dx / dist) * clamp : 0;
        const ny = dist > 0 ? (dy / dist) * clamp : 0;
        setKnob({ x: nx, y: ny });
        input.strafe = nx / STICK_RADIUS;
        input.forward = -ny / STICK_RADIUS;
      } else if (e.pointerId === lookId.current) {
        input.lookX += (e.clientX - lastLook.current.x) * LOOK_SENSITIVITY;
        input.lookY += (e.clientY - lastLook.current.y) * LOOK_SENSITIVITY;
        lastLook.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId === stickId.current) {
        stickId.current = null;
        setKnob(null);
        input.forward = 0;
        input.strafe = 0;
      } else if (e.pointerId === lookId.current) {
        lookId.current = null;
      }
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <>
      <div ref={layerRef} className="touch-layer" aria-hidden="true">
        {knob && (
          <div
            className="touch-stick"
            style={{ left: origin.current.x, top: origin.current.y }}
          >
            <div
              className="touch-stick__knob"
              style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
            />
          </div>
        )}
      </div>
      <div className="touch-vertical">
        <button
          type="button"
          aria-label="Rise"
          onPointerDown={() => (input.rise = 1)}
          onPointerUp={() => (input.rise = 0)}
          onPointerLeave={() => (input.rise = 0)}
        >
          ▲
        </button>
        <button
          type="button"
          aria-label="Sink"
          onPointerDown={() => (input.rise = -1)}
          onPointerUp={() => (input.rise = 0)}
          onPointerLeave={() => (input.rise = 0)}
        >
          ▼
        </button>
      </div>
    </>
  );
}
