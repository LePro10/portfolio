'use client';

/**
 * Mesh-gradient light for page heroes, rendered once: a still image.
 * Übernommen aus dem Dashboard (projectWebsite/dashboard/src/ui/components), damit
 * Portfolio und Dashboard dasselbe Licht haben. Paletten unten sind dieselbe Familie.
 * Adapted from 21st.dev "Mesh Gradient" (paper-design, after Paper Shaders, Apache-2.0).
 *
 * It used to drift slowly at 12-30 fps, which was about half of the GPU load left on a
 * resting page (2026-09-29). Now one shared WebGL context draws exactly the pose the
 * animation opened with (scene time = seed * 9 * speed), copies it into a plain 2D
 * canvas and is done: no frame loop, and no WebGL context per page (Chrome allows ~16).
 * The canvas is redrawn only when its size changes. Same shader, same buffer size,
 * same upscaling: the first frame of before, kept.
 */
import { useEffect, useRef } from 'react';

const VERT = `attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`;

const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec3 u_colors[6];
uniform vec4 u_scene;   // res.xy, time, count
uniform vec4 u_shape;   // scale, intensity, falloff, warp
uniform vec4 u_finish;  // grain, seed, vignette, brightness

float hash21(vec2 p) { p = fract(p * vec2(234.34, 435.345)); p += dot(p, p + 34.23); return fract(p.x * p.y); }
float grainHash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.0, 9.2); a *= 0.5; } return v; }

vec3 shade(vec2 p, float t) {
  vec3 color = u_colors[0] * 0.2;
  float weight = 0.2;
  for (int i = 0; i < 6; i++) {
    if (float(i) >= u_scene.w) break;
    float fi = float(i);
    vec2 center = vec2(sin(fi * 2.17 + t * 0.13 + u_finish.y), cos(fi * 1.63 - t * 0.11)) * (0.22 + u_shape.y * 0.62);
    float influence = exp(-dot(p - center, p - center) * mix(12.0, 2.4, u_shape.z));
    color += u_colors[i] * influence;
    weight += influence;
  }
  return color / weight;
}

void main() {
  vec2 res = u_scene.xy;
  vec2 uv = gl_FragCoord.xy / res;
  vec2 p = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y);
  p *= u_shape.x;
  if (u_shape.w > 0.0) p += u_shape.w * (vec2(fbm(p * 1.8 + u_finish.y + u_scene.z * 0.05), fbm(p * 1.8 + vec2(5.2, 1.3) - u_scene.z * 0.04)) - 0.5);
  vec3 col = shade(p, u_scene.z) + u_finish.w;
  float vd = length(uv - 0.5) * 1.41421356;
  col *= 1.0 - u_finish.z * smoothstep(0.35, 1.0, vd);
  col += (grainHash(gl_FragCoord.xy + u_finish.y * 17.0) - 0.5) * u_finish.x;
  // Dither um ein halbes 8-Bit-Level: dunkle, sehr weiche Verläufe zerfallen sonst in sichtbare Stufen.
  col += (grainHash(gl_FragCoord.xy * 1.37 + 3.1) - 0.5) / 255.0;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

export interface MeshGradientProps {
  colors: string[];
  className?: string;
  scale?: number;
  intensity?: number;
  /** 0 = tight blobs, 1 = soft wash. */
  falloff?: number;
  warp?: number;
  grain?: number;
  seed?: number;
  vignette?: number;
  brightness?: number;
  /** Scales the scene time of the pose (the former drift speed). */
  speed?: number;
  /**
   * Canvas pixels per CSS pixel. The field is so soft that a tiny buffer,
   * upscaled by the compositor, looks identical and costs ~1/50 of the fill rate.
   */
  resolution?: number;
}

const hex = (h: string) => {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
};

type Params = Required<Omit<MeshGradientProps, 'className' | 'resolution'>>;

/** The one WebGL context all heroes share; rebuilt if the GPU dropped it (Android standby). */
let maler: { gl: WebGLRenderingContext; canvas: HTMLCanvasElement; u: Record<string, WebGLUniformLocation | null> } | null = null;

function malerHolen() {
  if (maler && !maler.gl.isContextLost()) return maler;
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, alpha: false, depth: false, stencil: false });
  if (!gl) return null;
  const compile = (type: number, src: string) => { const sh = gl.createShader(type)!; gl.shaderSource(sh, src); gl.compileShader(sh); return sh; };
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = Object.fromEntries(['u_colors', 'u_scene', 'u_shape', 'u_finish'].map((n) => [n, gl.getUniformLocation(program, n)]));
  maler = { gl, canvas, u };
  return maler;
}

/** Draws the pose into `ziel` (a 2D canvas) at w x h buffer pixels. */
function malen(p: Params, w: number, h: number, ziel: HTMLCanvasElement) {
  const m = malerHolen();
  if (!m) return;
  const { gl, canvas, u } = m;
  canvas.width = w; canvas.height = h;
  gl.viewport(0, 0, w, h);
  const pal = p.colors.slice(0, 6).map(hex);
  while (pal.length < 6) pal.push(pal[pal.length - 1]);
  gl.uniform3fv(u.u_colors, new Float32Array(pal.flat()));
  gl.uniform4f(u.u_shape, p.scale, p.intensity, p.falloff, p.warp);
  gl.uniform4f(u.u_finish, p.grain, p.seed, p.vignette, p.brightness);
  gl.uniform4f(u.u_scene, w, h, p.seed * 9 * p.speed, Math.min(p.colors.length, 6));
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  // Same task as the draw: the drawing buffer is still readable here.
  ziel.width = w; ziel.height = h;
  ziel.getContext('2d', { alpha: false })?.drawImage(canvas, 0, 0);
}

export function MeshGradient({
  colors, className, scale = 1.2, intensity = .4, falloff = .3, warp = .25, grain = .05,
  seed = 1, vignette = 0, brightness = 0, speed = .5, resolution = .5,
}: MeshGradientProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = colors.join() + [scale, intensity, falloff, warp, grain, seed, vignette, brightness, speed, resolution].join();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const p: Params = { colors, scale, intensity, falloff, warp, grain, seed, vignette, brightness, speed };
    let w0 = 0, h0 = 0;
    const zeichnen = (cssW: number, cssH: number) => {
      const w = Math.max(1, Math.round(cssW * resolution)), h = Math.max(1, Math.round(cssH * resolution));
      if (w === w0 && h === h0) return;
      w0 = w; h0 = h;
      malen(p, w, h, canvas);
    };
    zeichnen(canvas.clientWidth, canvas.clientHeight);
    const ro = new ResizeObserver(([e]) => zeichnen(e.contentRect.width, e.contentRect.height));
    ro.observe(canvas);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <canvas ref={ref} className={className} style={{ display: 'block', width: '100%', height: '100%' }} aria-hidden="true" />;
}
