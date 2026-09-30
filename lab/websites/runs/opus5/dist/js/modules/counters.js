/* ==========================================================================
   counters.js — numbers that roll up when they arrive
   ========================================================================== */

import { onTick, easeOut } from '../core/raf.js';
import { env } from '../core/env.js';

const DURATION = 1500;

function run(el) {
  const to = parseFloat(el.dataset.count);
  if (Number.isNaN(to)) return;

  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const suffix = el.dataset.suffix ?? '';
  const prefix = el.dataset.prefix ?? '';
  const start = performance.now();

  el.style.fontVariantNumeric = 'tabular-nums';

  const stop = onTick((_dt, now) => {
    const t = Math.min(1, (now - start) / DURATION);
    const v = to * easeOut(t);
    el.textContent = prefix + v.toFixed(decimals) + suffix;
    if (t >= 1) {
      el.textContent = prefix + to.toFixed(decimals) + suffix;
      stop();
    }
  });
}

export function initCounters(root = document) {
  const els = [...root.querySelectorAll('[data-count]')];
  if (!els.length) return;

  if (env.reduced || !('IntersectionObserver' in window)) return; // markup already holds the final value

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        run(e.target);
        io.unobserve(e.target);
      }
    },
    { threshold: 0.5 }
  );

  els.forEach((el) => io.observe(el));
}
