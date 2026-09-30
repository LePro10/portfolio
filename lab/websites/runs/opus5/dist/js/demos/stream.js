/* ==========================================================================
   demos/stream.js — simulated token-by-token decoding

   Three scripted answers, each stored as a sequence of steps with candidate
   distributions. Temperature reshapes the distribution and can make the sampler
   pick a runner-up, which is the whole point of the control.
   ========================================================================== */

import { onTick, clamp } from '../core/raf.js';
import { env } from '../core/env.js';

/** [chosenText, [[candidate, probability], ...]] */
const SCRIPTS = [
  [
    ['Interpretability ', [['Interpretability', 0.58], ['Explaining', 0.16], ['Understanding', 0.12], ['Reading', 0.08], ['Opening', 0.06]]],
    ['is ', [['is', 0.71], ['means', 0.13], ['starts', 0.07], ['begins', 0.05], ['remains', 0.04]]],
    ['the ', [['the', 0.62], ['a', 0.21], ['our', 0.08], ['one', 0.05], ['any', 0.04]]],
    ['claim ', [['claim', 0.44], ['idea', 0.24], ['bet', 0.15], ['belief', 0.10], ['hope', 0.07]]],
    ['that ', [['that', 0.83], ['which', 0.07], ['a', 0.04], ['we', 0.04], ['this', 0.02]]],
    ['a ', [['a', 0.66], ['the', 0.18], ['any', 0.08], ['no', 0.05], ['one', 0.03]]],
    ['system ', [['system', 0.39], ['model', 0.36], ['network', 0.12], ['program', 0.08], ['machine', 0.05]]],
    ['you ', [['you', 0.57], ['we', 0.22], ['one', 0.11], ['nobody', 0.06], ['they', 0.04]]],
    ['cannot ', [['cannot', 0.61], ['can’t', 0.19], ['may', 0.09], ['will', 0.06], ['could', 0.05]]],
    ['inspect ', [['inspect', 0.68], ['examine', 0.14], ['audit', 0.10], ['open', 0.05], ['read', 0.03]]],
    ['is ', [['is', 0.79], ['stays', 0.08], ['remains', 0.07], ['becomes', 0.04], ['was', 0.02]]],
    ['a ', [['a', 0.74], ['just', 0.12], ['still', 0.07], ['merely', 0.05], ['only', 0.02]]],
    ['rumour.', [['rumour', 0.52], ['guess', 0.21], ['story', 0.13], ['promise', 0.09], ['gamble', 0.05]]],
  ],
  [
    ['We ', [['We', 0.64], ['NOETIC', 0.15], ['Publishing', 0.10], ['Open', 0.07], ['The', 0.04]]],
    ['publish ', [['publish', 0.66], ['release', 0.17], ['share', 0.09], ['ship', 0.05], ['give', 0.03]]],
    ['weights ', [['weights', 0.72], ['models', 0.13], ['code', 0.08], ['them', 0.04], ['results', 0.03]]],
    ['because ', [['because', 0.59], ['since', 0.20], ['as', 0.10], ['so', 0.07], ['when', 0.04]]],
    ['an ', [['an', 0.57], ['a', 0.24], ['the', 0.11], ['any', 0.05], ['no', 0.03]]],
    ['explanation ', [['explanation', 0.74], ['account', 0.10], ['argument', 0.08], ['answer', 0.05], ['excuse', 0.03]]],
    ['nobody ', [['nobody', 0.51], ['no', 0.22], ['none', 0.13], ['few', 0.08], ['someone', 0.06]]],
    ['can ', [['can', 0.69], ['could', 0.14], ['will', 0.09], ['may', 0.05], ['might', 0.03]]],
    ['reproduce ', [['reproduce', 0.77], ['verify', 0.11], ['repeat', 0.06], ['check', 0.04], ['test', 0.02]]],
    ['is ', [['is', 0.81], ['stays', 0.07], ['becomes', 0.06], ['was', 0.04], ['remains', 0.02]]],
    ['a ', [['a', 0.78], ['just', 0.11], ['only', 0.06], ['merely', 0.03], ['still', 0.02]]],
    ['press ', [['press', 0.63], ['marketing', 0.19], ['sales', 0.09], ['blog', 0.06], ['launch', 0.03]]],
    ['release.', [['release', 0.88], ['statement', 0.06], ['note', 0.03], ['post', 0.02], ['piece', 0.01]]],
  ],
  [
    ['An ', [['An', 0.61], ['A', 0.19], ['Each', 0.10], ['Every', 0.06], ['The', 0.04]]],
    ['attention ', [['attention', 0.86], ['attn', 0.06], ['self', 0.04], ['cross', 0.03], ['multi', 0.01]]],
    ['head ', [['head', 0.91], ['layer', 0.04], ['block', 0.03], ['unit', 0.01], ['module', 0.01]]],
    ['is ', [['is', 0.75], ['works', 0.10], ['acts', 0.07], ['behaves', 0.05], ['stays', 0.03]]],
    ['a ', [['a', 0.71], ['one', 0.12], ['just', 0.09], ['simply', 0.05], ['merely', 0.03]]],
    ['weighted ', [['weighted', 0.58], ['soft', 0.19], ['learned', 0.12], ['content', 0.07], ['sparse', 0.04]]],
    ['lookup: ', [['lookup', 0.64], ['average', 0.18], ['sum', 0.10], ['mixture', 0.05], ['blend', 0.03]]],
    ['ask ', [['ask', 0.47], ['query', 0.28], ['read', 0.12], ['search', 0.08], ['scan', 0.05]]],
    ['everywhere, ', [['everywhere', 0.55], ['everyone', 0.22], ['broadly', 0.11], ['around', 0.07], ['back', 0.05]]],
    ['keep ', [['keep', 0.59], ['take', 0.21], ['pull', 0.11], ['hold', 0.06], ['use', 0.03]]],
    ['what ', [['what', 0.72], ['whatever', 0.13], ['the', 0.08], ['anything', 0.04], ['that', 0.03]]],
    ['answers.', [['answers', 0.49], ['matters', 0.27], ['helps', 0.13], ['fits', 0.07], ['agrees', 0.04]]],
  ],
];

const BASE_DELAY = 130;

export function initStream() {
  const runBtn = document.getElementById('str-run');
  const out = document.getElementById('str-out');
  const cands = document.getElementById('str-cands');
  const meta = document.getElementById('str-meta');
  const promptSel = document.getElementById('str-prompt');
  const tempInput = document.getElementById('str-temp');
  const tempVal = document.getElementById('str-temp-val');
  if (!runBtn || !out || !cands) return;

  const rows = [...cands.children];
  let temp = 0.7;
  let running = false;
  let stopTick = null;

  tempInput?.addEventListener('input', () => {
    temp = tempInput.value / 100;
    if (tempVal) tempVal.textContent = temp.toFixed(2);
  });

  /** Re-weight by 1/T and renormalise — the actual temperature operation. */
  function reweight(list) {
    const t = Math.max(0.05, temp);
    const scaled = list.map(([label, p]) => [label, Math.pow(p, 1 / t)]);
    const sum = scaled.reduce((a, [, p]) => a + p, 0);
    return scaled.map(([label, p]) => [label, p / sum]);
  }

  function sample(list) {
    if (temp < 0.06) return list[0];
    let r = Math.random();
    for (const entry of list) {
      r -= entry[1];
      if (r <= 0) return entry;
    }
    return list[0];
  }

  function paintCandidates(list, chosen) {
    rows.forEach((row, i) => {
      const [label, p] = list[i] || ['—', 0];
      row.querySelector('span').textContent = label;
      row.querySelector('i').style.setProperty('--p', (p * 100).toFixed(1));
      row.querySelector('b').textContent = `${(p * 100).toFixed(0)}%`;
      row.style.opacity = label === chosen ? '1' : '0.62';
    });
  }

  function run() {
    if (running) return;
    running = true;
    stopTick?.();

    const script = SCRIPTS[Number(promptSel?.value || 0)] || SCRIPTS[0];
    out.innerHTML = '';
    runBtn.disabled = true;
    runBtn.textContent = 'Decoding';

    let i = 0;
    let next = 0;
    const t0 = performance.now();

    stopTick = onTick((_dt, now) => {
      if (now < next) return;

      if (i >= script.length) {
        stopTick();
        stopTick = null;
        running = false;
        runBtn.disabled = false;
        runBtn.textContent = 'Run';
        const secs = (now - t0) / 1000;
        if (meta) {
          meta.textContent =
            `${script.length} tokens · ${secs.toFixed(1)}s · ${(script.length / secs).toFixed(1)} tok/s · T=${temp.toFixed(2)}`;
        }
        return;
      }

      const [text, rawCands] = script[i];
      const list = reweight(rawCands);
      const picked = temp < 0.06 ? list[0] : sample(list);

      // At low temperature the scripted token wins; at high temperature the
      // sampler can wander, and the visible text wanders with it.
      const useScripted = picked[0] === rawCands[0][0];
      const word = useScripted ? text : `${picked[0]}${text.endsWith(' ') ? ' ' : text.slice(-1) === '.' ? '. ' : ' '}`;

      const span = document.createElement('span');
      span.className = 'tok';
      span.textContent = word;
      out.appendChild(span);

      paintCandidates(list, picked[0]);
      if (meta) meta.textContent = `step ${i + 1}/${script.length} · T=${temp.toFixed(2)}`;

      // Higher temperature reads as more hesitant.
      const jitter = env.reduced ? 0 : Math.random() * 60 * clamp(temp);
      next = now + BASE_DELAY + jitter;
      i++;
    });
  }

  runBtn.addEventListener('click', run);
  promptSel?.addEventListener('change', () => {
    out.innerHTML = '<span class="stream__placeholder">Press <b>Run</b> to decode.</span>';
    if (meta) meta.textContent = 'idle';
  });
}
