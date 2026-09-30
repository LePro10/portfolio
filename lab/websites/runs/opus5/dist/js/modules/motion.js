/* ==========================================================================
   motion.js — the footer motion switch

   Cycles auto -> reduced -> full. Because nearly every module reads the motion
   preference once at boot (WebGL contexts, observers, split text), changing it
   reloads the page rather than pretending it can be swapped live.
   ========================================================================== */

import { motionPreference, setMotionPreference } from '../core/env.js';

const ORDER = ['auto', 'reduced', 'full'];
const LABEL = {
  auto: 'Motion: system',
  reduced: 'Motion: reduced',
  full: 'Motion: full',
};

export function initMotionSwitch() {
  const btn = document.getElementById('motion-switch');
  if (!btn) return;

  const paint = () => {
    const pref = motionPreference();
    btn.textContent = LABEL[pref];
    btn.setAttribute('aria-pressed', String(pref === 'full'));
    btn.title = 'Cycle motion: system preference, reduced, or full';
  };

  paint();

  btn.addEventListener('click', () => {
    const next = ORDER[(ORDER.indexOf(motionPreference()) + 1) % ORDER.length];
    setMotionPreference(next);
    paint();
    // Preserve the scroll position across the reload so the choice can be
    // compared on the spot.
    sessionStorage.setItem('noetic:scroll', String(window.scrollY));
    location.reload();
  });

  const y = sessionStorage.getItem('noetic:scroll');
  if (y !== null) {
    sessionStorage.removeItem('noetic:scroll');
    requestAnimationFrame(() => window.scrollTo(0, parseFloat(y) || 0));
  }
}
