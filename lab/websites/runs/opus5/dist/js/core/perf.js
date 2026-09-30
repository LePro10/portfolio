/* ==========================================================================
   perf.js — frame-rate sampler and quality tiering

   Tiers: 2 = full, 1 = reduced, 0 = WebGL off.
   Effects read `perf.tier` and subscribe to changes rather than measuring
   their own frame rate.
   ========================================================================== */

import { onTick } from './raf.js';
import { env } from './env.js';

const listeners = new Set();

export const perf = {
  tier: 2,
  fps: 60,
  debug: new URLSearchParams(location.search).has('debug'),
};

let acc = 0;
let frames = 0;
let badStreak = 0;
let goodStreak = 0;
let readout = null;

function setTier(t) {
  if (t === perf.tier) return;
  perf.tier = t;
  document.documentElement.dataset.tier = String(t);
  listeners.forEach((fn) => fn(t));
}

export function onTierChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function initPerf() {
  // Start conservative on machines that advertise themselves as modest.
  setTier(env.lowPower ? 1 : 2);
  document.documentElement.dataset.tier = String(perf.tier);

  if (perf.debug) {
    readout = document.createElement('div');
    readout.style.cssText =
      'position:fixed;left:8px;bottom:8px;z-index:9999;padding:6px 9px;' +
      'font:11px/1.3 ui-monospace,monospace;color:#22e0ff;background:#04050ccc;' +
      'border:1px solid #22e0ff55;border-radius:6px;pointer-events:none;white-space:pre';
    document.body.appendChild(readout);
  }

  onTick((dt) => {
    acc += dt;
    frames++;
    if (acc < 500) return;

    perf.fps = Math.round((frames * 1000) / acc);
    acc = 0;
    frames = 0;

    if (readout) {
      readout.textContent = `${perf.fps} fps · tier ${perf.tier}`;
    }

    // Two consecutive bad half-seconds drop a tier; six good ones earn one back.
    if (perf.fps < 45) {
      badStreak++;
      goodStreak = 0;
      if (badStreak >= 2 && perf.tier > 0) {
        setTier(perf.tier - 1);
        badStreak = 0;
      }
    } else if (perf.fps > 57) {
      goodStreak++;
      badStreak = 0;
      if (goodStreak >= 6 && perf.tier < 2 && !env.lowPower) {
        setTier(perf.tier + 1);
        goodStreak = 0;
      }
    } else {
      badStreak = 0;
      goodStreak = 0;
    }
  });
}
