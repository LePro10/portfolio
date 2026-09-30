/* ==========================================================================
   field.js — the Latent Field

   A GPU particle system. Positions and velocities live in a pair of RGBA32F
   textures written together via MRT; every frame a fullscreen simulation pass
   integrates them, then one draw call renders a point per texel.

   Scroll drives `morph` (0..3) through cloud -> sphere -> wordmark -> lattice.
   ========================================================================== */

import {
  getContext, createProgram, createQuad, createDataTexture, resizeCanvas, visibilityGate,
} from './gl.js';
import { SIM_VERT, SIM_FRAG, DRAW_VERT, DRAW_FRAG } from './shaders/field.glsl.js';
import { buildAll, initialState } from './formations.js';
import { onTick, damp, lerp, clamp } from '../core/raf.js';
import { pointer } from '../core/pointer.js';
import { perf, onTierChange } from '../core/perf.js';

/** Texture dimensions per quality tier. */
const TIERS = {
  2: [352, 288],   // ~101k particles
  1: [192, 160],   // ~31k
  0: [0, 0],       // off
};

const CAM_Z = 4.4;
const FOCAL = 2.3;

function makeState(gl, W, H, posData, velData) {
  const posTex = createDataTexture(gl, W, H, posData);
  const velTex = createDataTexture(gl, W, H, velData);
  const fbo = gl.createFramebuffer();

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, posTex, 0);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, velTex, 0);
  gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(`[field] MRT framebuffer incomplete (0x${status.toString(16)})`);
  }
  return { posTex, velTex, fbo };
}

export function mountField(canvas) {
  const gl = getContext(canvas);
  if (!gl) return null;

  let sim, draw, quad;
  try {
    sim = createProgram(gl, SIM_VERT, SIM_FRAG);
    draw = createProgram(gl, DRAW_VERT, DRAW_FRAG);
    quad = createQuad(gl);
  } catch (err) {
    console.warn('[field] shaders unavailable, falling back to the CSS backdrop', err);
    return null;
  }

  let W = 0, H = 0, N = 0;
  let a = null, b = null;
  let targets = [];
  let ready = false;

  function dispose() {
    [a, b].forEach((s) => {
      if (!s) return;
      gl.deleteTexture(s.posTex);
      gl.deleteTexture(s.velTex);
      gl.deleteFramebuffer(s.fbo);
    });
    targets.forEach((t) => gl.deleteTexture(t));
    targets = [];
    a = b = null;
  }

  function build(tier) {
    const [w, h] = TIERS[tier] ?? TIERS[1];
    if (!w) { dispose(); ready = false; return; }
    if (w === W && h === H) return;

    dispose();
    W = w; H = h; N = W * H;

    const { pos, vel } = initialState(N);
    a = makeState(gl, W, H, pos, vel);
    b = makeState(gl, W, H, pos, vel);
    targets = buildAll(N).map((data) => createDataTexture(gl, W, H, data));
    ready = true;
  }

  try {
    build(perf.tier);
  } catch (err) {
    console.warn('[field] could not allocate float targets', err);
    return null;
  }
  if (!ready) return null;

  onTierChange((t) => {
    try {
      build(t);
      canvas.classList.toggle('is-ready', ready);
    } catch (err) {
      console.warn('[field] rebuild failed', err);
      ready = false;
    }
  });

  /* ---- state ------------------------------------------------------------ */
  const state = {
    morph: 0,        // target, set from scroll
    morphSmooth: 0,
    alpha: 1,
    alphaSmooth: 0,  // fades up on first frames
    pointerAmp: 1.35,
    flow: 1.5,
    spring: 2.6,
  };

  let running = true;
  visibilityGate(canvas, (v) => { running = v; });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    running = false;
    ready = false;
    canvas.classList.remove('is-ready');
  });

  gl.clearColor(0, 0, 0, 0);
  resizeCanvas(gl, canvas, 1);
  requestAnimationFrame(() => canvas.classList.add('is-ready'));

  let yaw = 0;

  const stop = onTick((dt, now) => {
    if (!running || !ready || gl.isContextLost()) return;

    const seconds = dt / 1000;
    const k = damp(6, dt);

    state.morphSmooth = lerp(state.morphSmooth, state.morph, k);
    state.alphaSmooth = lerp(state.alphaSmooth, state.alpha, damp(3, dt));

    // Slow turntable, nudged by the pointer.
    yaw += seconds * 0.075;
    const yawTotal = yaw + pointer.nx * 0.42;
    const pitch = -pointer.ny * 0.22;

    /* -- pointer well, expressed in world space -------------------------- */
    const aspect = canvas.width / canvas.height;
    const f = CAM_Z / FOCAL;
    // view-space point on the z = 0 plane
    let vx = pointer.nx * aspect * f;
    let vy = -pointer.ny * f;
    let vz = 0;
    // undo pitch, then yaw
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    let ty = cp * vy + sp * vz;
    let tz = -sp * vy + cp * vz;
    vy = ty; vz = tz;
    const cy = Math.cos(yawTotal), sy = Math.sin(yawTotal);
    const tx = cy * vx + sy * vz;
    tz = -sy * vx + cy * vz;
    vx = tx;

    /* -- simulation pass -------------------------------------------------- */
    gl.bindFramebuffer(gl.FRAMEBUFFER, b.fbo);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.viewport(0, 0, W, H);
    gl.disable(gl.BLEND);

    sim.use();
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, a.posTex); sim.setInt('uPos', 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, a.velTex); sim.setInt('uVel', 1);
    for (let i = 0; i < 4; i++) {
      gl.activeTexture(gl.TEXTURE2 + i);
      gl.bindTexture(gl.TEXTURE_2D, targets[i]);
      sim.setInt(`uT${i}`, 2 + i);
    }
    sim.set('uMorph', state.morphSmooth);
    sim.set('uTime', now * 0.001);
    sim.set('uDt', seconds);
    sim.set('uPointer', [vx, vy, vz]);
    sim.set('uPointerAmp', pointer.inside ? state.pointerAmp : 0);
    sim.set('uFlow', state.flow);
    sim.set('uSpring', state.spring);
    quad.draw();

    const t = a; a = b; b = t;

    /* -- render pass ------------------------------------------------------ */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    resizeCanvas(gl, canvas, 1);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // additive

    draw.use();
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, a.posTex); draw.setInt('uPos', 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, a.velTex); draw.setInt('uVel', 1);
    draw.set('uTexSize', [W, H]);
    draw.set('uAspect', aspect);
    draw.set('uYaw', yawTotal);
    draw.set('uPitch', pitch);
    draw.set('uCamZ', CAM_Z);
    draw.set('uFocal', FOCAL);
    draw.set('uSize', canvas.height / 320);
    draw.set('uDpr', 1);
    draw.set('uAlpha', clamp(state.alphaSmooth) * 0.85);

    gl.bindVertexArray(null);
    gl.drawArrays(gl.POINTS, 0, N);
  });

  return {
    state,
    get count() { return N; },
    /** 0..3 across the four formations. */
    setMorph(v) { state.morph = clamp(v, 0, 3); },
    setAlpha(v) { state.alpha = clamp(v, 0, 1); },
    dispose() {
      stop();
      dispose();
      quad.dispose();
      gl.deleteProgram(sim.prog);
      gl.deleteProgram(draw.prog);
    },
  };
}
