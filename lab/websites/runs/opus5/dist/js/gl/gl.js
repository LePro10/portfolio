/* ==========================================================================
   gl.js — a very small WebGL2 helper

   Just enough to compile programs, cache uniform locations, draw a fullscreen
   quad, and ping-pong float render targets. No scene graph, no matrices beyond
   what the shaders do themselves.
   ========================================================================== */

import { env } from '../core/env.js';

export function getContext(canvas, opts = {}) {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: 'high-performance',
    ...opts,
  });
  if (!gl) return null;
  gl.getExtension('EXT_color_buffer_float');
  return gl;
}

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    const kind = type === gl.VERTEX_SHADER ? 'vertex' : 'fragment';
    gl.deleteShader(sh);
    throw new Error(`[gl] ${kind} shader failed:\n${log}`);
  }
  return sh;
}

/** Compile + link, returning a program with a memoised uniform setter. */
export function createProgram(gl, vsSrc, fsSrc) {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error(`[gl] link failed:\n${log}`);
  }

  const cache = new Map();
  const loc = (name) => {
    if (!cache.has(name)) cache.set(name, gl.getUniformLocation(prog, name));
    return cache.get(name);
  };

  return {
    prog,
    use: () => gl.useProgram(prog),
    loc,
    /** set('uName', value) — dispatches on the JS type/length. */
    set(name, v) {
      const l = loc(name);
      if (l === null) return;
      if (typeof v === 'number') gl.uniform1f(l, v);
      else if (typeof v === 'boolean') gl.uniform1i(l, v ? 1 : 0);
      else if (v.length === 2) gl.uniform2f(l, v[0], v[1]);
      else if (v.length === 3) gl.uniform3f(l, v[0], v[1], v[2]);
      else if (v.length === 4) gl.uniform4f(l, v[0], v[1], v[2], v[3]);
    },
    setInt(name, v) {
      const l = loc(name);
      if (l !== null) gl.uniform1i(l, v);
    },
  };
}

/** A single triangle covering the viewport — cheaper than two. */
export function createQuad(gl) {
  const vao = gl.createVertexArray();
  const buf = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  return {
    vao,
    draw() {
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    },
    dispose() {
      gl.deleteBuffer(buf);
      gl.deleteVertexArray(vao);
    },
  };
}

/** RGBA32F texture, NEAREST sampled (avoids needing float linear filtering). */
export function createDataTexture(gl, w, h, data = null) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return tex;
}

/**
 * A double-buffered float target. `read` is what you sample, `write` is what
 * you render into; call swap() once per simulation step.
 */
export function createPingPong(gl, w, h, initA = null, initB = null) {
  const make = (data) => {
    const tex = createDataTexture(gl, w, h, data);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`[gl] incomplete float framebuffer (0x${status.toString(16)})`);
    }
    return { tex, fbo };
  };

  let a = make(initA);
  let b = make(initB ?? initA);

  return {
    get read() { return a; },
    get write() { return b; },
    swap() { const t = a; a = b; b = t; },
    dispose() {
      [a, b].forEach(({ tex, fbo }) => {
        gl.deleteTexture(tex);
        gl.deleteFramebuffer(fbo);
      });
    },
  };
}

/**
 * Keep a canvas' backing store matched to its CSS box at the current DPR.
 * Returns true when the size actually changed this call.
 */
export function resizeCanvas(gl, canvas, scale = 1) {
  const dpr = env.dpr * scale;
  const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width === w && canvas.height === h) return false;
  canvas.width = w;
  canvas.height = h;
  gl.viewport(0, 0, w, h);
  return true;
}

/** Pause rendering while the tab is hidden or the canvas is off-screen. */
export function visibilityGate(canvas, onChange) {
  let visible = !document.hidden;
  let onScreen = true;

  const emit = () => onChange(visible && onScreen);

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    emit();
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      ([e]) => { onScreen = e.isIntersecting; emit(); },
      { rootMargin: '20% 0px' }
    );
    io.observe(canvas);
  }
}
