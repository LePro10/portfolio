/* ==========================================================================
   field.glsl.js — the Latent Field

   SIM_*    integrates positions and velocities in a float texture pair (MRT).
   DRAW_*   renders one additive point sprite per texel.

   Particles are pulled toward a blended target formation while a curl-noise
   flow keeps them alive and the pointer pushes a repulsion well through them.
   ========================================================================== */

export const SIM_VERT = /* glsl */ `#version 300 es
layout(location = 0) in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

export const SIM_FRAG = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uPos;
uniform sampler2D uVel;
uniform sampler2D uT0;   // diffuse cloud
uniform sampler2D uT1;   // neural sphere
uniform sampler2D uT2;   // wordmark
uniform sampler2D uT3;   // lattice

uniform float uMorph;      // 0..3, continuous
uniform float uTime;
uniform float uDt;         // seconds, clamped
uniform vec3  uPointer;    // world-space cursor well
uniform float uPointerAmp;
uniform float uFlow;       // curl-noise strength
uniform float uSpring;

layout(location = 0) out vec4 outPos;
layout(location = 1) out vec4 outVel;

/* ---- cheap 3D value noise --------------------------------------------- */
float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash31(i + vec3(0,0,0)), hash31(i + vec3(1,0,0)), f.x),
        mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
        mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y),
    f.z);
}

/* Curl of a noise potential: divergence-free, so the flow swirls instead of
   collapsing into sinks. */
vec3 curl(vec3 p) {
  const float e = 0.14;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);

  float x1 = noise3(p + dy) - noise3(p - dy);
  float x2 = noise3(p + dz) - noise3(p - dz);
  float y1 = noise3(p + dz) - noise3(p - dz);
  float y2 = noise3(p + dx) - noise3(p - dx);
  float z1 = noise3(p + dx) - noise3(p - dx);
  float z2 = noise3(p + dy) - noise3(p - dy);

  return normalize(vec3(x1 - x2, y1 - y2, z1 - z2) + 1e-6);
}

/* Tent weights: at uMorph = 1.4 the target is 60% sphere, 40% wordmark. */
float tent(float m, float i) {
  return max(0.0, 1.0 - abs(m - i));
}

void main() {
  ivec2 px = ivec2(gl_FragCoord.xy);
  vec4 posSample = texelFetch(uPos, px, 0);
  vec4 velSample = texelFetch(uVel, px, 0);

  vec3 pos = posSample.xyz;
  float seed = posSample.w;
  vec3 vel = velSample.xyz;

  vec3 target =
      texelFetch(uT0, px, 0).xyz * tent(uMorph, 0.0)
    + texelFetch(uT1, px, 0).xyz * tent(uMorph, 1.0)
    + texelFetch(uT2, px, 0).xyz * tent(uMorph, 2.0)
    + texelFetch(uT3, px, 0).xyz * tent(uMorph, 3.0);

  // Spring toward the formation. Stiffness rises with how "ordered" the
  // current target is, so the cloud stays loose and the lattice snaps.
  float order = smoothstep(0.0, 3.0, uMorph);
  float k = uSpring * (0.6 + 1.9 * order);
  vec3 acc = (target - pos) * k;

  // Ambient flow, scaled down as the formation tightens.
  float flowAmt = uFlow * (1.0 - 0.72 * order) * (0.55 + 0.45 * seed);
  acc += curl(pos * 0.55 + vec3(0.0, 0.0, uTime * 0.08) + seed * 3.1) * flowAmt;

  // Pointer repulsion well.
  vec3 d = pos - uPointer;
  float dist = length(d) + 1e-4;
  acc += (d / dist) * uPointerAmp * exp(-dist * dist * 1.1);

  float dt = clamp(uDt, 0.004, 0.032);
  vel = vel * 0.90 + acc * dt;
  pos += vel * dt * 3.0;

  outPos = vec4(pos, seed);
  outVel = vec4(vel, length(vel));
}`;

/* -------------------------------------------------------------------------- */

export const DRAW_VERT = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uPos;
uniform sampler2D uVel;
uniform vec2  uTexSize;
uniform float uAspect;
uniform float uYaw;
uniform float uPitch;
uniform float uCamZ;
uniform float uFocal;
uniform float uSize;
uniform float uDpr;

out float vDepth;
out float vSpeed;
out float vSeed;

void main() {
  int id = gl_VertexID;
  int w = int(uTexSize.x);
  ivec2 px = ivec2(id % w, id / w);

  vec4 P = texelFetch(uPos, px, 0);
  vec3 p = P.xyz;
  vSeed = P.w;
  vSpeed = texelFetch(uVel, px, 0).w;

  // yaw then pitch — a hand-rolled turntable camera, no matrices needed
  float cy = cos(uYaw), sy = sin(uYaw);
  p.xz = mat2(cy, -sy, sy, cy) * p.xz;

  float cp = cos(uPitch), sp = sin(uPitch);
  p.yz = mat2(cp, -sp, sp, cp) * p.yz;

  float z = p.z + uCamZ;
  float persp = uFocal / max(0.25, z);

  vDepth = clamp((z - 1.2) / 5.0, 0.0, 1.0);

  gl_Position = vec4(p.xy * persp / vec2(uAspect, 1.0), 0.0, 1.0);
  gl_PointSize = clamp(uSize * persp, 1.0, 9.0) * uDpr;
}`;

export const DRAW_FRAG = /* glsl */ `#version 300 es
precision highp float;

in float vDepth;
in float vSpeed;
in float vSeed;

uniform float uAlpha;

out vec4 fragColor;

void main() {
  // Soft round sprite.
  vec2 d = gl_PointCoord - 0.5;
  float r = dot(d, d);
  if (r > 0.25) discard;
  float a = smoothstep(0.25, 0.02, r);

  // Near particles read cyan, far ones sink into violet; fast ones flare
  // toward white so motion is visible without motion blur.
  vec3 near = vec3(0.22, 0.90, 1.00);
  vec3 far  = vec3(0.42, 0.30, 1.00);
  vec3 col = mix(near, far, vDepth);

  float flare = clamp(vSpeed * 2.4, 0.0, 1.0);
  col = mix(col, vec3(1.0, 0.92, 1.0), flare * 0.55);

  // Depth fade plus a little per-particle variance.
  float fade = (1.0 - vDepth * 0.82) * (0.55 + 0.45 * vSeed);

  fragColor = vec4(col, a * fade * uAlpha);
}`;
