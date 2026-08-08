import { useEffect, useRef } from 'react';
import { useStore } from '../app/store';
import { MODEL_CREDITS } from '../creatures/modelCredits';

/**
 * Attribution panel. Reachable from the HUD, the gate and the quick portfolio,
 * because CC-BY attribution has to reach whoever sees the work — and two of the
 * three entry paths never touch the HUD.
 */
export function Credits() {
  const credits = useStore((s) => s.credits);
  const close = useStore((s) => s.closeCredits);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!credits) return;
    if (document.pointerLockElement) document.exitPointerLock();
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [credits, close]);

  if (!credits) return null;

  return (
    <div
      className="credits"
      role="dialog"
      aria-modal="true"
      aria-labelledby="credits-title"
    >
      <div className="credits__panel">
        <h2 id="credits-title">Credits</h2>
        <p className="credits__lede">
          The creatures in this ocean are licensed work by other people, used
          under Creative Commons Attribution 4.0. Everything else — the world,
          the water, the code and the projects — is mine.
        </p>

        <ul className="credits__list">
          {MODEL_CREDITS.map((c) => (
            <li key={c.file}>
              <a href={c.source} target="_blank" rel="noreferrer noopener">
                {c.title}
              </a>{' '}
              by{' '}
              <a href={c.authorUrl} target="_blank" rel="noreferrer noopener">
                {c.author}
              </a>{' '}
              —{' '}
              <a href={c.licenseUrl} target="_blank" rel="noreferrer noopener">
                {c.license}
              </a>
            </li>
          ))}
        </ul>

        <button ref={closeRef} type="button" className="btn" onClick={close}>
          Close <kbd>Esc</kbd>
        </button>
      </div>
    </div>
  );
}
