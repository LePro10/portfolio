import { profile, site } from '@/content/profile';

export function Footer() {
  return (
    <footer className="pf-footer pf-site-footer">
      <span>© {new Date().getFullYear()} {profile.name}</span>
      <span>Self-hosted in {profile.location}. No templates, no tracking.</span>
      <span className="pf-site-footer__links">
        <a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a>
        <a href={site.dashboard}>Dashboard ↗</a>
        <a href="#top">Back to top ↑</a>
      </span>
    </footer>
  );
}
