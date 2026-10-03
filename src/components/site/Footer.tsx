import { BackToTop } from '@/components/chrome/BackToTop';
import { ZurichClock } from '@/components/chrome/ZurichClock';
import { profile, site } from '@/content/profile';

/**
 * Abschluss jeder Seite: oben Links und die echte Ortszeit, darunter der Name als grosse,
 * weiche Wortmarke, die beim Hereinscrollen Buchstabe für Buchstabe aufsteigt (Reveal).
 */
export function Footer() {
  return (
    <footer className="pf-site-footer pf-signoff">
      <div className="pf-signoff__top">
        <nav className="pf-signoff__links" aria-label="Footer">
          <a href={`mailto:${profile.email}`}>Email ↗</a>
          <a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a>
          <a href={site.dashboard}>Dashboard ↗</a>
        </nav>
        <p className="pf-signoff__clock"><span>Local time in {profile.location}</span><ZurichClock /></p>
      </div>
      <p className="pf-signoff__mark" data-reveal="">
        <span className="pf-sr">{profile.name}</span>
        <span aria-hidden="true">
          {[...profile.name].map((c, i) => <span key={i} style={{ '--i': i } as React.CSSProperties}>{c === ' ' ? ' ' : c}</span>)}
        </span>
      </p>
      <div className="pf-footer">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <span>Self-hosted in {profile.location}. No templates, no tracking.</span>
        <BackToTop label="Back to top" />
      </div>
    </footer>
  );
}
