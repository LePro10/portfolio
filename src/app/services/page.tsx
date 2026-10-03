import type { Metadata } from 'next';
import { RainbowButton } from '@/components/buttons/RainbowButton';
import { ShinyButton } from '@/components/buttons/ShinyButton';
import { Light } from '@/components/light/Light';
import type { Palette } from '@/components/light/palettes';
import { profile } from '@/content/profile';
import { faq, packages, process } from '@/content/services';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Website, web app or AI integration: three packages, one clear process and a fixed-price offer after the first call.',
};

/** Jedes Paket hat sein eigenes Licht: kühl für Websites, Luna für Apps, Glut für KI. */
const PACKAGE_LIGHT: Palette[] = ['ice', 'luna', 'ember'];

export default function ServicesPage() {
  return (
    <main className="pf-page" style={{ '--hue': 'var(--pf-t-sand)' } as React.CSSProperties}>
      <Light palette="sand" seed={4} className="pf-light--top" />
      <header className="pf-page__head">
        <span className="index">Services · {packages.length} packages</span>
        <h1>Three packages.<br /><span className="pf-soft">One standard.</span></h1>
        <p>Concept, design, code and hosting from one person. You get a fixed-price offer before anything starts.</p>
      </header>

      <section className="pf-page__block pf-packages" aria-label="Packages">
        {packages.map((p, i) => (
          <article key={p.title} className="pf-package pf-card">
            <Light palette={PACKAGE_LIGHT[i % PACKAGE_LIGHT.length]} seed={i + 2} intensity={0.7} className="pf-package__light" />
            <span className="pf-package__nr">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h2>{p.title}</h2>
              <p>{p.audience}</p>
              <p className="pf-package__tags">{p.tags}</p>
            </div>
            <ul>{p.scope.map((s) => <li key={s}>{s}</li>)}</ul>
          </article>
        ))}
      </section>

      <section className="pf-page__block">
        <span className="index">Process</span>
        <h2 className="pf-page__h2">How I work.</h2>
        <ol className="pf-steps">
          {process.map((s, i) => (
            <li key={s.title}><span>{i + 1}</span><h3>{s.title}</h3><p>{s.description}</p></li>
          ))}
        </ol>
      </section>

      <section className="pf-page__block">
        <span className="index">Questions</span>
        <h2 className="pf-page__h2">Honest answers.</h2>
        <div className="pf-faq">
          {faq.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="pf-page__block pf-page__cta">
        <h2 className="pf-page__h2">Does one of these fit?</h2>
        <div className="pf-contact__actions">
          <ShinyButton href={`mailto:${profile.email}?subject=${encodeURIComponent('Project request')}`}>Email me</ShinyButton>
          <RainbowButton href="/#work">See my work</RainbowButton>
        </div>
      </section>
    </main>
  );
}
