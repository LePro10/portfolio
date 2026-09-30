/* ==========================================================================
   main.js — boot

   Order matters: text is split before the reveal observer runs, so the masks
   it animates already exist. Heavy work (WebGL, demos) is imported lazily per
   page and never blocks first paint.
   ========================================================================== */

import { initPerf } from './core/perf.js';
import { initScroll, initProgressBar } from './core/scroll.js';
import { initPointer } from './core/pointer.js';
import { initSplit } from './core/split.js';
import { initReveal } from './core/reveal.js';
import { initTransitions } from './core/transitions.js';
import { initHeader } from './modules/header.js';
import { initCursor } from './modules/cursor.js';
import { initScramble } from './modules/scramble.js';
import { initCounters } from './modules/counters.js';
import { initTilt } from './modules/tilt.js';
import { initMotionSwitch } from './modules/motion.js';
import { env } from './core/env.js';

const page = document.body.dataset.page || 'home';

function boot() {
  initPerf();
  initScroll();
  initProgressBar();
  initPointer();
  initHeader();
  initTransitions();

  initSplit();     // must precede initReveal
  initReveal();

  initScramble();
  initCounters();
  initTilt();
  initCursor();
  initMotionSwitch();

  loadPage();
  loadBackdrop();
}

/* -------------------------------------------------------------------------- */

async function loadPage() {
  try {
    switch (page) {
      case 'home': {
        const m = await import('./pages/home.js');
        m.init();
        break;
      }
      case 'research': {
        const m = await import('./pages/research.js');
        m.init();
        break;
      }
      case 'playground': {
        const m = await import('./pages/playground.js');
        m.init();
        break;
      }
      case 'manifesto': {
        const m = await import('./pages/manifesto.js');
        m.init();
        break;
      }
      case 'contact': {
        const m = await import('./pages/contact.js');
        m.init();
        break;
      }
      default:
        break;
    }
  } catch (err) {
    // A failed enhancement must leave a working page behind.
    console.error(`[noetic] page module "${page}" failed`, err);
  }
}

/** Inner pages get the cheap fbm backdrop; home gets the full particle field. */
async function loadBackdrop() {
  if (env.reduced) return;
  const canvas = document.getElementById('nebula');
  if (!canvas) return;

  try {
    const { mountNebula } = await import('./gl/nebula.js');
    mountNebula(canvas);
  } catch (err) {
    console.warn('[noetic] backdrop unavailable', err);
  }
}

/* -------------------------------------------------------------------------- */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
