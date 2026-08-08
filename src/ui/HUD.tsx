import { useStore } from '../app/store';
import { bySlug } from '../projects/projectData';

export function HUD() {
  const pointerLocked = useStore((s) => s.pointerLocked);
  const nearby = useStore((s) => s.nearby);
  const active = useStore((s) => s.active);
  const lowQuality = useStore((s) => s.lowQuality);
  const target = useStore((s) => s.target);
  const targetDistance = useStore((s) => s.targetDistance);
  const quickPortfolio = useStore((s) => s.quickPortfolio);
  const openCredits = useStore((s) => s.openCredits);

  if (active) return null;

  const heading = bySlug(target);

  return (
    <div className="hud">
      <div className="hud__top">
        <p className="hud__brand">
          Isaiah Ramirez <span>· The Abyssal Archive</span>
        </p>
        <div className="hud__actions">
          <button type="button" className="btn btn--ghost" onClick={openCredits}>
            Credits
          </button>
          <button type="button" className="btn btn--ghost" onClick={quickPortfolio}>
            Skip to portfolio
          </button>
        </div>
      </div>

      {!pointerLocked && !lowQuality && <p className="hud__lock">Click to steer</p>}

      {/* The jellyfish used to point at the next project. You drive it now, so
          the HUD has to say which way the work is. */}
      {!nearby && heading && (
        <p className="hud__objective">
          Nearest · <em>{heading.title}</em>
          <span className="hud__distance">{targetDistance}m</span>
        </p>
      )}

      <p className="hud__keys">
        <kbd>WASD</kbd> swim <kbd>Space</kbd>/<kbd>Shift</kbd> depth{' '}
        <kbd>Mouse</kbd> orbit <kbd>E</kbd> inspect <kbd>P</kbd> perf
      </p>
    </div>
  );
}
