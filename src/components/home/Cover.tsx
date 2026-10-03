'use client';

import { useEffect, useRef } from 'react';
import { randomGenerator } from '@/components/scene/terrain';
import type { CoverKind, Hue } from '@/content/profile';

const W = 312;
const H = 360;

function hash(text: string) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Dieselben Farben wie die Tokens --pf-t-* in globals.css. */
const HUES: Record<Hue, [number, number, number]> = {
  ice: [185, 211, 255], azure: [96, 128, 255], lilac: [168, 152, 255],
  sand: [234, 220, 188], ember: [255, 138, 92], mint: [159, 231, 200],
};

/**
 * Point clouds in the same visual language as the hero, lit in the project's own colour:
 * a soft light from above, dots that warm from white into the hue towards the light.
 */
function draw(ctx: CanvasRenderingContext2D, kind: CoverKind, seed: number, hue: Hue) {
  const rnd = randomGenerator(seed % 9973);
  const dot = (x: number, y: number, a: number, r = 1.1) => {
    ctx.globalAlpha = Math.max(0, Math.min(1, a * 1.6));
    ctx.fillRect(x - r / 2, y - r / 2, r, r);
  };
  const [r, g, b] = HUES[hue];
  ctx.fillStyle = '#0c0d10';
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.62, -H * 0.1, 0, W * 0.62, -H * 0.1, H * 0.95);
  glow.addColorStop(0, `rgb(${r} ${g} ${b} / .34)`);
  glow.addColorStop(0.45, `rgb(${r} ${g} ${b} / .08)`);
  glow.addColorStop(1, 'rgb(0 0 0 / 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  const ink = ctx.createLinearGradient(0, 0, 0, H);
  ink.addColorStop(0, `rgb(${r} ${g} ${b})`);
  ink.addColorStop(1, '#e9edf2');
  ctx.fillStyle = ink;
  const phase = rnd() * 10;

  if (kind === 'terrain') {
    for (let row = 0; row < 70; row++) {
      const z = row / 69;
      const y0 = 120 + z * 210;
      for (let i = 0; i < 260; i++) {
        const x = (i / 259) * W;
        const u = x / W - 0.5;
        const h = Math.exp(-u * u * 9) * (70 + 50 * Math.sin(phase + u * 7 + z * 3)) * (1 - z * 0.6);
        dot(x + (rnd() - 0.5) * 2, y0 - h + (rnd() - 0.5) * 3, 0.15 + (1 - z) * 0.5 * rnd());
      }
    }
  } else if (kind === 'rings') {
    const cx = W / 2, cy = H / 2;
    for (let ring = 1; ring < 26; ring++) {
      const r = ring * 6.4;
      const n = Math.floor(r * 2.4);
      for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2;
        const wob = Math.sin(t * 3 + phase + ring * 0.4) * ring * 0.5;
        const lit = 0.5 + 0.5 * Math.cos(t - phase);
        dot(cx + Math.cos(t) * (r + wob), cy + Math.sin(t) * (r + wob) * 0.92, 0.12 + lit * 0.7 * (1 - ring / 30));
      }
    }
    for (let i = 0; i < 40; i++) dot(cx + (rnd() - 0.5) * 18, cy + (rnd() - 0.5) * 18, 0.9, 1.4);
  } else if (kind === 'grid') {
    const cols = 2 + Math.floor(rnd() * 2), rows = 3;
    const pw = (W - 40) / cols, ph = (H - 60) / rows;
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      const x0 = 20 + c * pw, y0 = 30 + r * ph;
      for (let x = 0; x < pw - 8; x += 3) { dot(x0 + x, y0, 0.35); dot(x0 + x, y0 + ph - 8, 0.2); }
      for (let y = 0; y < ph - 8; y += 3) { dot(x0, y0 + y, 0.3); dot(x0 + pw - 8, y0 + y, 0.2); }
      const lines = 3 + Math.floor(rnd() * 5);
      for (let l = 0; l < lines; l++) {
        const len = (0.2 + rnd() * 0.65) * (pw - 24);
        for (let x = 0; x < len; x += 2.2) dot(x0 + 8 + x, y0 + 12 + l * 9, 0.25 + rnd() * 0.5);
      }
    }
  } else if (kind === 'flow') {
    for (let p = 0; p < 900; p++) {
      let x = rnd() * W, y = rnd() * H;
      for (let s = 0; s < 18; s++) {
        const a = Math.sin(x * 0.012 + phase) * 2 + Math.cos(y * 0.015 - phase) * 2;
        x += Math.cos(a) * 3; y += Math.sin(a) * 3;
        dot(x, y, 0.05 + (s / 18) * 0.4);
      }
    }
  } else if (kind === 'map') {
    // A loose island chain along a curve, sampled as dense clusters.
    for (let i = 0; i < 2600; i++) {
      const t = rnd();
      const cx = 70 + t * 170 + Math.sin(t * 5) * 25;
      const cy = 300 - t * 250 + Math.cos(t * 7) * 18;
      const spread = 8 + 14 * Math.sin(t * Math.PI);
      dot(cx + (rnd() - 0.5) * spread * 2, cy + (rnd() - 0.5) * spread, 0.3 + rnd() * 0.6);
    }
    for (let y = 8; y < H; y += 9) for (let x = 8; x < W; x += 9) dot(x, y, 0.06);
  } else {
    for (let line = 0; line < 46; line++) {
      const y0 = 40 + line * 6.4;
      for (let x = 0; x < W; x += 1.6) {
        const y = y0 + Math.sin(x * 0.03 + phase + line * 0.22) * 16 * Math.sin(line / 46 * Math.PI);
        dot(x, y, 0.1 + 0.55 * Math.pow(Math.sin(x / W * Math.PI), 2) * rnd());
      }
    }
  }
  ctx.globalAlpha = 1;
}

export function Cover({ kind, name, hue = 'ice', className = '' }: { kind: CoverKind; name: string; hue?: Hue; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, kind, hash(name), hue);
  }, [kind, name, hue]);
  return <canvas ref={ref} className={`pf-cover ${className}`} aria-hidden="true" />;
}
