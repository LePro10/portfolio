/* ==========================================================================
   cursor.js — magnetic ring cursor

   The ring trails the pointer with a spring; the dot tracks it exactly. Over
   interactive elements the ring inflates and snaps toward the element's centre,
   which is what makes buttons feel magnetic rather than merely highlighted.
   ========================================================================== */

import { onTick, damp, lerp } from '../core/raf.js';
import { pointer } from '../core/pointer.js';
import { env } from '../core/env.js';

const HOT = 'a, button, summary, input, textarea, select, [role="button"], .tilt';
const TEXTY = 'input[type="text"], input[type="email"], textarea';

export function initCursor() {
  if (env.reduced || env.coarse || !env.hover) return;

  const root = document.getElementById('cursor');
  if (!root) return;

  const ring = root.querySelector('.cursor__ring');
  const dot = root.querySelector('.cursor__dot');

  let rx = pointer.x;
  let ry = pointer.y;
  let target = null;

  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest?.(HOT);
    target = el || null;
    root.classList.toggle('is-hot', !!el);
    root.classList.toggle('is-text', !!(el && el.matches(TEXTY)));
  });

  document.addEventListener('pointerout', (e) => {
    if (!e.relatedTarget || !e.relatedTarget.closest?.(HOT)) {
      target = null;
      root.classList.remove('is-hot', 'is-text');
    }
  });

  window.addEventListener('pointermove', () => root.classList.add('is-active'), { once: true });
  document.addEventListener('pointerleave', () => root.classList.remove('is-active'));
  document.addEventListener('pointerenter', () => root.classList.add('is-active'));

  onTick((dt) => {
    let tx = pointer.x;
    let ty = pointer.y;

    // Magnetism: pull the ring a third of the way toward a hovered control.
    if (target) {
      const r = target.getBoundingClientRect();
      if (r.width && r.width < 420) {
        tx = lerp(tx, r.left + r.width / 2, 0.35);
        ty = lerp(ty, r.top + r.height / 2, 0.35);
      }
    }

    const k = damp(18, dt);
    rx = lerp(rx, tx, k);
    ry = lerp(ry, ty, k);

    ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
    dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
  });
}
