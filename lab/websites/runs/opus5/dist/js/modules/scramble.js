/* ==========================================================================
   scramble.js — decode-on-hover text
   Resolves left to right; unresolved characters keep flickering through a
   glyph set. Each element animates independently on its own hover.
   ========================================================================== */

import { onTick } from '../core/raf.js';
import { env } from '../core/env.js';

const GLYPHS = '01<>[]{}/\\|=+*#%$&@ABCDEFGHJKLMNPQRSTUVWXYZ';
const pick = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

function scrambleOnce(el, duration = 520) {
  const text = el.dataset.scrambleText || el.textContent;
  el.dataset.scrambleText = text;

  if (el.dataset.scrambling === '1') return;
  el.dataset.scrambling = '1';

  const start = performance.now();
  const n = text.length;

  const stop = onTick((_dt, now) => {
    const t = Math.min(1, (now - start) / duration);
    // Slight overshoot so the last character resolves before the timer ends.
    const settled = Math.floor(t * n * 1.25);

    let out = '';
    for (let i = 0; i < n; i++) {
      const c = text[i];
      if (c === ' ') { out += ' '; continue; }
      out += i < settled ? c : pick();
    }
    el.textContent = out;

    if (t >= 1) {
      el.textContent = text;
      el.dataset.scrambling = '0';
      stop();
    }
  });
}

export function initScramble(root = document) {
  if (env.reduced) return;

  root.querySelectorAll('[data-scramble]').forEach((el) => {
    el.dataset.scrambleText = el.textContent;
    el.addEventListener('pointerenter', () => scrambleOnce(el));
    el.addEventListener('focus', () => scrambleOnce(el));
  });
}
