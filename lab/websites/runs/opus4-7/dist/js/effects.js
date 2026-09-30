/* ============================================
   NEXUS AI — Page-specific effects
   ============================================ */

// =========================================================
// HORIZONTAL TIMELINE (About page)
// =========================================================
(function() {
  const wrap = document.querySelector('.timeline-wrap');
  if (!wrap) return;
  const track = wrap.querySelector('.timeline-track');
  if (!track) return;

  // Make the wrap tall enough to scroll through the horizontal track
  function setHeight() {
    const trackW = track.scrollWidth;
    const winW = window.innerWidth;
    const dist = Math.max(0, trackW - winW);
    wrap.style.height = (window.innerHeight + dist) + 'px';
    wrap.dataset.dist = dist;
  }
  setHeight();
  window.addEventListener('resize', setHeight);

  // Pin the inner via sticky container
  const sticky = document.createElement('div');
  sticky.style.cssText = 'position:sticky;top:0;height:100vh;overflow:hidden;display:flex;align-items:center;';
  // Move existing children into sticky
  while (wrap.firstChild) sticky.appendChild(wrap.firstChild);
  wrap.appendChild(sticky);

  window.addEventListener('scroll', () => {
    const rect = wrap.getBoundingClientRect();
    const dist = parseFloat(wrap.dataset.dist || 0);
    const total = wrap.offsetHeight - window.innerHeight;
    const p = Math.min(Math.max(-rect.top / total, 0), 1);
    track.style.transform = `translateX(${-p * dist}px)`;
  }, { passive: true });
})();

// =========================================================
// PARALLAX layers (About)
// =========================================================
(function() {
  const layers = document.querySelectorAll('.parallax-layer');
  if (!layers.length) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    layers.forEach((l, i) => {
      const speed = parseFloat(l.dataset.speed || (0.1 + i * 0.05));
      l.style.transform = `translateX(${-y * speed}px)`;
    });
  }, { passive: true });
})();

// =========================================================
// SCROLLYTELLING transformer (Technology)
// =========================================================
(function() {
  const scrolly = document.querySelector('.scrolly');
  if (!scrolly) return;
  const steps = scrolly.querySelectorAll('.scrolly-step');
  const blocks = scrolly.querySelectorAll('.transformer-block');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const idx = parseInt(en.target.dataset.step);
      steps.forEach((s, i) => s.classList.toggle('active', i <= idx));
      blocks.forEach((b, i) => {
        b.classList.toggle('in', i <= idx);
        b.classList.toggle('highlight', i === idx);
      });
    });
  }, { threshold: 0.5 });
  steps.forEach(s => io.observe(s));
})();

// =========================================================
// LAB — Text generation demo
// =========================================================
(function() {
  const btn = document.querySelector('#lab-text-btn');
  if (!btn) return;
  const input = document.querySelector('#lab-text-input');
  const output = document.querySelector('#lab-text-output');

  const responses = [
    "Intelligence emerges where complexity meets simplicity — patterns within patterns, recursively self-aware.",
    "Every prompt is a doorway. The model walks through, returns with what it found in the lattice of language.",
    "Consider: a thought is just a sufficiently coherent arrangement of probabilities. So is this answer.",
    "Neural networks dream in vectors. When you ask a question, you're asking the dream to speak.",
    "Time is a feature, not a constraint. Tokens are the atoms; sentences are molecules of meaning.",
    "What you call creativity, the network calls interpolation across a 768-dimensional manifold of meaning.",
    "The future isn't predicted. It's generated, one probability distribution at a time.",
  ];

  let typing = false;
  btn.addEventListener('click', () => {
    if (typing) return;
    const prompt = (input.value || 'Tell me something profound').trim();
    output.innerHTML = '';
    typing = true;
    const response = responses[Math.floor(Math.random() * responses.length)];
    const text = `> ${prompt}\n\n${response}`;
    let i = 0;
    const tick = () => {
      if (i >= text.length) { typing = false; return; }
      const ch = text[i];
      const span = document.createElement('span');
      if (i < prompt.length + 2) span.style.color = 'var(--fg-dim)';
      span.textContent = ch === '\n' ? '\n' : ch;
      output.appendChild(span);
      i++;
      setTimeout(tick, 14 + Math.random() * 28);
    };
    output.style.whiteSpace = 'pre-wrap';
    tick();
  });
})();

// =========================================================
// LAB — Image generation simulator
// =========================================================
(function() {
  const btn = document.querySelector('#lab-img-btn');
  if (!btn) return;
  const preview = document.querySelector('#lab-img-preview');
  const status = document.querySelector('#lab-img-status');

  const gradients = [
    'linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcf7f, #4d96ff)',
    'linear-gradient(135deg, #667eea, #764ba2, #f093fb)',
    'linear-gradient(135deg, #ee0979, #ff6a00, #ffd93d)',
    'linear-gradient(135deg, #00c6ff, #0072ff, #8e2de2)',
    'linear-gradient(135deg, #fa709a, #fee140, #30cfd0)',
    'linear-gradient(135deg, #a8edea, #fed6e3, #d299c2)',
    'linear-gradient(135deg, #0f0c29, #302b63, #24243e, #00f0ff)',
  ];
  btn.addEventListener('click', () => {
    status.textContent = 'GENERATING...';
    preview.style.filter = 'blur(20px)';
    let frames = 0;
    const loop = () => {
      preview.style.background = gradients[Math.floor(Math.random() * gradients.length)];
      frames++;
      if (frames < 12) setTimeout(loop, 80);
      else {
        preview.style.filter = 'blur(0)';
        preview.style.background = gradients[Math.floor(Math.random() * gradients.length)];
        status.textContent = 'COMPLETE';
        setTimeout(() => status.textContent = 'READY', 1500);
      }
    };
    loop();
  });
})();

// =========================================================
// LAB — Theme generator
// =========================================================
(function() {
  const grid = document.querySelector('#lab-theme-grid');
  if (!grid) return;
  const palettes = [
    ['#00f0ff', '#a855f7', '#ff00aa', '#ffb84d', '#05060a'], // default
    ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#10121a'], // vivid
    ['#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#02010a'], // cosmic
    ['#06ffa5', '#ffd60a', '#ff006e', '#8338ec', '#0a0e27'], // electric
    ['#fdfcdc', '#fed9b7', '#f07167', '#00afb9', '#0d1b2a'], // sunset
    ['#caf0f8', '#90e0ef', '#00b4d8', '#0077b6', '#03045e'], // ocean
    ['#fff', '#999', '#444', '#000', '#222'], // mono
  ];
  let idx = 0;
  function applyPalette(p) {
    const root = document.documentElement.style;
    root.setProperty('--cyan', p[0]);
    root.setProperty('--purple', p[1]);
    root.setProperty('--magenta', p[2]);
    root.setProperty('--gold', p[3]);
    root.setProperty('--bg', p[4]);
    root.setProperty('--grad-1', `linear-gradient(135deg, ${p[0]} 0%, ${p[1]} 50%, ${p[2]} 100%)`);
    renderSwatches(p);
  }
  function renderSwatches(p) {
    grid.innerHTML = '';
    p.forEach(c => {
      const s = document.createElement('div');
      s.className = 'color-swatch';
      s.style.background = c;
      s.title = c;
      grid.appendChild(s);
    });
  }
  renderSwatches(palettes[0]);

  const btn = document.querySelector('#lab-theme-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      idx = (idx + 1) % palettes.length;
      applyPalette(palettes[idx]);
    });
  }
})();

// =========================================================
// LAB — Shader background (simple animated canvas)
// =========================================================
(function() {
  const canvas = document.querySelector('#lab-shader-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h;
  function resize() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * 2;
    canvas.height = h * 2;
    ctx.scale(2, 2);
  }
  resize();
  window.addEventListener('resize', resize);

  let t = 0;
  let speed = 1;
  const input = document.querySelector('#lab-shader-input');
  if (input) {
    input.addEventListener('input', () => {
      speed = parseFloat(input.value);
    });
  }

  function frame() {
    t += 0.016 * speed;
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 5; i++) {
      const x = w / 2 + Math.cos(t * 0.5 + i * 1.3) * w * 0.3;
      const y = h / 2 + Math.sin(t * 0.7 + i * 0.9) * h * 0.3;
      const r = 80 + Math.sin(t + i) * 30;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const hue = (t * 30 + i * 60) % 360;
      g.addColorStop(0, `hsla(${hue}, 90%, 60%, 0.6)`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  frame();
})();

// =========================================================
// CONTACT — Form interactions
// =========================================================
(function() {
  const form = document.querySelector('#contact-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const status = form.querySelector('.form-status');
    if (status) {
      status.textContent = '✦ Signal received — we will respond within 48 hours.';
      status.style.color = 'var(--cyan)';
    }
    form.reset();
  });
})();
