/* ==========================================================================
   pointer.js — one smoothed pointer, shared by every effect
   ========================================================================== */

import { onTick, damp, lerp } from './raf.js';
import { env } from './env.js';

export const pointer = {
  x: window.innerWidth * 0.5,   // raw px
  y: window.innerHeight * 0.5,
  sx: window.innerWidth * 0.5,  // smoothed px
  sy: window.innerHeight * 0.5,
  nx: 0,                        // smoothed, -1..1 from centre
  ny: 0,
  speed: 0,                     // smoothed px/frame
  down: false,
  inside: false,
};

let started = false;

export function initPointer() {
  if (started) return;
  started = true;

  const set = (x, y) => {
    pointer.x = x;
    pointer.y = y;
    pointer.inside = true;
  };

  window.addEventListener('pointermove', (e) => set(e.clientX, e.clientY), { passive: true });
  window.addEventListener('pointerdown', (e) => { set(e.clientX, e.clientY); pointer.down = true; }, { passive: true });
  window.addEventListener('pointerup', () => { pointer.down = false; }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.inside = false; });

  onTick((dt) => {
    const k = env.reduced ? 1 : damp(9, dt);
    const px = pointer.sx;
    const py = pointer.sy;

    pointer.sx = lerp(pointer.sx, pointer.x, k);
    pointer.sy = lerp(pointer.sy, pointer.y, k);

    pointer.nx = (pointer.sx / window.innerWidth) * 2 - 1;
    pointer.ny = (pointer.sy / window.innerHeight) * 2 - 1;

    const dx = pointer.sx - px;
    const dy = pointer.sy - py;
    pointer.speed = lerp(pointer.speed, Math.hypot(dx, dy), 0.2);
  });
}
