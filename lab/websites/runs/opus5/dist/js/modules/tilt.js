/* ==========================================================================
   tilt.js — pointer-tracked 3D tilt and sheen for .tilt panels

   Writes --mx/--my (the sheen highlight, also used by the CSS-only hover
   state) and applies a small rotation. Bounds are cached per hover, not per
   frame, so this stays cheap with many cards on screen.
   ========================================================================== */

import { onTick, damp, lerp } from '../core/raf.js';
import { env } from '../core/env.js';

const MAX_DEG = 5;

export function initTilt(root = document) {
  const cards = [...root.querySelectorAll('.tilt')];
  if (!cards.length || env.reduced || env.coarse || !env.hover) return;

  for (const card of cards) {
    let rect = null;
    let tx = 0, ty = 0;   // target rotation
    let cx = 0, cy = 0;   // current rotation
    let active = false;
    let stop = null;

    const frame = (dt) => {
      const k = damp(12, dt);
      cx = lerp(cx, tx, k);
      cy = lerp(cy, ty, k);

      card.style.transform =
        `perspective(900px) rotateX(${cx.toFixed(3)}deg) rotateY(${cy.toFixed(3)}deg)`;

      if (!active && Math.abs(cx) < 0.02 && Math.abs(cy) < 0.02) {
        card.style.transform = '';
        stop?.();
        stop = null;
      }
    };

    card.addEventListener('pointerenter', () => {
      rect = card.getBoundingClientRect();
      active = true;
      card.style.willChange = 'transform';
      stop ??= onTick(frame);
    });

    card.addEventListener('pointermove', (e) => {
      if (!rect) rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      ty = (px - 0.5) * 2 * MAX_DEG;
      tx = -(py - 0.5) * 2 * MAX_DEG;

      card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    });

    card.addEventListener('pointerleave', () => {
      active = false;
      tx = 0;
      ty = 0;
      rect = null;
      card.style.removeProperty('will-change');
    });
  }
}
