'use client';

import { useEffect } from 'react';

/**
 * Lichtkegel, der dem Zeiger über Karten folgt. Schreibt --mx/--my (px) auf ein eigenes,
 * leeres Kind mit `data-spot` — nie auf React-Elemente mit eigenem style. Nur auf Geräten
 * mit echtem Hover und ohne reduzierte Bewegung; sonst bleibt das Kind unsichtbar.
 */
export function Spotlight({ selector }: { selector: string }) {
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || still.matches) return;
    const cards = [...document.querySelectorAll<HTMLElement>(selector)];
    const offs = cards.map((card) => {
      const spot = card.querySelector<HTMLElement>('[data-spot]');
      if (!spot) return () => {};
      let frame = 0;
      let x = 0;
      let y = 0;
      const move = (e: PointerEvent) => {
        const r = card.getBoundingClientRect();
        x = e.clientX - r.left;
        y = e.clientY - r.top;
        if (!frame) frame = requestAnimationFrame(() => {
          frame = 0;
          spot.style.setProperty('--mx', `${x}px`);
          spot.style.setProperty('--my', `${y}px`);
        });
      };
      const enter = () => spot.setAttribute('data-on', '');
      const leave = () => spot.removeAttribute('data-on');
      card.addEventListener('pointermove', move);
      card.addEventListener('pointerenter', enter);
      card.addEventListener('pointerleave', leave);
      return () => {
        cancelAnimationFrame(frame);
        card.removeEventListener('pointermove', move);
        card.removeEventListener('pointerenter', enter);
        card.removeEventListener('pointerleave', leave);
      };
    });
    return () => offs.forEach((off) => off());
  }, [selector]);

  return null;
}
