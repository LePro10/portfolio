/* ==========================================================================
   pages/research.js — "Inside the Mind"

   A sticky canvas illustrates four stages of inference. The active step is
   whichever prose block is crossing the middle of the viewport; progress
   through that block drives the animation inside the stage.
   ========================================================================== */

import { onTick, clamp, damp, lerp, easeOut } from '../core/raf.js';
import { env } from '../core/env.js';

const C = {
  line: 'rgba(107,117,153,0.30)',
  grid: 'rgba(107,117,153,0.16)',
  dim: 'rgba(167,176,208,0.55)',
  text: '#eef2ff',
  cyan: '#22e0ff',
  violet: '#7c5cff',
  magenta: '#ff4ecd',
  amber: '#ffb347',
};

const STAGE_LABEL = [
  ['01 — Tokenisation', 'Characters → subword units'],
  ['02 — Embedding', 'Tokens → directions in space'],
  ['03 — Attention', 'Every token queries every other'],
  ['04 — Generation', 'Scores → one chosen word'],
];

const TOKENS = ['inter', 'pret', 'abil', 'ity', ' is', ' not', ' a', ' gar', 'nish'];
const IDS = [3120, 8841, 271, 1177, 374, 539, 264, 12138, 819];

export function init() {
  initFilter();
  initScrolly();
}

/* ==========================================================================
   Publication filter
   ========================================================================== */
function initFilter() {
  const seg = document.getElementById('pub-filter');
  const list = document.getElementById('pub-list');
  const count = document.getElementById('pub-count');
  if (!seg || !list) return;

  const items = [...list.children];

  seg.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-filter]');
    if (!btn) return;

    [...seg.querySelectorAll('button')].forEach((b) =>
      b.setAttribute('aria-pressed', String(b === btn))
    );

    const want = btn.dataset.filter;
    let shown = 0;

    items.forEach((li, i) => {
      const match = want === 'all' || li.dataset.tag === want;
      li.hidden = !match;
      if (match) {
        shown++;
        // Re-run the entrance so a filtered list arrives rather than blinks.
        if (!env.reduced) {
          li.style.animation = 'none';
          void li.offsetWidth;
          li.style.animation = `sd-fade 520ms var(--e-out) ${i * 40}ms both`;
        }
      }
    });

    if (count) count.textContent = `${shown} of ${items.length} shown`;
  });
}

/* ==========================================================================
   Scrollytelling
   ========================================================================== */
function initScrolly() {
  const canvas = document.getElementById('scrolly-canvas');
  const stepsRoot = document.getElementById('scrolly-steps');
  if (!canvas || !stepsRoot) return;

  const ctx = canvas.getContext('2d');
  const steps = [...stepsRoot.querySelectorAll('.step')];
  const nameEl = document.getElementById('stage-name');
  const capEl = document.getElementById('stage-caption');

  let active = 0;
  let shown = 0;       // eased stage index, for cross-fading
  let stepT = 0;       // progress within the active step

  function setActive(i) {
    if (i === active) return;
    active = i;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    if (nameEl) nameEl.textContent = STAGE_LABEL[i][0];
    if (capEl) capEl.textContent = STAGE_LABEL[i][1];
  }

  steps[0]?.classList.add('is-active');

  function resize() {
    const dpr = env.dpr;
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w;
    canvas.height = h;
  }

  onTick((dt, now) => {
    resize();

    // Which step owns the middle of the screen?
    const mid = window.innerHeight * 0.5;
    let best = 0;
    let bestD = Infinity;
    steps.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
      if (i === active) {
        stepT = clamp((mid - r.top) / (r.height || 1));
      }
    });
    setActive(best);

    shown = env.reduced ? active : lerp(shown, active, damp(7, dt));

    draw(ctx, canvas.width, canvas.height, shown, stepT, now, env.dpr);
  });
}

/* ==========================================================================
   Drawing
   ========================================================================== */
function draw(ctx, W, H, shown, t, now, dpr) {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.scale(dpr, dpr);

  const w = W / dpr;
  const h = H / dpr;

  // Cross-fade neighbouring stages while `shown` is between integers.
  const lo = Math.floor(shown);
  const hi = Math.min(3, lo + 1);
  const f = shown - lo;

  if (f < 0.999) {
    ctx.globalAlpha = 1 - f;
    stage(ctx, w, h, lo, t, now);
  }
  if (f > 0.001) {
    ctx.globalAlpha = f;
    stage(ctx, w, h, hi, t, now);
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function stage(ctx, w, h, i, t, now) {
  ctx.save();
  if (i === 0) drawTokens(ctx, w, h, t, now);
  else if (i === 1) drawEmbedding(ctx, w, h, t, now);
  else if (i === 2) drawAttention(ctx, w, h, t, now);
  else drawGeneration(ctx, w, h, t, now);
  ctx.restore();
}

function mono(ctx, size, weight = 400) {
  ctx.font = `${weight} ${size}px "Cascadia Code", ui-monospace, Consolas, monospace`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/* ---- 00 · tokenisation --------------------------------------------------- */
function drawTokens(ctx, w, h, t, now) {
  const A = ctx.globalAlpha;           // stage alpha, set by the cross-fade
  const cx = w / 2;
  const raw = 'interpretability is not a garnish';

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // The original string, dissolving as the pieces take over.
  ctx.globalAlpha = A * (1 - clamp(t * 1.6) * 0.75);
  mono(ctx, w * 0.036);
  ctx.fillStyle = C.dim;
  ctx.fillText(raw, cx, h * 0.18);
  ctx.globalAlpha = A;

  // Token chips.
  const size = w * 0.034;
  mono(ctx, size);
  const pad = size * 0.62;
  const gap = size * 0.34 * easeOut(clamp(t * 1.4));

  const widths = TOKENS.map((tk) => ctx.measureText(tk.trim()).width + pad * 2);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (TOKENS.length - 1);

  // Wrap onto two rows so long token sets stay inside the frame.
  const maxW = w * 0.86;
  const rows = [[]];
  let rowW = 0;
  widths.forEach((cw, k) => {
    if (rowW + cw + gap > maxW && rows[rows.length - 1].length) {
      rows.push([]);
      rowW = 0;
    }
    rows[rows.length - 1].push(k);
    rowW += cw + gap;
  });

  const chipH = size * 2.1;
  const startY = h * 0.36;

  rows.forEach((row, ri) => {
    const rw = row.reduce((a, k) => a + widths[k], 0) + gap * (row.length - 1);
    let x = cx - rw / 2;
    const y = startY + ri * (chipH + size * 0.7);

    row.forEach((k) => {
      const appear = clamp((t * 1.9 - k * 0.06) * 2.2);
      const a = easeOut(appear);
      if (a <= 0) { x += widths[k] + gap; return; }

      ctx.save();
      ctx.globalAlpha = A * a;
      const dy = (1 - a) * size * 0.8;

      const hue = k % 3;
      const col = hue === 0 ? C.cyan : hue === 1 ? C.violet : C.magenta;

      roundRect(ctx, x, y + dy, widths[k], chipH, 6);
      ctx.fillStyle = 'rgba(16,21,42,0.85)';
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.globalAlpha = A * a * 0.55;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = A * a;

      ctx.fillStyle = C.text;
      mono(ctx, size);
      ctx.fillText(TOKENS[k].trim(), x + widths[k] / 2, y + dy + chipH * 0.44);

      // token id underneath
      mono(ctx, size * 0.62);
      ctx.fillStyle = C.dim;
      ctx.fillText(String(IDS[k]), x + widths[k] / 2, y + dy + chipH + size * 0.62);

      ctx.restore();
      x += widths[k] + gap;
    });
  });

  // Footnote counter.
  const n = Math.round(clamp(t * 1.9) * TOKENS.length);
  mono(ctx, w * 0.026);
  ctx.fillStyle = C.cyan;
  ctx.fillText(`${n} tokens · ${raw.length} characters`, cx, h * 0.82);

  // A quiet reminder that these are not words.
  mono(ctx, w * 0.022);
  ctx.fillStyle = C.dim;
  ctx.fillText('"interpretability" costs four tokens; "a" costs one', cx, h * 0.87);
}

/* ---- 01 · embedding ------------------------------------------------------ */
function drawEmbedding(ctx, w, h, t, now) {
  const A = ctx.globalAlpha;
  const pad = w * 0.11;
  const size = w - pad * 2;
  const x0 = pad;
  const y0 = h * 0.16;
  const s = Math.min(size, h * 0.66);

  // grid
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  const cells = 8;
  for (let i = 0; i <= cells; i++) {
    const p = (i / cells) * s;
    ctx.beginPath(); ctx.moveTo(x0, y0 + p); ctx.lineTo(x0 + s, y0 + p); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 + p, y0); ctx.lineTo(x0 + p, y0 + s); ctx.stroke();
  }

  ctx.strokeStyle = C.line;
  ctx.strokeRect(x0, y0, s, s);

  // Deterministic pseudo-embedding positions.
  const words = [
    ['lab', 0.22, 0.31, 0], ['research', 0.30, 0.24, 0], ['paper', 0.17, 0.20, 0],
    ['model', 0.62, 0.36, 1], ['weights', 0.71, 0.29, 1], ['tokens', 0.66, 0.46, 1],
    ['read', 0.38, 0.72, 2], ['explain', 0.47, 0.79, 2], ['trace', 0.31, 0.83, 2],
    ['fast', 0.82, 0.71, 3], ['small', 0.88, 0.62, 3],
  ];
  const cols = [C.cyan, C.violet, C.magenta, C.amber];

  const drift = Math.sin(now * 0.0006) * 0.004;

  words.forEach((entry, k) => {
    const [label, ux, uy, g] = entry;
    const a = easeOut(clamp((t * 1.8 - k * 0.05) * 2));
    if (a <= 0) return;

    // Points fly in from the top edge, where the tokens were.
    const fromX = x0 + s * (0.15 + (k / words.length) * 0.7);
    const fromY = y0 - h * 0.06;
    const toX = x0 + s * (ux + drift * (k % 3 - 1));
    const toY = y0 + s * (uy + drift);

    const px = lerp(fromX, toX, a);
    const py = lerp(fromY, toY, a);

    ctx.save();
    ctx.globalAlpha = A * a;

    // vector from origin for the first of each cluster
    if (k % 3 === 0) {
      ctx.strokeStyle = cols[g];
      ctx.globalAlpha = A * a * 0.28;
      ctx.beginPath();
      ctx.moveTo(x0 + s * 0.5, y0 + s * 0.5);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.globalAlpha = A * a;
    }

    ctx.fillStyle = cols[g];
    ctx.beginPath();
    ctx.arc(px, py, w * 0.008, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = cols[g];
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    mono(ctx, w * 0.021);
    ctx.fillStyle = C.text;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = A * a * 0.85;
    ctx.fillText(label, px + w * 0.016, py);
    ctx.restore();
  });

  ctx.textAlign = 'center';
  mono(ctx, w * 0.022);
  ctx.fillStyle = C.dim;
  ctx.fillText('2 of 12,288 dimensions shown', w / 2, y0 + s + h * 0.07);

  mono(ctx, w * 0.026);
  ctx.fillStyle = C.cyan;
  ctx.fillText('neighbours in this space mean similar things', w / 2, y0 + s + h * 0.13);
}

/* ---- 02 · attention ------------------------------------------------------ */
function drawAttention(ctx, w, h, t, now) {
  const A = ctx.globalAlpha;
  const labels = ['The', 'lab', 'published', 'the', 'weights', 'it', 'trained'];
  const n = labels.length;

  const pad = w * 0.09;
  const span = w - pad * 2;
  const step = span / (n - 1);
  const yRow = h * 0.2;

  // Weights: "it" (index 5) refers back to "lab" (index 1).
  const weights = [];
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j <= i; j++) {
      let v = 1 / (1 + Math.abs(i - j) * 1.7);
      if (i === 5 && j === 1) v = 1.9;          // coreference
      if (i === 4 && j === 2) v = 1.3;          // verb → object
      row.push(v);
    }
    const sum = row.reduce((a, b) => a + b, 0);
    weights.push(row.map((v) => v / sum));
  }

  // How many query rows have been revealed.
  const reveal = clamp(t * 1.5) * n;

  // Tokens
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  mono(ctx, w * 0.026);
  labels.forEach((l, i) => {
    const x = pad + step * i;
    const isActive = i < reveal;
    ctx.fillStyle = isActive ? C.text : C.dim;
    ctx.globalAlpha = A * (isActive ? 1 : 0.5);
    ctx.fillText(l, x, yRow);
    ctx.globalAlpha = A;

    ctx.beginPath();
    ctx.arc(x, yRow + h * 0.045, 3, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? C.cyan : C.line;
    ctx.fill();
  });

  // Arcs
  const arcTop = yRow + h * 0.05;
  for (let i = 0; i < n; i++) {
    const rowA = clamp(reveal - i);
    if (rowA <= 0) continue;
    for (let j = 0; j < weights[i].length; j++) {
      const v = weights[i][j];
      if (v < 0.06) continue;

      const x1 = pad + step * j;
      const x2 = pad + step * i;
      const mid = (x1 + x2) / 2;
      const depth = Math.min(h * 0.24, Math.abs(x2 - x1) * 0.55 + h * 0.03);

      ctx.beginPath();
      ctx.moveTo(x1, arcTop);
      ctx.bezierCurveTo(x1, arcTop + depth, x2, arcTop + depth, x2, arcTop);

      const strong = v > 0.3;
      ctx.strokeStyle = strong ? C.cyan : C.violet;
      ctx.lineWidth = 0.6 + v * 5;
      ctx.globalAlpha = A * clamp(v * 2.2) * rowA * 0.9;
      ctx.stroke();
      void mid;
    }
  }
  ctx.globalAlpha = A;

  // Matrix heatmap
  const mS = Math.min(w * 0.42, h * 0.3);
  const mx = w / 2 - mS / 2;
  const my = h * 0.62;
  const cell = mS / n;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const filled = i < reveal;
      const v = j <= i ? weights[i][j] : 0;
      ctx.fillStyle = j > i
        ? 'rgba(107,117,153,0.06)'
        : `rgba(${34 + v * 120}, ${224 - v * 40}, 255, ${filled ? 0.08 + v * 0.9 : 0.05})`;
      ctx.fillRect(mx + j * cell + 0.5, my + i * cell + 0.5, cell - 1, cell - 1);
    }
  }

  ctx.strokeStyle = C.line;
  ctx.strokeRect(mx, my, mS, mS);

  mono(ctx, w * 0.022);
  ctx.fillStyle = C.dim;
  ctx.fillText('query × key, one head of 96', w / 2, my + mS + h * 0.05);

  // Call out the coreference link once it has been drawn.
  if (reveal > 5.4) {
    mono(ctx, w * 0.024);
    ctx.fillStyle = C.cyan;
    ctx.globalAlpha = A * clamp((reveal - 5.4) * 2);
    ctx.fillText('"it" reaches back to "lab" — this head does coreference', w / 2, h * 0.52);
    ctx.globalAlpha = A;
  }
}

/* ---- 03 · generation ----------------------------------------------------- */
function drawGeneration(ctx, w, h, t, now) {
  const A = ctx.globalAlpha;
  const steps = [
    ['because', [['because', 0.61], ['since', 0.17], ['as', 0.09], ['so', 0.07], ['and', 0.06]]],
    [' an', [['an', 0.54], ['the', 0.22], ['any', 0.12], ['every', 0.07], ['no', 0.05]]],
    [' explanation', [['explanation', 0.72], ['account', 0.11], ['argument', 0.08], ['answer', 0.05], ['excuse', 0.04]]],
    [' nobody', [['nobody', 0.48], ['no', 0.24], ['none', 0.13], ['few', 0.09], ['someone', 0.06]]],
    [' can', [['can', 0.66], ['could', 0.15], ['will', 0.10], ['may', 0.05], ['should', 0.04]]],
    [' reproduce', [['reproduce', 0.79], ['verify', 0.09], ['repeat', 0.06], ['check', 0.04], ['test', 0.02]]],
  ];

  const prog = clamp(t * 1.35) * steps.length;
  const idx = Math.min(steps.length - 1, Math.floor(prog));
  const inner = prog - idx;

  // Growing sentence
  const pad = w * 0.1;
  mono(ctx, w * 0.033);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const prefix = 'The lab published the weights';
  let line = prefix;
  for (let k = 0; k < idx; k++) line += steps[k][0];

  // wrap
  const maxW = w - pad * 2;
  const words = (line + (prog >= steps.length ? '' : steps[idx][0])).trim().split(' ');
  const lines = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = word; }
    else cur = test;
  }
  lines.push(cur);

  ctx.fillStyle = C.text;
  lines.forEach((l, i) => {
    ctx.fillText(l, pad, h * 0.16 + i * w * 0.05);
  });

  // caret
  if (Math.floor(now / 500) % 2 === 0) {
    const last = lines[lines.length - 1];
    const lw = ctx.measureText(last).width;
    ctx.fillStyle = C.cyan;
    ctx.fillRect(pad + lw + 4, h * 0.16 + (lines.length - 1) * w * 0.05, w * 0.016, w * 0.038);
  }

  // Candidate bars
  const cands = steps[idx][1];
  const bx = pad;
  const by = h * 0.5;
  const bw = w - pad * 2;
  const rowH = h * 0.062;

  mono(ctx, w * 0.021);
  ctx.fillStyle = C.dim;
  ctx.fillText(`step ${idx + 1} of ${steps.length} · softmax over 128,000 tokens`, bx, by - h * 0.05);

  cands.forEach(([label, p], k) => {
    const y = by + k * rowH;
    const grow = easeOut(clamp(inner * 2.4 - k * 0.08));
    const barW = bw * 0.62 * p * grow;

    ctx.fillStyle = k === 0 ? C.text : C.dim;
    mono(ctx, w * 0.024);
    ctx.textAlign = 'left';
    ctx.fillText(label, bx, y);

    const trackX = bx + bw * 0.3;
    ctx.fillStyle = 'rgba(107,117,153,0.16)';
    ctx.fillRect(trackX, y + w * 0.008, bw * 0.62, 4);

    ctx.fillStyle = k === 0 ? C.cyan : C.violet;
    ctx.globalAlpha = A * (k === 0 ? 1 : 0.65);
    ctx.fillRect(trackX, y + w * 0.008, barW, 4);
    ctx.globalAlpha = A;

    ctx.fillStyle = C.dim;
    mono(ctx, w * 0.02);
    ctx.textAlign = 'right';
    ctx.fillText(`${(p * 100).toFixed(0)}%`, bx + bw, y);
  });

  ctx.textAlign = 'center';
  mono(ctx, w * 0.023);
  ctx.fillStyle = C.cyan;
  ctx.fillText('the chosen token is appended, then the whole machine runs again',
    w / 2, h * 0.9);
}
