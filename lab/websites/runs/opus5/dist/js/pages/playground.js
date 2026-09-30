/* ==========================================================================
   pages/playground.js — mount the four toys

   Each demo is mounted lazily when its section first approaches the viewport,
   so opening the page costs one canvas, not four.
   ========================================================================== */

const DEMOS = [
  ['#demo-attention', () => import('../demos/attention.js').then((m) => m.initAttention())],
  ['#demo-latent', () => import('../demos/latent.js').then((m) => m.initLatent())],
  ['#demo-stream', () => import('../demos/stream.js').then((m) => m.initStream())],
  ['#demo-shader', () => import('../demos/shaderlab.js').then((m) => m.initShaderLab())],
];

export function init() {
  if (!('IntersectionObserver' in window)) {
    DEMOS.forEach(([, load]) => load().catch(report));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        e.target._load?.().catch(report);
      }
    },
    { rootMargin: '300px 0px' }
  );

  for (const [sel, load] of DEMOS) {
    const el = document.querySelector(sel);
    if (!el) continue;
    el._load = load;
    io.observe(el);
  }
}

function report(err) {
  console.error('[playground] demo failed to load', err);
}
