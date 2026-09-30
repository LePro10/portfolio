/* ==========================================================================
   scroll.js — the scroll observatory

   Deliberate design note: this does NOT hijack the page scroll. An earlier
   plan called for a transform-translated virtual scroller, but that breaks
   `position: sticky` (which every pinned section on this site depends on),
   fights trackpad momentum, and degrades find-in-page and keyboard paging.

   Instead the browser keeps scrolling natively and this module publishes a
   *smoothed* scroll value that visual effects lag behind. The result reads as
   fluid without lying to the layout engine.
   ========================================================================== */

import { onTick, damp, lerp, clamp } from './raf.js';
import { env } from './env.js';

export const scroll = {
  y: window.scrollY || 0,      // raw scroll position
  smooth: window.scrollY || 0, // eased position — use this for visuals
  velocity: 0,                 // px per frame, signed
  direction: 1,                // 1 down, -1 up
  progress: 0,                 // 0..1 through the document
  height: 0,                   // scrollable distance
  vh: window.innerHeight,
  vw: window.innerWidth,
};

let prevSmooth = scroll.smooth;
const parallaxEls = [];

function measure() {
  scroll.vh = window.innerHeight;
  scroll.vw = window.innerWidth;
  scroll.height = Math.max(1, document.documentElement.scrollHeight - scroll.vh);
  collectParallax();
}

function collectParallax() {
  parallaxEls.length = 0;
  document.querySelectorAll('[data-parallax]').forEach((el) => {
    parallaxEls.push({
      el,
      speed: parseFloat(el.dataset.parallax) || 0.15,
      top: 0,
      h: 0,
    });
  });
  cacheParallaxBounds();
}

function cacheParallaxBounds() {
  const base = window.scrollY;
  for (const p of parallaxEls) {
    const r = p.el.getBoundingClientRect();
    p.top = r.top + base;
    p.h = r.height;
  }
}

function tick(dt) {
  scroll.y = window.scrollY;

  const k = env.reduced ? 1 : damp(11, dt);
  scroll.smooth = lerp(scroll.smooth, scroll.y, k);
  if (Math.abs(scroll.smooth - scroll.y) < 0.03) scroll.smooth = scroll.y;

  scroll.velocity = scroll.smooth - prevSmooth;
  if (Math.abs(scroll.velocity) > 0.4) scroll.direction = Math.sign(scroll.velocity);
  prevSmooth = scroll.smooth;

  scroll.progress = clamp(scroll.smooth / scroll.height);

  if (!env.reduced) {
    for (const p of parallaxEls) {
      // Centre-relative offset so the effect is symmetric around the viewport.
      const rel = (scroll.smooth + scroll.vh * 0.5) - (p.top + p.h * 0.5);
      p.el.style.setProperty('--py', `${(-rel * p.speed).toFixed(2)}px`);
    }
  }
}

/**
 * Progress of an element through the viewport.
 * @returns {number} 0 when its top hits the bottom edge, 1 when its bottom
 *                   leaves the top edge.
 */
export function viewProgress(el) {
  const r = el.getBoundingClientRect();
  return clamp((scroll.vh - r.top) / (scroll.vh + r.height));
}

/**
 * Progress through a tall "pin track": 0 while its top is at the viewport top,
 * 1 when its bottom reaches the viewport bottom. This is the value that drives
 * every pinned sequence on the site.
 */
export function pinProgress(el) {
  const r = el.getBoundingClientRect();
  const travel = r.height - scroll.vh;
  if (travel <= 0) return clamp(-r.top / (r.height || 1));
  return clamp(-r.top / travel);
}

export function initScroll() {
  measure();
  prevSmooth = scroll.smooth = scroll.y = window.scrollY;

  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('load', measure);
  // Layout settles as fonts and images land.
  if (document.fonts?.ready) document.fonts.ready.then(measure);

  // Sections growing/shrinking (accordion, filters) change parallax anchors.
  const ro = new ResizeObserver(() => {
    scroll.height = Math.max(1, document.documentElement.scrollHeight - scroll.vh);
    cacheParallaxBounds();
  });
  ro.observe(document.body);

  onTick(tick);
}

/** Fallback progress bar for browsers without animation-timeline: scroll(). */
export function initProgressBar() {
  const bar = document.querySelector('.progress');
  if (!bar) return;
  if (CSS.supports('animation-timeline: scroll()')) return;
  onTick(() => {
    bar.style.transform = `scaleX(${scroll.progress})`;
  });
}
