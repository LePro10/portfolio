/* ==========================================================================
   pages/home.js — the Latent Field hero and the horizontal capability track
   ========================================================================== */

import { onTick, clamp } from '../core/raf.js';
import { pinProgress, scroll } from '../core/scroll.js';
import { env } from '../core/env.js';
import { initHorizontal } from '../modules/horizontal.js';

const STAGE_NAMES = ['Diffuse', 'Structure', 'Symbol', 'Lattice'];

export function init() {
  initHorizontal();
  initHeroField();
}

async function initHeroField() {
  const canvas = document.getElementById('field');
  const hero = document.getElementById('hero');
  const fill = document.getElementById('readout-fill');
  const stages = [...(document.getElementById('readout-stages')?.children || [])];

  if (!hero) return;

  // The readout is meaningful even with WebGL off — it reports scroll position.
  let field = null;

  if (canvas && !env.reduced) {
    try {
      const { mountField } = await import('../gl/field.js');
      field = mountField(canvas);
    } catch (err) {
      console.warn('[home] particle field unavailable', err);
    }
  }

  if (!field && canvas) {
    // Nothing to draw: leave the CSS gradient backdrop alone and hide the canvas.
    canvas.remove();
  }

  let lastStage = -1;

  onTick(() => {
    const p = pinProgress(hero);          // 0..1 across the tall hero
    const morph = clamp(p * 1.18, 0, 1) * 3; // reach the lattice a little early

    field?.setMorph(morph);

    // Once the hero is behind us the field becomes ambient rather than the
    // subject, so it steps back instead of competing with body copy.
    const past = clamp((scroll.smooth - hero.offsetHeight * 0.92) / (scroll.vh * 0.8));
    field?.setAlpha(1 - past * 0.72);

    if (fill) fill.style.width = `${(clamp(p) * 100).toFixed(1)}%`;

    const stage = Math.min(3, Math.floor(morph + 0.35));
    if (stage !== lastStage && stages.length) {
      lastStage = stage;
      stages.forEach((li, i) => li.classList.toggle('is-on', i === stage));
      const name = document.getElementById('stage-name');
      if (name) name.textContent = STAGE_NAMES[stage];
    }
  });
}
