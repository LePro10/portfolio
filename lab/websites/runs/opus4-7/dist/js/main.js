/* ============================================
   NEXUS AI — Main JS (Cursor, Nav, Reveal, Misc)
   ============================================ */

// ---------- LOADER ----------
(function() {
  const loader = document.querySelector('.loader');
  if (!loader) return;
  const fill = loader.querySelector('.loader-bar-fill');
  const pct = loader.querySelector('.loader-percent');
  let p = 0;
  const tick = () => {
    p += Math.random() * 18 + 6;
    if (p >= 100) p = 100;
    if (fill) fill.style.width = p + '%';
    if (pct) pct.textContent = String(Math.floor(p)).padStart(3, '0');
    if (p < 100) {
      setTimeout(tick, 80 + Math.random() * 120);
    } else {
      setTimeout(() => {
        loader.classList.add('done');
        document.body.classList.add('loaded');
        window.dispatchEvent(new CustomEvent('nexus:loaded'));
      }, 250);
    }
  };
  // start once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tick);
  } else { tick(); }
})();

// ---------- CUSTOM CURSOR ----------
(function() {
  if (window.matchMedia('(max-width: 768px)').matches) return;
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  const trail = document.createElement('div');
  trail.className = 'cursor-trail';
  document.body.appendChild(cursor);
  document.body.appendChild(trail);

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let tx = mx, ty = my;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
  });

  const loop = () => {
    tx += (mx - tx) * 0.15;
    ty += (my - ty) * 0.15;
    trail.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  };
  loop();

  // Hover targets
  const hoverables = 'a, button, .card, .magnetic, .lab-input button, .nav-cta, .cap-card, .color-swatch, input, textarea';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest && e.target.closest(hoverables)) cursor.classList.add('hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest && e.target.closest(hoverables)) cursor.classList.remove('hover');
  });
})();

// ---------- NAV behaviour ----------
(function() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 80 && y > lastY) nav.classList.add('hidden');
    else nav.classList.remove('hidden');
    lastY = y;
  }, { passive: true });

  const toggle = nav.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }

  // Active link
  const path = location.pathname.split('/').pop() || 'index.html';
  nav.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });
})();

// ---------- REVEAL ON SCROLL ----------
(function() {
  const els = document.querySelectorAll('.reveal, .reveal-stagger');
  if (!els.length || !('IntersectionObserver' in window)) {
    els.forEach(e => e.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
  els.forEach(el => io.observe(el));
})();

// ---------- MAGNETIC BUTTONS ----------
(function() {
  const els = document.querySelectorAll('.magnetic');
  els.forEach(el => {
    const strength = parseFloat(el.dataset.magnet || 0.3);
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * strength;
      const y = (e.clientY - r.top - r.height / 2) * strength;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
})();

// ---------- TEXT SCRAMBLE ----------
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.update = this.update.bind(this);
  }
  setText(newText) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise(r => (this.resolve = r));
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let output = '';
    let complete = 0;
    for (let i = 0; i < this.queue.length; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.chars[Math.floor(Math.random() * this.chars.length)];
          this.queue[i].char = char;
        }
        output += `<span style="color:var(--cyan);opacity:.7">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) this.resolve();
    else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
}

// ---------- SCRAMBLE ON LOAD ----------
window.addEventListener('nexus:loaded', () => {
  document.querySelectorAll('[data-scramble]').forEach(el => {
    const phrases = el.dataset.scramble.split('|');
    const tx = new TextScramble(el);
    let i = 0;
    const next = () => {
      tx.setText(phrases[i]).then(() => {
        setTimeout(next, 2400);
      });
      i = (i + 1) % phrases.length;
    };
    next();
  });
});

// ---------- COUNTER ANIMATION ----------
(function() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const target = parseFloat(el.dataset.count);
      const decimals = (String(target).split('.')[1] || '').length;
      const suffix = el.dataset.suffix || '';
      const dur = 1800;
      const start = performance.now();
      const tick = (t) => {
        const p = Math.min((t - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        el.textContent = (decimals ? val.toFixed(decimals) : Math.floor(val).toLocaleString()) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => io.observe(c));
})();

// ---------- SPOTLIGHT GRID ----------
(function() {
  document.querySelectorAll('.spotlight-grid').forEach(grid => {
    grid.addEventListener('mousemove', (e) => {
      const r = grid.getBoundingClientRect();
      grid.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      grid.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
})();

// ---------- TILT CARDS ----------
(function() {
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (py - 0.5) * -8;
      const ry = (px - 0.5) * 10;
      card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    });
  });
})();

// ---------- KONAMI CODE — Matrix easter egg ----------
(function() {
  const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let pos = 0;
  window.addEventListener('keydown', (e) => {
    const key = e.key;
    if (key.toLowerCase() === seq[pos].toLowerCase()) {
      pos++;
      if (pos === seq.length) {
        triggerMatrix();
        pos = 0;
      }
    } else { pos = 0; }
  });

  function triggerMatrix() {
    let overlay = document.querySelector('.matrix-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'matrix-overlay';
      const canvas = document.createElement('canvas');
      overlay.appendChild(canvas);
      const close = document.createElement('button');
      close.className = 'matrix-close';
      close.textContent = '× ESCAPE';
      overlay.appendChild(close);
      document.body.appendChild(overlay);
      close.addEventListener('click', () => overlay.classList.remove('active'));
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') overlay.classList.remove('active');
      });
      runMatrix(canvas, overlay);
    }
    overlay.classList.add('active');
  }

  function runMatrix(canvas, overlay) {
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const chars = '01ABCDEFNEXUSAI∆◊◆◇○●'.split('');
    const fontSize = 16;
    const cols = Math.floor(canvas.width / fontSize);
    const drops = Array(cols).fill(1);
    const draw = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00f0ff';
      ctx.font = fontSize + "px 'JetBrains Mono', monospace";
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      if (overlay.classList.contains('active')) requestAnimationFrame(draw);
    };
    draw();
  }
})();

// ---------- SMOOTH SCROLL (Lenis fallback to native) ----------
window.addEventListener('load', () => {
  if (window.Lenis) {
    const lenis = new window.Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    window.__lenis = lenis;
  }
});

// ---------- ANCHOR SMOOTH SCROLL ----------
document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  const t = document.querySelector(id);
  if (t) {
    e.preventDefault();
    t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// ---------- EXPORT ----------
window.NEXUS = { TextScramble };
