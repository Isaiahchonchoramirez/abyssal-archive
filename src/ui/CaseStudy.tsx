import { useEffect, useRef, type CSSProperties } from 'react';
import { useStore } from '../app/store';
import { bySlug } from '../projects/projectData';

/**
 * Layer 3 of project discovery. Plain HTML on purpose: this is the content a
 * recruiter has to be able to read, copy, translate and screen-read.
 */
export function CaseStudy() {
  const active = useStore((s) => s.active);
  const close = useStore((s) => s.close);
  const phase = useStore((s) => s.phase);
  const project = bySlug(active);
  const returnLabel = phase === 'quick' ? 'Back to projects' : 'Return to the dive';
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!project) return;
    // Pointer lock and a readable overlay cannot coexist.
    if (document.pointerLockElement) document.exitPointerLock();
    closeRef.current?.focus();
  }, [project]);

  if (!project) return null;

  return (
    <div
      className="study"
      role="dialog"
      aria-modal="true"
      aria-labelledby="study-title"
      style={{ '--accent': project.accent } as CSSProperties}
    >
      <div className="study__scroll">
        <header className="study__header">
          <p className="study__eyebrow">
            {project.category.toUpperCase()} · {project.year}
          </p>
          <h1 id="study-title" className="study__title">
            {project.title}
          </h1>
          <p className="study__summary">{project.summary}</p>
          <dl className="study__meta">
            <div>
              <dt>Role</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt>Stack</dt>
              <dd>{project.technologies.join(' · ')}</dd>
            </div>
          </dl>
        </header>

        <section className="study__section">
          <h2>Problem</h2>
          <p>{project.caseStudy.problem}</p>
        </section>

        <section className="study__section">
          <h2>Process</h2>
          <p>{project.caseStudy.process}</p>
        </section>

        <section className="study__section">
          <h2>Decisions</h2>
          <ul>
            {project.caseStudy.decisions.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>

        <section className="study__section">
          <h2>Outcome</h2>
          <p>{project.caseStudy.outcome}</p>
        </section>

        <section className="study__section">
          <h2>What I'd do differently</h2>
          <p>{project.caseStudy.lessons}</p>
        </section>

        <div className="study__links">
          {project.links.map((l) => (
            <a key={l.label} href={l.href} className="btn">
              {l.label}
            </a>
          ))}
        </div>
      </div>

      <button
        ref={closeRef}
        type="button"
        className="study__close"
        onClick={close}
        aria-label={`Close case study — ${returnLabel}`}
      >
        {returnLabel} <kbd>Esc</kbd>
      </button>
    </div>
  );
}
