/* ==========================================================================
   split.js — text splitting for line / word / character reveals

   Lines are measured, not guessed: words are wrapped, their offsetTop is read,
   and words sharing a top become one .line. That means a re-flow (resize, font
   swap) re-splits correctly instead of leaving mid-sentence masks.
   ========================================================================== */

const originals = new WeakMap();

const escapeHTML = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function remember(el) {
  if (!originals.has(el)) originals.set(el, el.innerHTML);
  return originals.get(el);
}

/** Split into words, honouring explicit <br> as hard breaks. */
function toWordMarkup(html) {
  return html
    .split(/<br\s*\/?>/i)
    .map((seg) =>
      seg
        .replace(/<[^>]+>/g, '')          // display headings are plain text
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => `<span class="w">${escapeHTML(w)}</span>`)
        .join(' ')
    )
    .join('<br data-break>');
}

/* -------------------------------------------------------------------------- */

export function splitLines(el) {
  const html = remember(el);
  el.innerHTML = toWordMarkup(html);

  const nodes = [...el.childNodes];
  const words = [...el.querySelectorAll('.w')];
  if (!words.length) return;

  // Group words by rendered line, breaking hard at <br>.
  const groups = [];
  let current = null;
  let lastTop = null;

  for (const node of nodes) {
    if (node.nodeType === 1 && node.tagName === 'BR') {
      current = null;
      lastTop = null;
      continue;
    }
    if (node.nodeType !== 1 || !node.classList.contains('w')) continue;

    const top = Math.round(node.offsetTop);
    if (current === null || top !== lastTop) {
      current = [];
      groups.push(current);
      lastTop = top;
    }
    current.push(node.textContent);
  }

  el.innerHTML = groups
    .map(
      (words_, i) =>
        `<span class="line" style="--i:${i}"><span class="line__inner">${escapeHTML(
          words_.join(' ')
        )}</span></span>`
    )
    .join('');

  el.dataset.split = 'lines';
}

export function splitWords(el) {
  const html = remember(el);
  const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean);
  el.innerHTML = words
    .map((w, i) => `<span class="word" style="--i:${i}">${escapeHTML(w)}</span>`)
    .join(' ');
  el.dataset.split = 'words';
}

export function splitChars(el) {
  const html = remember(el);
  const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean);
  let n = 0;
  el.innerHTML = words
    .map((w) => {
      const chars = [...w]
        .map((c) => `<span class="char" style="--i:${n++}">${escapeHTML(c)}</span>`)
        .join('');
      return `<span class="word">${chars}</span>`;
    })
    .join(' ');
  el.dataset.split = 'chars';
}

/* -------------------------------------------------------------------------- */

function apply(el) {
  const mode = el.getAttribute('data-split');
  if (mode === 'lines') splitLines(el);
  else if (mode === 'words') splitWords(el);
  else if (mode === 'chars') splitChars(el);
}

/**
 * Split every [data-split] element and keep line splits correct across
 * re-flows. Word/char splits are layout-independent and never redone.
 */
export function initSplit(root = document) {
  const els = [...root.querySelectorAll('[data-split]')];
  if (!els.length) return;

  els.forEach(apply);

  const lineEls = els.filter((el) => el.getAttribute('data-split') === 'lines');
  if (!lineEls.length) return;

  let lastW = window.innerWidth;
  let t;
  window.addEventListener(
    'resize',
    () => {
      if (window.innerWidth === lastW) return; // ignore mobile URL-bar height changes
      lastW = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(() => lineEls.forEach(splitLines), 180);
    },
    { passive: true }
  );

  // Web fonts can land after first paint and change line breaks.
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => lineEls.forEach(splitLines));
  }
}
