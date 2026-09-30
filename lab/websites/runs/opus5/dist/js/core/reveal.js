/* ==========================================================================
   reveal.js — one IntersectionObserver for every entrance on the site

   Markup contract:
     [data-reveal="fade|fade-up|fade-in-left|scale|clip|clip-x|blur|mask|chars|words"]
     [data-stagger]        children get an incrementing --i
     [data-reveal-once="false"]  re-plays when scrolled back out and in
   ========================================================================== */

import { env } from './env.js';

let io = null;

function markIn(el) {
  el.classList.add('is-in');
  // Sections carry .is-in too so descendant CSS (meters, rules) can key off it.
  el.closest('.section, .model, .demo')?.classList.add('is-in');
}

function prepareStagger(el) {
  if (!el.hasAttribute('data-stagger')) return;
  [...el.children].forEach((child, i) => {
    if (!child.style.getPropertyValue('--i')) {
      child.style.setProperty('--i', i);
    }
  });
}

export function initReveal(root = document) {
  const targets = [
    ...root.querySelectorAll('[data-reveal], [data-stagger], .section--ruled, .is-meters, .sweep'),
  ];
  if (!targets.length) return;

  targets.forEach(prepareStagger);

  if (env.reduced || !('IntersectionObserver' in window)) {
    targets.forEach(markIn);
    return;
  }

  io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target;
        if (entry.isIntersecting) {
          markIn(el);
          if (el.dataset.revealOnce !== 'false') io.unobserve(el);
        } else if (el.dataset.revealOnce === 'false') {
          el.classList.remove('is-in');
        }
      }
    },
    {
      // Fire slightly before the element is fully on screen, and treat
      // anything already past the fold on load as visible.
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.06,
    }
  );

  targets.forEach((el) => io.observe(el));

  // Anything sitting above the fold on load should not wait for a scroll.
  requestAnimationFrame(() => {
    targets.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) {
        markIn(el);
        if (el.dataset.revealOnce !== 'false') io.unobserve(el);
      }
    });
  });
}

/** Register elements added after boot (filtered lists, injected demos). */
export function observeReveal(el) {
  prepareStagger(el);
  if (!io || env.reduced) { markIn(el); return; }
  io.observe(el);
}
