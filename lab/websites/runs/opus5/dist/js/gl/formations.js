/* ==========================================================================
   formations.js — the four target shapes, computed on the CPU

   Each returns a Float32Array of RGBA texels (xyz = target position, w = a
   stable per-particle seed) sized for the current particle texture.
   ========================================================================== */

/** Deterministic PRNG so a resize/tier change does not reshuffle the field. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** 0 — diffuse cloud: a thick shell with a slight vertical squash. */
export function cloud(n) {
  const out = new Float32Array(n * 4);
  const rand = rng(20260419);
  for (let i = 0; i < n; i++) {
    const u = rand() * 2 - 1;
    const th = rand() * Math.PI * 2;
    const r = 1.5 + Math.pow(rand(), 0.6) * 1.5;
    const s = Math.sqrt(1 - u * u);
    out[i * 4 + 0] = Math.cos(th) * s * r * 1.35;
    out[i * 4 + 1] = u * r * 0.62;
    out[i * 4 + 2] = Math.sin(th) * s * r;
    out[i * 4 + 3] = rand();
  }
  return out;
}

/** 1 — neural sphere: a Fibonacci shell with a few denser "nuclei". */
export function sphere(n) {
  const out = new Float32Array(n * 4);
  const rand = rng(77123);
  const GA = Math.PI * (3 - Math.sqrt(5));

  // A handful of attractor points make the shell look organised rather than
  // uniformly speckled.
  const nuclei = [];
  for (let k = 0; k < 7; k++) {
    const y = 1 - (k / 6) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const t = GA * k * 3.7;
    nuclei.push([Math.cos(t) * r, y, Math.sin(t) * r]);
  }

  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const t = GA * i;

    let x = Math.cos(t) * r;
    let z = Math.sin(t) * r;
    let yy = y;

    // Pull 30% of points toward the nearest nucleus.
    if (rand() < 0.3) {
      const nuc = nuclei[(rand() * nuclei.length) | 0];
      const w = 0.35 + rand() * 0.4;
      x += (nuc[0] - x) * w;
      yy += (nuc[1] - yy) * w;
      z += (nuc[2] - z) * w;
    }

    const rad = 1.28 + (rand() - 0.5) * 0.12;
    out[i * 4 + 0] = x * rad;
    out[i * 4 + 1] = yy * rad;
    out[i * 4 + 2] = z * rad;
    out[i * 4 + 3] = rand();
  }
  return out;
}

/**
 * 2 — the wordmark. Text is rasterised to an offscreen canvas, opaque pixels
 * are collected, and particles are dealt onto them. This is why the letters
 * are crisp instead of approximated by a signed-distance guess.
 */
export function wordmark(n, text = 'NOETIC') {
  const W = 1200;
  const H = 300;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return cloud(n);

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Fit the word to the canvas whatever font actually resolved, with the
  // tracking applied *before* measuring so it is included in the fit.
  const face = (px) => `700 ${px}px "Segoe UI", Inter, system-ui, sans-serif`;
  const TARGET = W * 0.94;

  let size = 240;
  for (let i = 0; i < 8; i++) {
    ctx.letterSpacing = `${(size * 0.05).toFixed(1)}px`;
    ctx.font = face(size);
    const measured = ctx.measureText(text).width;
    if (!measured) break;
    const next = size * (TARGET / measured);
    if (Math.abs(next - size) < 0.5) { size = next; break; }
    size = Math.min(next, H * 1.1);
  }

  ctx.letterSpacing = `${(size * 0.05).toFixed(1)}px`;
  ctx.font = face(size);
  ctx.fillText(text, W / 2, H / 2);

  const data = ctx.getImageData(0, 0, W, H).data;
  const hits = [];
  // Step by 2px: ~45k candidate points is plenty to deal from.
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (data[(y * W + x) * 4 + 3] > 128) hits.push(x, y);
    }
  }

  const out = new Float32Array(n * 4);
  const rand = rng(4242);
  const count = hits.length / 2;
  if (!count) return cloud(n);

  const SPAN = 3.6; // world units across the wordmark
  for (let i = 0; i < n; i++) {
    const j = (rand() * count) | 0;
    const x = hits[j * 2] + (rand() - 0.5) * 2;
    const y = hits[j * 2 + 1] + (rand() - 0.5) * 2;

    out[i * 4 + 0] = (x / W - 0.5) * SPAN;
    out[i * 4 + 1] = -(y / H - 0.5) * SPAN * (H / W);
    out[i * 4 + 2] = (rand() - 0.5) * 0.16;
    out[i * 4 + 3] = rand();
  }
  return out;
}

/** 3 — ordered lattice: a cube of cells with a small jitter. */
export function lattice(n) {
  const out = new Float32Array(n * 4);
  const rand = rng(99001);
  const side = Math.max(2, Math.round(Math.cbrt(n)));
  const step = 2.6 / (side - 1 || 1);

  for (let i = 0; i < n; i++) {
    const ix = i % side;
    const iy = ((i / side) | 0) % side;
    const iz = ((i / (side * side)) | 0) % side;

    out[i * 4 + 0] = (ix * step - 1.3) * 1.45;
    out[i * 4 + 1] = (iy * step - 1.3) * 0.78;
    out[i * 4 + 2] = iz * step - 1.3;
    out[i * 4 + 3] = rand();

    // Break up the perfect grid just enough to avoid moiré on screen.
    out[i * 4 + 0] += (rand() - 0.5) * 0.03;
    out[i * 4 + 1] += (rand() - 0.5) * 0.03;
    out[i * 4 + 2] += (rand() - 0.5) * 0.03;
  }
  return out;
}

export function buildAll(n) {
  return [cloud(n), sphere(n), wordmark(n), lattice(n)];
}

/** Initial state: everything starts scattered wide and settles inward. */
export function initialState(n) {
  const pos = new Float32Array(n * 4);
  const vel = new Float32Array(n * 4);
  const rand = rng(13337);
  for (let i = 0; i < n; i++) {
    const u = rand() * 2 - 1;
    const th = rand() * Math.PI * 2;
    const r = 3.5 + rand() * 3.5;
    const s = Math.sqrt(1 - u * u);
    pos[i * 4 + 0] = Math.cos(th) * s * r;
    pos[i * 4 + 1] = u * r;
    pos[i * 4 + 2] = Math.sin(th) * s * r;
    pos[i * 4 + 3] = rand();
  }
  return { pos, vel };
}
