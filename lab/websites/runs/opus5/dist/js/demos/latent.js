/* ==========================================================================
   demos/latent.js — pan/zoom scatter of a fake embedding space

   640 tokens arranged in themed clusters with a little noise. Drag to pan,
   wheel to zoom, hover for the token. The point is the clustering, so the
   clusters are real structure rather than uniform random.
   ========================================================================== */

import { onTick, clamp, damp, lerp } from '../core/raf.js';
import { env } from '../core/env.js';

const CLUSTERS = [
  { name: 'research', hue: '#22e0ff', at: [-0.55, -0.42],
    words: ['paper', 'probe', 'study', 'result', 'method', 'finding', 'review', 'replicate', 'dataset', 'ablation', 'baseline', 'metric'] },
  { name: 'model', hue: '#7c5cff', at: [0.48, -0.5],
    words: ['weights', 'layer', 'head', 'token', 'logit', 'embed', 'attention', 'residual', 'checkpoint', 'decoder', 'gradient', 'softmax'] },
  { name: 'language', hue: '#ff4ecd', at: [-0.42, 0.5],
    words: ['word', 'sentence', 'clause', 'grammar', 'meaning', 'phrase', 'quote', 'noun', 'verb', 'idiom', 'syntax', 'lexicon'] },
  { name: 'compute', hue: '#ffb347', at: [0.55, 0.46],
    words: ['kernel', 'memory', 'cache', 'latency', 'thread', 'cluster', 'flops', 'bandwidth', 'shard', 'batch', 'quantise', 'kernel'] },
  { name: 'evaluation', hue: '#7ff5ff', at: [0.02, -0.02],
    words: ['score', 'bench', 'suite', 'error', 'recall', 'precision', 'sample', 'variance', 'human', 'rubric', 'audit', 'trace'] },
];

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function buildPoints(n = 640) {
  const rand = rng(90210);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const c = CLUSTERS[i % CLUSTERS.length];
    // Box–Muller for a believable gaussian blob.
    const u1 = Math.max(1e-6, rand());
    const u2 = rand();
    const r = Math.sqrt(-2 * Math.log(u1)) * 0.16;
    const th = 2 * Math.PI * u2;

    const word = c.words[(rand() * c.words.length) | 0];
    const suffix = rand() < 0.4 ? ['s', 'ing', 'ed', '-1', '_v2'][(rand() * 5) | 0] : '';

    pts.push({
      x: c.at[0] + r * Math.cos(th) + (rand() - 0.5) * 0.06,
      y: c.at[1] + r * Math.sin(th) + (rand() - 0.5) * 0.06,
      c,
      label: word + suffix,
      freq: rand(),
      norm: 0.3 + rand() * 0.7,
    });
  }
  return pts;
}

export function initLatent() {
  const canvas = document.getElementById('lat-canvas');
  const tip = document.getElementById('lat-tip');
  const seg = document.getElementById('lat-mode');
  const reset = document.getElementById('lat-reset');
  const foot = document.getElementById('lat-foot');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const points = buildPoints();

  const view = { x: 0, y: 0, z: 1 };
  const target = { x: 0, y: 0, z: 1 };
  let mode = 'cluster';
  let hover = null;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let intro = 0;

  seg?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-mode]');
    if (!btn) return;
    [...seg.querySelectorAll('button')].forEach((b) =>
      b.setAttribute('aria-pressed', String(b === btn))
    );
    mode = btn.dataset.mode;
  });

  reset?.addEventListener('click', () => {
    target.x = 0; target.y = 0; target.z = 1;
  });

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointerup', (e) => {
    dragging = false;
    canvas.releasePointerCapture?.(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    if (dragging) {
      target.x += (e.clientX - lastX) / (r.height * target.z);
      target.y += (e.clientY - lastY) / (r.height * target.z);
      lastX = e.clientX;
      lastY = e.clientY;
      hover = null;
      return;
    }

    // Hit test in screen space.
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    const s = r.height * view.z * 0.42;
    let best = null;
    let bestD = 14 * 14;
    for (const p of points) {
      const px = r.width / 2 + (p.x + view.x) * s;
      const py = r.height / 2 + (p.y + view.y) * s;
      const d = (px - mx) ** 2 + (py - my) ** 2;
      if (d < bestD) { bestD = d; best = { p, px, py }; }
    }
    hover = best;

    if (tip) {
      if (best) {
        tip.hidden = false;
        tip.textContent = `${best.p.label}  ·  ${best.p.c.name}`;
        tip.style.left = `${best.px}px`;
        tip.style.top = `${best.py}px`;
      } else {
        tip.hidden = true;
      }
    }
  });

  canvas.addEventListener('pointerleave', () => {
    hover = null;
    dragging = false;
    if (tip) tip.hidden = true;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    target.z = clamp(target.z * (e.deltaY > 0 ? 0.9 : 1.11), 0.45, 6);
  }, { passive: false });

  if (foot) foot.textContent = `Drag to pan · scroll to zoom · ${points.length} tokens`;

  onTick((dt) => {
    const dpr = env.dpr;
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    if (!w || !h) return;

    const k = env.reduced ? 1 : damp(10, dt);
    view.x = lerp(view.x, target.x, k);
    view.y = lerp(view.y, target.y, k);
    view.z = lerp(view.z, target.z, k);
    intro = env.reduced ? 1 : lerp(intro, 1, damp(1.6, dt));

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = w / dpr;
    const H = h / dpr;
    ctx.clearRect(0, 0, W, H);

    const s = H * view.z * 0.42;
    const cx = W / 2;
    const cy = H / 2;

    /* -- grid ------------------------------------------------------------ */
    ctx.strokeStyle = 'rgba(107,117,153,0.13)';
    ctx.lineWidth = 1;
    const gridStep = s * 0.25;
    if (gridStep > 8) {
      const ox = (cx + view.x * s) % gridStep;
      const oy = (cy + view.y * s) % gridStep;
      for (let x = ox; x < W; x += gridStep) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = oy; y < H; y += gridStep) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
    }

    /* -- points ---------------------------------------------------------- */
    points.forEach((p, i) => {
      const px = cx + (p.x + view.x) * s;
      const py = cy + (p.y + view.y) * s;
      if (px < -20 || px > W + 20 || py < -20 || py > H + 20) return;

      const appear = clamp(intro * points.length * 1.6 - i);
      if (appear <= 0) return;

      let col = p.c.hue;
      let alpha = 0.75;
      let rad = 2 + view.z * 0.9;

      if (mode === 'freq') {
        const g = Math.round(120 + p.freq * 135);
        col = `rgb(${34}, ${g}, 255)`;
        rad = 1.4 + p.freq * 4.2 * Math.sqrt(view.z);
      } else if (mode === 'norm') {
        col = `hsl(${190 + p.norm * 90}, 90%, ${45 + p.norm * 25}%)`;
        alpha = 0.35 + p.norm * 0.6;
      }

      ctx.globalAlpha = alpha * appear;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    /* -- cluster labels, only when zoomed out enough to read them -------- */
    if (view.z < 2.4) {
      ctx.font = '500 11px "Cascadia Code", ui-monospace, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.globalAlpha = clamp((2.4 - view.z) / 1.2) * 0.8 * intro;
      for (const c of CLUSTERS) {
        const px = cx + (c.at[0] + view.x) * s;
        const py = cy + (c.at[1] + view.y) * s;
        ctx.fillStyle = c.hue;
        ctx.fillText(c.name.toUpperCase(), px, py - s * 0.24);
      }
      ctx.globalAlpha = 1;
    }

    /* -- hover halo ------------------------------------------------------ */
    if (hover) {
      const px = cx + (hover.p.x + view.x) * s;
      const py = cy + (hover.p.y + view.y) * s;
      ctx.strokeStyle = '#22e0ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(px, py, 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    /* -- scale readout --------------------------------------------------- */
    ctx.font = '400 11px "Cascadia Code", ui-monospace, Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(167,176,208,0.55)';
    ctx.fillText(`zoom ${view.z.toFixed(2)}× · projection: 12,288 → 2`, 14, H - 14);
  });
}
