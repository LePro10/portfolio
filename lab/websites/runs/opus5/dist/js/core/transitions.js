/* ==========================================================================
   transitions.js — page-to-page continuity

   Chrome-family browsers get real cross-document View Transitions purely from
   the CSS `@view-transition { navigation: auto }` rule; no JavaScript is
   involved and the header/brand genuinely persist across documents.

   Everywhere else this installs a hand-rolled substitute: intercept same-origin
   navigations, fade a veil in, then hand over to the browser.
   ========================================================================== */

import { env } from './env.js';

const OUT_MS = 320;

function supportsCrossDocumentVT() {
  // The cross-document flavour shipped alongside the CSSViewTransitionRule
  // interface, which is the cheapest reliable feature check available.
  return typeof window.CSSViewTransitionRule !== 'undefined';
}

function isInternal(a) {
  if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return false;
  if (url.pathname === location.pathname && url.hash) return false; // in-page anchor
  return /\.html?$/.test(url.pathname) || url.pathname.endsWith('/');
}

export function initTransitions() {
  const veil = document.getElementById('veil');

  // Coming back via bfcache must never leave the veil stuck on screen.
  window.addEventListener('pageshow', () => veil?.classList.remove('is-on'));
  window.addEventListener('pagehide', () => veil?.classList.remove('is-on'));

  if (supportsCrossDocumentVT() || env.reduced || !veil) return;

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const a = e.target.closest('a[href]');
    if (!isInternal(a)) return;

    e.preventDefault();
    veil.classList.add('is-on');
    setTimeout(() => { location.href = a.href; }, OUT_MS);
  });
}
