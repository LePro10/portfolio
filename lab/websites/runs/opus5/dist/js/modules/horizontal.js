/* ==========================================================================
   horizontal.js — vertical scroll drives a horizontal rail

   The section is tall; its inner .track-pin is sticky. Progress through the
   tall section maps to translateX on the rail, and each card publishes a
   --near value (1 at viewport centre) that CSS uses to scale and un-dim it.
   ========================================================================== */

import { onTick, damp, lerp, clamp } from '../core/raf.js';
import { pinProgress } from '../core/scroll.js';
import { env } from '../core/env.js';

const MOBILE = window.matchMedia('(max-width: 48rem)');

export function initHorizontal() {
  const section = document.querySelector('.track-section');
  const track = document.getElementById('track');
  const rail = document.getElementById('track-rail');
  const fill = document.getElementById('track-fill');
  if (!section || !track || !rail) return;

  const cards = [...rail.children];
  let travel = 0;
  let current = 0;

  function measure() {
    travel = Math.max(0, rail.scrollWidth - track.clientWidth);
  }

  measure();
  window.addEventListener('resize', measure, { passive: true });
  if (document.fonts?.ready) document.fonts.ready.then(measure);

  onTick((dt) => {
    if (MOBILE.matches) {
      rail.style.transform = '';
      cards.forEach((c) => c.style.removeProperty('--near'));
      return;
    }

    if (!travel) measure();

    // Hold the rail still for a beat at each end so the section has bookends.
    const raw = pinProgress(section);
    const p = clamp((raw - 0.08) / 0.84);

    const targetX = -p * travel;
    current = env.reduced ? targetX : lerp(current, targetX, damp(9, dt));

    rail.style.transform = `translate3d(${current.toFixed(2)}px, 0, 0)`;
    if (fill) fill.style.width = `${(p * 100).toFixed(2)}%`;

    // Per-card proximity to the viewport centre.
    const mid = window.innerWidth / 2;
    for (const card of cards) {
      const r = card.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - mid);
      const near = clamp(1 - d / (window.innerWidth * 0.6));
      card.style.setProperty('--near', near.toFixed(3));
    }
  });
}
