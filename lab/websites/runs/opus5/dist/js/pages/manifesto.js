/* ==========================================================================
   pages/manifesto.js — the hue that travels down the page

   Each belief slide declares a hue. The ambient wash lerps between the two
   slides nearest the viewport centre, so the colour moves continuously with
   the scroll instead of snapping at section boundaries.
   ========================================================================== */

import { onTick, clamp, damp, lerp } from '../core/raf.js';
import { env } from '../core/env.js';

export function init() {
  const root = document.getElementById('beliefs');
  if (!root) return;

  const slides = [...root.querySelectorAll('.belief')].map((el) => ({
    el,
    hue: parseFloat(el.dataset.hue) || 200,
  }));
  if (!slides.length) return;

  let current = slides[0].hue;

  onTick((dt) => {
    const mid = window.innerHeight * 0.5;

    // Weight every slide by how close its centre is to the viewport centre.
    let sum = 0;
    let acc = 0;
    for (const s of slides) {
      const r = s.el.getBoundingClientRect();
      if (r.bottom < -window.innerHeight || r.top > window.innerHeight * 2) continue;
      const d = Math.abs(r.top + r.height / 2 - mid);
      const wgt = Math.pow(clamp(1 - d / (window.innerHeight * 1.35)), 3);
      if (wgt <= 0) continue;
      acc += s.hue * wgt;
      sum += wgt;
    }

    if (!sum) return;
    const target = acc / sum;

    current = env.reduced ? target : lerp(current, target, damp(4, dt));
    root.style.setProperty('--page-hue', current.toFixed(1));
  });
}
