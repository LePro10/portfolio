'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { FlameButton } from '@/components/buttons/FlameButton';
import { useGlide } from '@/components/chrome/useGlide';
import { nav, profile } from '@/content/profile';

/** Each character slides up to reveal a copy of itself underneath, staggered (CSS only). */
function RollLink({ label, href, current, onClick }: { label: string; href: string; current: boolean; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="pf-roll" aria-current={current ? 'page' : undefined}>
      <span className="pf-sr">{label}</span>
      <span aria-hidden="true" className="pf-roll__clip">
        {[...label].map((c, i) => <span key={i} style={{ transitionDelay: `${i * 0.018}s` }}>{c}</span>)}
      </span>
    </Link>
  );
}

const PAGE_SECTION: Record<string, string> = { '/lab': 'lab', '/services': 'services' };

/**
 * Welcher Link ist gerade „hier“? Auf Unterseiten der Pfad, auf der Startseite die
 * Sektion, deren Anfang das obere Drittel des Fensters passiert hat.
 * `scrolled` wird wahr, sobald Inhalt unter den Header läuft (auf der Startseite erst
 * nach der Partikelszene), damit die Szene frei von Glas bleibt.
 * Nebenbei schreibt derselbe Frame den Lesefortschritt (0–1) als --p auf die Lichtlinie
 * unter dem Header — direkt per DOM, damit Scrollen kein Neu-Rendern auslöst.
 */
function useNavState(pathname: string, progress: RefObject<HTMLSpanElement | null>) {
  const [state, setState] = useState<{ current: string | null; scrolled: boolean }>({ current: null, scrolled: false });

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const track = document.querySelector('.scene-track');
      const scrolled = track ? track.getBoundingClientRect().bottom <= 76 : window.scrollY > 16;
      let current: string | null = PAGE_SECTION[pathname] ?? null;
      if (pathname === '/') {
        const line = window.innerHeight * 0.38;
        for (const item of nav) {
          const el = item.section && document.getElementById(item.section);
          if (el && el.getBoundingClientRect().top <= line) current = item.section!;
        }
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = 'contact';
      }
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.current?.style.setProperty('--p', String(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0));
      setState((s) => (s.current === current && s.scrolled === scrolled ? s : { current, scrolled }));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [pathname, progress]);

  return state;
}

/**
 * Desktop: Glas-Pille mit allen Links und ein klarer Kontakt-Knopf.
 * Tablet/Handy: das Vollbild-Menü nach hyperiux/immersive-full-screen-nav — das Panel
 * wischt per clip-path hoch, danach steigen Links und Fuss nacheinander auf.
 */
export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const progress = useRef<HTMLSpanElement>(null);
  const { current, scrolled } = useNavState(pathname, progress);
  const isCurrent = (item: (typeof nav)[number]) =>
    item.href === '/' ? pathname === '/' && current === null : (item.section ?? PAGE_SECTION[item.href]) === current;
  const pill = nav.slice(1, -1);
  const [pillRef, glideRef] = useGlide<HTMLElement, HTMLSpanElement>('a', pill.findIndex(isCurrent));

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
      <header className={`pf-header ${open ? 'is-open' : ''} ${scrolled ? 'is-scrolled' : ''}`}>
        <Link href="/" className="identity" onClick={close}><i aria-hidden="true" />{profile.name}</Link>
        <nav className="pf-header__links" aria-label="Main" ref={pillRef}>
          {/* Die Markierung gleitet zum aktiven Link, statt zu springen (useGlide). */}
          <span className="pf-glide" ref={glideRef} aria-hidden="true" />
          {pill.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isCurrent(l) ? 'page' : undefined}>{l.label}</Link>
          ))}
        </nav>
        {/* Der grüne Punkt heisst: offen für Projekte (siehe Kontakt). */}
        <Link href="/#contact" className="pf-cta" onClick={close}>
          <span className="pf-cta__live" aria-hidden="true" />
          <span className="pf-cta__label">Get in touch</span>
          <span className="pf-cta__arrow" aria-hidden="true">→</span>
        </Link>
        <button type="button" className="pf-toggle" aria-expanded={open} aria-controls="pf-menu" onClick={() => setOpen(!open)}>
          <span>{open ? 'Close' : 'Menu'}</span><i /><i />
        </button>
        {/* Haarfeine Lichtlinie: wie weit die Seite gelesen ist. */}
        <span className="pf-header__progress" ref={progress} aria-hidden="true" />
      </header>
      <div id="pf-menu" className={`pf-menu ${open ? 'is-open' : ''}`} inert={!open}>
        <div className="pf-menu__inner">
          <div className="pf-menu__links">
            {nav.map((l, i) => (
              <div key={l.href} style={{ transitionDelay: open ? `${0.55 + i * 0.06}s` : '0s' }}>
                <RollLink label={l.label} href={l.href} current={isCurrent(l)} onClick={close} />
                <span className="pf-menu__note">{l.note}</span>
              </div>
            ))}
          </div>
          <div className="pf-menu__foot">
            <div className="pf-menu__social">
              <a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a>
              <a href={`mailto:${profile.email}`}>Email ↗</a>
            </div>
            <FlameButton text="Get in touch" height={46} href="/#contact" onClick={close} />
          </div>
        </div>
      </div>
    </>
  );
}
