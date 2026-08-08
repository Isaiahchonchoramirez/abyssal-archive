import { useStore } from '../app/store';
import { PROJECTS } from '../projects/projectData';

/**
 * The no-WebGL path. A recruiter reaches every piece of information here in one
 * interaction, and this is also what renders if the 3D scene ever fails.
 */
export function QuickPortfolio() {
  const open = useStore((s) => s.open);
  const begin = useStore((s) => s.begin);
  const webgl = useStore((s) => s.webgl);
  const openCredits = useStore((s) => s.openCredits);

  return (
    <main className="quick">
      <header className="quick__header">
        <h1>Isaiah Ramirez</h1>
        <p>Full-stack developer · interactive 3D · data and AI systems</p>

        {!webgl && (
          <p className="quick__notice">
            This browser can't run WebGL, so the 3D dive is unavailable. Every
            project is here in full.
          </p>
        )}

        <div className="quick__actions">
          <a className="btn" href="mailto:Isaiahramirez37@gmail.com">
            Email
          </a>
          {webgl && (
            <button type="button" className="btn btn--primary" onClick={begin}>
              Enter the dive instead
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={openCredits}>
            Credits
          </button>
        </div>
      </header>

      <section className="quick__list">
        <h2>Selected work</h2>
        {PROJECTS.map((p) => (
          <article key={p.slug} className="quick__card">
            <p className="quick__eyebrow">
              {p.category.toUpperCase()} · {p.year}
            </p>
            <h3>{p.title}</h3>
            <p>{p.summary}</p>
            <p className="quick__tech">{p.technologies.join(' · ')}</p>
            <div className="quick__card-actions">
              <button type="button" className="btn" onClick={() => open(p.slug)}>
                Read the case study
              </button>
              {/* The live builds ship in public/, so these work with the 3D
                  scene switched off entirely — which is the point of this page. */}
              {p.links.map((l) => (
                <a key={l.label} className="btn btn--ghost" href={l.href}>
                  {l.label}
                </a>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
