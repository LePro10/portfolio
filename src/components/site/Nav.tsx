'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FlameButton } from '@/components/buttons/FlameButton';
import { Cover } from '@/components/home/Cover';
import { profile } from '@/content/profile';

const LINKS = [
  { label: 'Index', href: '/' },
  { label: 'About', href: '/#about' },
  { label: 'Work', href: '/#work' },
  { label: 'Lab', href: '/lab' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/#contact' },
];

/** Each character slides up to reveal a copy of itself underneath, staggered (CSS only). */
function RollLink({ label, href, onClick }: { label: string; href: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="pf-roll">
      <span className="pf-sr">{label}</span>
      <span aria-hidden="true" className="pf-roll__clip">
        {[...label].map((c, i) => <span key={i} style={{ transitionDelay: `${i * 0.018}s` }}>{c}</span>)}
      </span>
    </Link>
  );
}

/**
 * After hyperiux/immersive-full-screen-nav: the panel wipes up with clip-path, then links,
 * covers and footer rise in sequence. The same overlay is the mobile menu.
 */
export function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('pf-locked', open);
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <header className={`pf-header ${open ? 'is-open' : ''}`}>
        <Link href="/" className="identity" onClick={close}><i /> {profile.name.toUpperCase()}</Link>
        <nav className="pf-header__links" aria-label="Main">
          {LINKS.slice(1).map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
        </nav>
        <button type="button" className="pf-toggle" aria-expanded={open} aria-controls="pf-menu" onClick={() => setOpen(!open)}>
          <span>{open ? 'Close' : 'Menu'}</span><i /><i />
        </button>
      </header>
      <div id="pf-menu" className={`pf-menu ${open ? 'is-open' : ''}`} inert={!open}>
        <div className="pf-menu__inner">
          <p className="pf-menu__tag">Portfolio — {new Date().getFullYear()}<br /><span>AI, tools and interfaces.</span></p>
          <div className="pf-menu__main">
            <div className="pf-menu__links">
              {LINKS.map((l, i) => (
                <div key={l.href} style={{ transitionDelay: open ? `${0.55 + i * 0.06}s` : '0s' }}>
                  <RollLink {...l} onClick={close} />
                </div>
              ))}
            </div>
            <div className="pf-menu__covers">
              <Cover kind="rings" name="menu-a" />
              <Cover kind="terrain" name="menu-b" />
            </div>
          </div>
          <div className="pf-menu__foot">
            <div className="pf-menu__social">
              <a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a>
              <a href={`mailto:${profile.email}`}>Email ↗</a>
            </div>
            <FlameButton text="Get in touch" height={42} href="/#contact" onClick={close} />
            <span className="pf-menu__loc">{profile.location}</span>
          </div>
        </div>
      </div>
    </>
  );
}
