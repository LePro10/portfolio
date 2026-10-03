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
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.setAttribute('data-in', '');
        el.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
        io.unobserve(el);
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
