/* ==========================================================================
   header.js — stuck state, mobile menu, hide-on-scroll-down
   ========================================================================== */

import { onTick } from '../core/raf.js';
import { scroll } from '../core/scroll.js';

export function initHeader() {
  const header = document.getElementById('header');
  const nav = document.getElementById('nav');
  const toggle = document.querySelector('.nav-toggle');
  if (!header) return;

  /* ---- mobile menu ------------------------------------------------------ */
  if (toggle && nav) {
    const close = () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.removeProperty('overflow');
    };

    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });

    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        close();
        toggle.focus();
      }
    });

    // Leaving the mobile breakpoint must not strand a locked body.
    window.matchMedia('(min-width: 62.0625rem)').addEventListener('change', (m) => {
      if (m.matches) close();
    });
  }

  /* ---- stuck / hidden --------------------------------------------------- */
  let hidden = false;

  onTick(() => {
    header.classList.toggle('is-stuck', scroll.smooth > 24);

    // Hide when travelling down at pace, well below the fold; show on any
    // upward movement. Never hide while the mobile menu is open.
    const menuOpen = nav?.classList.contains('is-open');
    const shouldHide =
      !menuOpen && scroll.smooth > scroll.vh * 0.9 && scroll.velocity > 2.5;
    const shouldShow = scroll.velocity < -0.5 || scroll.smooth < scroll.vh * 0.6;

    if (shouldHide && !hidden) {
      hidden = true;
      header.style.transform = 'translateY(-102%)';
      header.style.transition = 'transform 420ms cubic-bezier(0.76,0,0.24,1)';
    } else if (shouldShow && hidden) {
      hidden = false;
      header.style.transform = 'translateY(0)';
    }
  });
}
