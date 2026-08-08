import { useProgress } from '@react-three/drei';
import { useStore } from '../app/store';

/**
 * Entry screen. Doubles as the gesture that grants pointer lock (and later,
 * audio) — browsers require a user action for both, so the gate is not
 * decorative.
 */
export function StartGate() {
  const { progress, active } = useProgress();
  const reducedMotion = useStore((s) => s.reducedMotion);
  const setReducedMotion = useStore((s) => s.setReducedMotion);
  const begin = useStore((s) => s.begin);
  const quickPortfolio = useStore((s) => s.quickPortfolio);
  const openCredits = useStore((s) => s.openCredits);

  const loading = active || progress < 100;

  return (
    <div className="gate">
      <div className="gate__inner">
        <p className="gate__eyebrow">Portfolio · Isaiah Ramirez</p>
        <h1 className="gate__title">The Abyssal Archive</h1>
        <p className="gate__lede">
          You are the jellyfish. Fifteen projects are sunk across this reef —
          swim out and open one.
        </p>

        <div className="gate__actions">
          <button
            type="button"
            className="btn btn--primary"
            disabled={loading}
            onClick={begin}
          >
            {loading ? `Filling the tank… ${Math.round(progress)}%` : 'Begin dive'}
          </button>
          <button type="button" className="btn" onClick={quickPortfolio}>
            Quick portfolio
          </button>
          <button type="button" className="btn btn--ghost" onClick={openCredits}>
            Credits
          </button>
        </div>

        <label className="gate__toggle">
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
          />
          <span>Reduce motion — calmer camera, no drift or bob</span>
        </label>

        <p className="gate__hint">
          <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> swim ·{' '}
          <kbd>Space</kbd> rise · <kbd>Shift</kbd> sink · mouse to orbit the
          camera · <kbd>E</kbd> inspect
        </p>
      </div>
    </div>
  );
}
