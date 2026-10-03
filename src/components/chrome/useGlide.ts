'use client';

import { useLayoutEffect, useRef } from 'react';

/**
 * Gleitende Markierung in einer Pillen-Leiste (Nav, Vorschau-Tabs). Misst das aktive Kind
 * und schreibt Lage und Breite als --gx/--gw direkt auf das Markierungs-Element. Das
 * Element bekommt von React kein style/className, darum überlebt das jedes Neu-Rendern.
 * Erst nach der ersten Messung kommt [data-ready] dazu: dann gleitet es, statt beim Laden
 * von links hereinzufahren. `active` < 0 blendet die Markierung aus.
 */
export function useGlide<C extends HTMLElement, M extends HTMLElement>(selector: string, active: number) {
  const container = useRef<C>(null);
  const marker = useRef<M>(null);

  useLayoutEffect(() => {
    const box = container.current;
    const mark = marker.current;
    if (!box || !mark) return;
    const place = () => {
      const el = active >= 0 ? box.querySelectorAll<HTMLElement>(selector)[active] : undefined;
      if (!el) { mark.style.setProperty('--go', '0'); return; }
      mark.style.setProperty('--gx', `${el.offsetLeft}px`);
      mark.style.setProperty('--gy', `${el.offsetTop}px`);
      mark.style.setProperty('--gw', `${el.offsetWidth}px`);
      mark.style.setProperty('--gh', `${el.offsetHeight}px`);
      mark.style.setProperty('--go', '1');
      if (!mark.hasAttribute('data-ready')) requestAnimationFrame(() => mark.setAttribute('data-ready', ''));
    };
    place();
    // Schriften laden nach, Fenster ändern sich: dann neu messen.
    const ro = new ResizeObserver(place);
    ro.observe(box);
    return () => ro.disconnect();
  }, [selector, active]);

  return [container, marker] as const;
}
