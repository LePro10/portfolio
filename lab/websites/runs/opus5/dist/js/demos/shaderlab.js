/* ==========================================================================
   demos/shaderlab.js — live uniforms on the real backdrop shader

   This mounts the exact same program the inner pages use, then wires the
   sliders straight to its uniform object. Nothing is pre-rendered.
   ========================================================================== */

import { mountNebula } from '../gl/nebula.js';

const CONTROLS = [
  { id: 'turb', input: 'u-turb', out: 'v-turb', key: 'turb', scale: 0.01, def: 320 },
  { id: 'speed', input: 'u-speed', out: 'v-speed', key: 'speed', scale: 0.01, def: 45 },
  { id: 'warp', input: 'u-warp', out: 'v-warp', key: 'warp', scale: 0.01, def: 110 },
  { id: 'hue', input: 'u-hue', out: 'v-hue', key: 'hue', scale: 0.01, def: 0 },
  { id: 'cont', input: 'u-cont', out: 'v-cont', key: 'contrast', scale: 0.01, def: 100 },
];

export function initShaderLab() {
  const canvas = document.getElementById('lab-canvas');
  const note = document.getElementById('lab-note');
  if (!canvas) return;

  const lab = mountNebula(canvas, { alpha: 1, turb: 3.2, speed: 0.45, warp: 1.1, contrast: 1 });

  if (!lab) {
    if (note) note.textContent = 'WebGL2 unavailable — the shader cannot run here.';
    canvas.closest('.demo__frame')?.classList.add('is-unavailable');
    return;
  }

  // The lab canvas is not a background layer, so it renders at full quality.
  lab.setScale(1);
  canvas.classList.add('is-ready');
  canvas.style.opacity = '1';

  const apply = (c, raw) => {
    const v = raw * c.scale;
    lab.uniforms[c.key] = v;
    const out = document.getElementById(c.out);
    if (out) out.textContent = v.toFixed(2);
  };

  for (const c of CONTROLS) {
    const input = document.getElementById(c.input);
    if (!input) continue;
    apply(c, Number(input.value));
    input.addEventListener('input', () => apply(c, Number(input.value)));
  }

  document.getElementById('lab-reset')?.addEventListener('click', () => {
    for (const c of CONTROLS) {
      const input = document.getElementById(c.input);
      if (!input) continue;
      input.value = String(c.def);
      apply(c, c.def);
    }
  });

  if (note) note.textContent = 'GLSL · 1 draw call · fullscreen triangle';
}
