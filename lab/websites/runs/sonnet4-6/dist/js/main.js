/* ============================================================
   main.js — Orchestration, Lenis smooth scroll, app bootstrap
   ============================================================ */

(function () {
  'use strict';

  /* ── Wait for DOM ──────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {

    /* ── 1. Smooth scroll with Lenis ─────────────────────── */
    const lenis = new Lenis({
      duration:    1.3,
      easing:      t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false
    });

    // feed Lenis into GSAP ticker
    gsap.registerPlugin(ScrollTrigger);

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add(time => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // expose globally so nav links can use it
    window.lenis = lenis;

    /* ── 2. Nav anchor smooth scroll ─────────────────────── */
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const id = link.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -80, duration: 1.6 });
      });
    });

    /* ── 3. Init cursor ──────────────────────────────────── */
    new Cursor();

    /* ── 4. Init loader; everything else fires after ─────── */
    new Loader();

    window.addEventListener('loaderDone', () => {
      _afterLoad();
    });
  });

  /* ── Post-load initialisation ──────────────────────────── */
  function _afterLoad () {

    /* Three.js hero */
    if (typeof THREE !== 'undefined') {
      try { new HeroThree(); } catch (e) { console.warn('HeroThree init failed:', e); }
    }

    /* Interactive neural canvas */
    const neuralCanvas = document.getElementById('neural-canvas');
    if (neuralCanvas) {
      const net = new NeuralNet(neuralCanvas);
      initNeuralControls(net);
    }

    /* GSAP scroll animations */
    if (typeof initAnimations !== 'undefined')  initAnimations();

    /* Text effects, counters, starfield, grid */
    if (typeof initEffects    !== 'undefined')  initEffects();
    if (typeof initStarfield  !== 'undefined')  initStarfield();

    /* Add cursor hover listeners for any dynamically added elements */
    _refreshCursorTargets();

    /* Refresh ScrollTrigger on fully loaded */
    setTimeout(() => ScrollTrigger.refresh(), 400);
  }

  function _refreshCursorTargets () {
    const sel = 'a, button, .cap-card, .tl-card, .stat-card, .ctrl-btn, .magnetic-btn';
    document.querySelectorAll(sel).forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

})();
