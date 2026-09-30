/* ==========================================================================
   env.js — one place to ask what this machine can do
   ========================================================================== */

const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const mqCoarse = window.matchMedia('(pointer: coarse)');
const mqHover  = window.matchMedia('(hover: hover)');

/* ---- Motion preference --------------------------------------------------
   The OS setting is the default, but a visitor can override it for this site
   from the footer toggle (or with ?motion=full / ?motion=reduced). Useful for
   anyone who keeps reduce-motion on globally but wants to see this particular
   page move — and for testing both paths on one machine.
   ------------------------------------------------------------------------ */
const STORE_KEY = 'noetic:motion';

function readOverride() {
  try {
    const q = new URLSearchParams(location.search).get('motion');
    if (q === 'full' || q === 'reduced' || q === 'auto') {
      if (q === 'auto') localStorage.removeItem(STORE_KEY);
      else localStorage.setItem(STORE_KEY, q);
      return q === 'auto' ? null : q;
    }
    return localStorage.getItem(STORE_KEY);
  } catch {
    return null;
  }
}

let override = readOverride();

export function motionPreference() {
  return override ?? 'auto';
}

export function setMotionPreference(value) {
  try {
    if (value === 'auto') localStorage.removeItem(STORE_KEY);
    else localStorage.setItem(STORE_KEY, value);
  } catch { /* private mode — the choice simply will not persist */ }
  override = value === 'auto' ? null : value;
}

export const env = {
  get reduced() {
    if (override === 'full') return false;
    if (override === 'reduced') return true;
    return mqReduce.matches;
  },
  get coarse()  { return mqCoarse.matches; },
  get hover()   { return mqHover.matches; },
  get small()   { return window.innerWidth < 768; },
  dpr: Math.min(window.devicePixelRatio || 1, 2),

  /** Very rough capability guess used to pick the initial particle tier. */
  get lowPower() {
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4;
    return cores <= 4 || mem <= 4 || mqCoarse.matches;
  },
};

/** Re-read DPR on zoom / monitor change. */
window.addEventListener('resize', () => {
  env.dpr = Math.min(window.devicePixelRatio || 1, 2);
}, { passive: true });

/** Fire a callback when the reduced-motion preference flips mid-session. */
export function onReducedChange(fn) {
  mqReduce.addEventListener('change', () => fn(mqReduce.matches));
}

/** True when WebGL2 is actually usable, not merely present. */
export function hasWebGL2() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
    if (!gl) return false;
    // Float render targets are required by the particle simulation.
    const ok = !!gl.getExtension('EXT_color_buffer_float');
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return ok;
  } catch {
    return false;
  }
}
