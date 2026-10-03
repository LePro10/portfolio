'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/** Setzt <html class="pf-motion"> vor dem ersten Bild, damit nichts erst sichtbar ist und dann verschwindet. */
export const MOTION_SCRIPT = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('pf-motion')}catch(e){}`;

function countUp(el: HTMLElement) {
  const target = Number(el.dataset.count);
  if (!Number.isFinite(target)) return;
  const start = performance.now();
  const duration = 1400;
  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = String(Math.round(target * (1 - (1 - t) ** 4)));
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/**
 * Ein Beobachter für die ganze Seite: Elemente mit [data-reveal] bekommen [data-in], sobald
 * sie ins Bild kommen; das Aussehen davor und danach steht in globals.css. Ein Attribut,
 * keine Klasse: React setzt className beim Neu-Rendern (z. B. Hover) komplett neu und
 * würde .is-in wieder entfernen — die Zeile wäre dann unsichtbar. Zahlen mit
 * [data-count] zählen dabei hoch. Ohne JS, ohne IntersectionObserver oder mit reduzierter
 * Bewegung fehlt .pf-motion, und alles steht einfach da.
 */
export function Reveal() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const els = [...document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-in])')];
    if (!root.classList.contains('pf-motion') || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.setAttribute('data-in', ''));
      return;
    }
    const show = (el: HTMLElement) => {
      if (el.hasAttribute('data-in')) return;
      el.setAttribute('data-in', '');
      el.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
      io.unobserve(el);
    };
    // threshold 0: auch Blöcke, die höher als das Fenster sind, lösen aus.
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) show(entry.target as HTMLElement);
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    els.forEach((el) => io.observe(el));
    // Nach einem Sprung (Anker, Ende-Taste, schnelles Wischen) überspringt der Observer
    // Elemente, die nie im Bild waren. Alles oberhalb der Fensterunterkante gilt dann als gesehen.
    let timer = 0;
    const catchUp = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        for (const el of document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-in])')) {
          if (el.getBoundingClientRect().top < window.innerHeight) show(el);
        }
      }, 120);
    };
    catchUp();
    window.addEventListener('scroll', catchUp, { passive: true });
    window.addEventListener('hashchange', catchUp);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
      window.removeEventListener('scroll', catchUp);
      window.removeEventListener('hashchange', catchUp);
    };
  }, [pathname]);

  return null;
}
