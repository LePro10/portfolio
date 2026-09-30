/* ==========================================================================
   nebula.glsl.js — domain-warped fbm backdrop
   Shared by the inner-page ambient layer and the playground's shader lab, so
   the lab really is editing the same shader you see behind the pages.
   ========================================================================== */

export const VERT = /* glsl */ `#version 300 es
layout(location = 0) in vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export const FRAG = /* glsl */ `#version 300 es
precision highp float;

uniform vec2  uRes;
uniform vec2  uPointer;    // -1..1
uniform float uTime;
uniform float uScroll;     // 0..1 document progress
uniform float uTurb;       // spatial frequency
uniform float uSpeed;      // flow speed
uniform float uWarp;       // domain-warp strength
uniform float uHue;        // palette rotation
uniform float uContrast;
uniform float uAlpha;

out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i),               hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

const mat2 ROT = mat2(1.6, 1.2, -1.2, 1.6);

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = ROT * p;
    a *= 0.5;
  }
  return v;
}

// Cosine palette kept inside the cyan -> violet -> magenta family.
vec3 palette(float t) {
  vec3 a = vec3(0.16, 0.14, 0.26);
  vec3 b = vec3(0.30, 0.26, 0.48);
  vec3 c = vec3(1.00, 1.05, 0.90);
  vec3 d = vec3(0.52, 0.36, 0.82);
  return a + b * cos(6.28318 * (c * t + d + uHue));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;

  float t = uTime * uSpeed * 0.10 + uScroll * 1.6;

  // Two rounds of domain warping: the first bends space, the second textures it.
  vec2 q = vec2(fbm(uv * uTurb + t * 0.6),
                fbm(uv * uTurb + vec2(5.2, 1.3) - t * 0.4));

  vec2 r = vec2(fbm(uv * uTurb + uWarp * q + vec2(1.7, 9.2) + 0.16 * t),
                fbm(uv * uTurb + uWarp * q + vec2(8.3, 2.8) - 0.13 * t));

  float f = fbm(uv * uTurb + uWarp * r);

  vec3 col = palette(f * 0.9 + length(r) * 0.25 + uScroll * 0.15);

  // Filaments: sharpen the ridges so the field reads as structure, not fog.
  float ridge = smoothstep(0.42, 0.78, f) * (0.35 + 0.65 * length(q));
  col += ridge * vec3(0.16, 0.42, 0.72);

  // A soft well of light follows the cursor.
  vec2 pm = uPointer * vec2(uRes.x / uRes.y, 1.0);
  float d = length(uv - pm);
  col += vec3(0.10, 0.34, 0.55) * exp(-d * 3.4) * 0.55;

  col *= uContrast;

  // Vignette, then fade the whole layer toward the page edges.
  float vig = smoothstep(1.35, 0.28, length(uv * vec2(0.85, 1.0)));
  col *= vig;

  float a = uAlpha * vig * (0.42 + 0.58 * smoothstep(0.05, 0.65, f));
  fragColor = vec4(max(col, 0.0), a);
}`;
