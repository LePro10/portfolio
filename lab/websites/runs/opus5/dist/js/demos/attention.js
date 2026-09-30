/* ==========================================================================
   demos/attention.js — arc diagram of a simulated attention head

   No model is involved. Each "head" is a small hand-written scoring rule that
   produces the *shape* the real thing produces: local for syntax, long-range
   for coreference, flat-ish for global, previous-token for carry.
   ========================================================================== */

import { onTick, clamp, damp, lerp, easeOut } from '../core/raf.js';
import { env } from '../core/env.js';

const C = {
  line: 'rgba(107,117,153,0.28)',
  dim: 'rgba(167,176,208,0.6)',
  text: '#eef2ff',
  cyan: '#22e0ff',
  violet: '#7c5cff',
  magenta: '#ff4ecd',
};

const STOP = new Set(['the', 'a', 'an', 'is', 'was', 'are', 'be', 'of', 'to', 'and',
  'in', 'it', 'that', 'this', 'because', 'can', 'no', 'nobody']);

/** Crude subword split so long words visibly cost more than one token. */
function tokenize(text) {
  const out = [];
  for (const word of text.trim().split(/\s+/).filter(Boolean)) {
    const core = word.replace(/[.,;:!?]$/, '');
    const tail = word.slice(core.length);

    if (core.length > 9) {
      let i = 0;
      while (i < core.length) {
        const n = i === 0 ? 5 : 4;
        out.push(core.slice(i, i + n));
        i += n;
      }
    } else if (core) {
      out.push(core);
    }
    if (tail) out.push(tail);
    if (out.length > 40) break;
  }
  return out;
}

function hash(i, j, salt) {
  const x = Math.sin(i * 12.9898 + j * 78.233 + salt * 3.1) * 43758.5453;
  return x - Math.floor(x);
}

/** Row i of a causal attention matrix, normalised. */
function weightsFor(tokens, i, head) {
  const row = [];
  for (let j = 0; j <= i; j++) {
    const d = i - j;
    const tok = tokens[j].toLowerCase();
    let v;

    switch (head) {
      case 'coref':
        // Reach back for content words; ignore function words entirely.
        v = STOP.has(tok) ? 0.02 : 0.15 + (tok.length / 12) * (1 - d / (i + 4));
        if (d === 0) v = 0.08;
        if (/^[A-Z]/.test(tokens[j])) v *= 1.9;
        break;

      case 'global':
        // Broad, with the classic sink on the first token.
        v = 0.25 + hash(i, j, 2) * 0.3;
        if (j === 0) v += 1.4;
        break;

      case 'carry':
        // Almost entirely the previous token — an arithmetic-carry shape.
        v = d === 1 ? 2.6 : d === 2 ? 0.5 : d === 0 ? 0.25 : 0.03;
        break;

      case 'syntax':
      default:
        v = 1 / (1 + d * d * 0.55);
        if (STOP.has(tok)) v *= 1.35;   // determiners bind tightly to their noun
        break;
    }

    row.push(Math.max(0.001, v * (0.9 + hash(i, j, head.length) * 0.2)));
  }

  const sum = row.reduce((a, b) => a + b, 0);
  return row.map((v) => v / sum);
}

export function initAttention() {
  const canvas = document.getElementById('att-canvas');
  const input = document.getElementById('att-input');
  const seg = document.getElementById('att-heads');
  const foot = document.getElementById('att-foot');
  if (!canvas || !input) return;

  const ctx = canvas.getContext('2d');

  let tokens = tokenize(input.value);
  let head = 'syntax';
  let hover = -1;
  let hoverEase = -1;
  let boxes = [];
  let reveal = 0;

  function retokenize() {
    tokens = tokenize(input.value || ' ');
    reveal = 0;
    if (foot) {
      foot.textContent = `Hover a token to isolate its attention · ${tokens.length} tokens · head: ${head}`;
    }
  }

  input.addEventListener('input', retokenize);

  seg?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-head]');
    if (!btn) return;
    [...seg.querySelectorAll('button')].forEach((b) =>
      b.setAttribute('aria-pressed', String(b === btn))
    );
    head = btn.dataset.head;
    reveal = 0;
    retokenize();
  });

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    hover = -1;
    for (const b of boxes) {
      if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) { hover = b.i; break; }
    }
    canvas.style.cursor = hover >= 0 ? 'pointer' : 'default';
  });
  canvas.addEventListener('pointerleave', () => { hover = -1; });

  retokenize();

  onTick((dt, now) => {
    const dpr = env.dpr;
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    if (!w || !h) return;

    reveal = env.reduced ? 1 : lerp(reveal, 1, damp(2.2, dt));
    hoverEase = hover;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = w / dpr;
    const H = h / dpr;
    ctx.clearRect(0, 0, W, H);

    /* -- lay tokens out on one line, shrinking to fit ------------------- */
    const pad = 18;
    let size = 15;
    let widths = [];
    let total = 0;
    const gap = 8;

    for (let attempt = 0; attempt < 14; attempt++) {
      ctx.font = `500 ${size}px "Cascadia Code", ui-monospace, Consolas, monospace`;
      widths = tokens.map((t) => ctx.measureText(t).width + 12);
      total = widths.reduce((a, b) => a + b, 0) + gap * (tokens.length - 1);
      if (total <= W - pad * 2 || size <= 8) break;
      size -= 0.6;
    }

    const y = H * 0.16;
    const chipH = size * 1.85;
    let x = Math.max(pad, (W - total) / 2);

    boxes = tokens.map((t, i) => {
      const b = { i, x0: x, x1: x + widths[i], y0: y - chipH / 2, y1: y + chipH / 2, cx: x + widths[i] / 2 };
      x += widths[i] + gap;
      return b;
    });

    const arcTop = y + chipH / 2 + 4;
    const maxDepth = H - arcTop - 26;

    /* -- arcs ------------------------------------------------------------ */
    const rows = hoverEase >= 0 ? [hoverEase] : tokens.map((_, i) => i);

    for (const i of rows) {
      if (i >= tokens.length) continue;
      const rowIn = clamp(reveal * tokens.length - i);
      if (rowIn <= 0) continue;

      const wts = weightsFor(tokens, i, head);
      for (let j = 0; j < wts.length; j++) {
        const v = wts[j];
        if (v < 0.035) continue;

        const x1 = boxes[j].cx;
        const x2 = boxes[i].cx;
        const dist = Math.abs(x2 - x1);
        const depth = Math.min(maxDepth, 18 + dist * 0.5);

        ctx.beginPath();
        ctx.moveTo(x1, arcTop);
        ctx.bezierCurveTo(x1, arcTop + depth, x2, arcTop + depth, x2, arcTop);

        const strong = v > 0.28;
        ctx.strokeStyle = strong ? C.cyan : C.violet;
        ctx.lineWidth = 0.5 + v * 6;
        ctx.globalAlpha = clamp(v * 2.4) * rowIn * (hoverEase >= 0 ? 1 : 0.55);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    /* -- token chips ----------------------------------------------------- */
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `500 ${size}px "Cascadia Code", ui-monospace, Consolas, monospace`;

    boxes.forEach((b, i) => {
      const on = clamp(reveal * tokens.length * 1.4 - i);
      if (on <= 0) return;

      const isHover = hoverEase === i;
      ctx.globalAlpha = easeOut(on);

      ctx.beginPath();
      ctx.roundRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, 5);
      ctx.fillStyle = isHover ? 'rgba(34,224,255,0.16)' : 'rgba(16,21,42,0.7)';
      ctx.fill();
      ctx.strokeStyle = isHover ? C.cyan : C.line;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = isHover ? C.cyan : C.text;
      ctx.fillText(tokens[i], b.cx, y + 0.5);
    });

    ctx.globalAlpha = 1;

    /* -- legend ---------------------------------------------------------- */
    ctx.textAlign = 'left';
    ctx.font = `400 11px "Cascadia Code", ui-monospace, Consolas, monospace`;
    ctx.fillStyle = C.dim;
    ctx.fillText(
      hoverEase >= 0
        ? `query: "${tokens[hoverEase]}" — showing only what it attends to`
        : 'all queries shown; hover a token to isolate one',
      pad, H - 12
    );
    void now;
  });
}
