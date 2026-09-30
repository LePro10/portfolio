/* ==========================================================================
   nebula.js — the ambient backdrop on inner pages

   Renders at a fraction of device resolution (it is a soft field; nobody can
   tell) and pauses whenever the tab is hidden.
   ========================================================================== */

import { getContext, createProgram, createQuad, resizeCanvas, visibilityGate } from './gl.js';
import { VERT, FRAG } from './shaders/nebula.glsl.js';
import { onTick } from '../core/raf.js';
import { scroll } from '../core/scroll.js';
import { pointer } from '../core/pointer.js';
import { perf, onTierChange } from '../core/perf.js';

const SCALE = { 2: 0.55, 1: 0.4, 0: 0 };

export function mountNebula(canvas, opts = {}) {
  const gl = getContext(canvas);
  if (!gl) {
    // No WebGL: the CSS gradient on <body> is already a complete backdrop.
    return null;
  }

  let program;
  try {
    program = createProgram(gl, VERT, FRAG);
  } catch (err) {
    console.warn('[nebula] shader unavailable', err);
    return null;
  }

  const quad = createQuad(gl);

  const uniforms = {
    turb: opts.turb ?? 3.2,
    speed: opts.speed ?? 0.45,
    warp: opts.warp ?? 1.1,
    hue: opts.hue ?? 0,
    contrast: opts.contrast ?? 1,
    alpha: opts.alpha ?? 0.85,
  };

  let running = true;
  let fixedScale = null;               // set by setScale(); pins render quality
  let scale = SCALE[perf.tier] ?? 0.55;

  visibilityGate(canvas, (v) => { running = v; });
  onTierChange((t) => {
    if (fixedScale === null) scale = SCALE[t] ?? 0.55;
    if (t === 0 && fixedScale === null) canvas.classList.remove('is-ready');
    else canvas.classList.add('is-ready');
    resizeCanvas(gl, canvas, scale || 0.4);
  });

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  resizeCanvas(gl, canvas, scale);
  requestAnimationFrame(() => canvas.classList.add('is-ready'));

  const stop = onTick((_dt, now) => {
    if (!running || scale === 0 || gl.isContextLost()) return;

    resizeCanvas(gl, canvas, scale);

    program.use();
    program.set('uRes', [canvas.width, canvas.height]);
    program.set('uTime', now * 0.001);
    program.set('uScroll', scroll.progress);
    program.set('uPointer', [pointer.nx * 0.5, -pointer.ny * 0.5]);
    program.set('uTurb', uniforms.turb);
    program.set('uSpeed', uniforms.speed);
    program.set('uWarp', uniforms.warp);
    program.set('uHue', uniforms.hue);
    program.set('uContrast', uniforms.contrast);
    program.set('uAlpha', uniforms.alpha);

    gl.clear(gl.COLOR_BUFFER_BIT);
    quad.draw();
  });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    running = false;
    canvas.classList.remove('is-ready');
  });

  return {
    uniforms,
    /** Pin the render scale (the shader lab wants full quality). */
    setScale(s) { fixedScale = s; scale = s; },
    dispose() {
      stop();
      quad.dispose();
      gl.deleteProgram(program.prog);
    },
  };
}
