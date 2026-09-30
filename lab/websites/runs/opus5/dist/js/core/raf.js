/* ==========================================================================
   raf.js — the single animation ticker
   Every animated module on the site subscribes here. There is exactly one
   requestAnimationFrame loop in the whole codebase; that is the entire point.
   ========================================================================== */

const subs = new Set();

let running = false;
let last = 0;
let frame = 0;

function loop(now) {
  const dt = last ? Math.min(64, now - last) : 16.7;
  last = now;
  frame++;

  // Copy to an array so a subscriber can unsubscribe mid-tick safely.
  for (const fn of [...subs]) {
    try {
      fn(dt, now, frame);
    } catch (err) {
      // A single broken effect must never stop the site's heartbeat.
      console.error('[raf] subscriber threw, removing it', err);
      subs.delete(fn);
    }
  }

  if (subs.size) {
    requestAnimationFrame(loop);
  } else {
    running = false;
    last = 0;
  }
}

/**
 * Subscribe to the shared ticker.
 * @param {(dt:number, now:number, frame:number)=>void} fn
 * @returns {()=>void} unsubscribe
 */
export function onTick(fn) {
  subs.add(fn);
  if (!running) {
    running = true;
    requestAnimationFrame(loop);
  }
  return () => subs.delete(fn);
}

/** Frame-rate independent exponential smoothing factor. */
export function damp(rate, dt) {
  return 1 - Math.exp(-rate * (dt / 1000));
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
export const map = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c);
/** Clamped 0..1 progress of v between a and b. */
export const norm = (v, a, b) => clamp((v - a) / (b - a || 1));
export const smoothstep = (t) => t * t * (3 - 2 * t);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
