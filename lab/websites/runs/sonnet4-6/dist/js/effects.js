/* ============================================================
   effects.js — Text scramble, stat counters, starfield, grid
   ============================================================ */

/* ─────────────────────────────────────────────────────────
   Text scramble
──────────────────────────────────────────────────────────── */
class TextScramble {
  constructor (el) {
    this.el   = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ01';
    this.frameId = null;
  }

  scramble (text, duration = 1400) {
    const len     = text.length;
    const start   = performance.now();
    const revealed = new Array(len).fill(false);

    const tick = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);

      // reveal chars left to right staggered
      const revealIdx = Math.floor(progress * len * 1.5);
      for (let i = 0; i < Math.min(revealIdx, len); i++) revealed[i] = true;

      let output = '';
      for (let i = 0; i < len; i++) {
        if (revealed[i]) {
          output += `<span style="color:var(--white)">${text[i]}</span>`;
        } else {
          const c = this.chars[Math.floor(Math.random() * this.chars.length)];
          output += `<span style="color:var(--cyan);opacity:0.5">${c}</span>`;
        }
      }
      this.el.innerHTML = output;

      if (progress < 1) this.frameId = requestAnimationFrame(tick);
      else              this.el.textContent = text;
    };

    cancelAnimationFrame(this.frameId);
    this.frameId = requestAnimationFrame(tick);
  }
}

/* ─────────────────────────────────────────────────────────
   Stat counters
──────────────────────────────────────────────────────────── */
function initCounters () {
  const formatNum = (n, target) => {
    if (target >= 1_000_000_000_000) return (n / 1_000_000_000_000).toFixed(1) + 'T';
    if (target >= 1_000_000_000)     return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1000)                   return Math.round(n).toLocaleString();
    return Math.round(n).toString();
  };

  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseFloat(el.dataset.target);

    ScrollTrigger.create({
      trigger: el,
      start:   'top 85%',
      once:    true,
      onEnter: () => {
        gsap.fromTo({ val: 0 }, { val: target }, {
          duration: 2.2,
          ease:     'power2.out',
          onUpdate () {
            el.textContent = formatNum(this.targets()[0].val, target);
          },
          onComplete () {
            el.textContent = formatNum(target, target);
          }
        });
      }
    });
  });
}

/* ─────────────────────────────────────────────────────────
   Animated dot grid for Numbers section
──────────────────────────────────────────────────────────── */
function initGridCanvas () {
  const canvas = document.getElementById('grid-canvas');
  if (!canvas) return;

  const ctx   = canvas.getContext('2d');
  let animId  = null;
  let W, H, dots;

  const resize = () => {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    buildDots();
  };

  const buildDots = () => {
    const spacing = 40;
    dots = [];
    for (let x = spacing / 2; x < W; x += spacing) {
      for (let y = spacing / 2; y < H; y += spacing) {
        dots.push({ x, y, baseX: x, baseY: y, phase: Math.random() * Math.PI * 2 });
      }
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const t = Date.now() * 0.001;
    dots.forEach(d => {
      const wave  = Math.sin(d.phase + t * 0.8 + d.baseX * 0.02) * 0.5 + 0.5;
      const alpha = 0.08 + wave * 0.4;
      const r     = 1 + wave * 1.5;
      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,245,255,${alpha})`;
      ctx.fill();
    });
    animId = requestAnimationFrame(draw);
  };

  resize();
  draw();
  window.addEventListener('resize', resize);
}

/* ─────────────────────────────────────────────────────────
   Starfield for Future section
──────────────────────────────────────────────────────────── */
function initStarfield () {
  const canvas = document.getElementById('star-canvas');
  if (!canvas) return;

  const ctx    = canvas.getContext('2d');
  let W, H, stars, nebulae;

  const resize = () => {
    W = canvas.width  = canvas.offsetWidth  || window.innerWidth;
    H = canvas.height = canvas.offsetHeight || window.innerHeight;
    buildStars();
  };

  const buildStars = () => {
    stars = Array.from({ length: 220 }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 1.8,
      alpha: 0.2 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 1.2
    }));
    nebulae = Array.from({ length: 5 }, () => ({
      x:    Math.random() * W,
      y:    Math.random() * H,
      r:    80 + Math.random() * 120,
      hue:  [270, 200, 320, 230, 280][Math.floor(Math.random() * 5)]
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const t = Date.now() * 0.001;

    /* nebulae */
    nebulae.forEach(n => {
      const gr = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      gr.addColorStop(0, `hsla(${n.hue},80%,40%,0.08)`);
      gr.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = gr;
      ctx.fill();
    });

    /* stars */
    stars.forEach(s => {
      s.y -= s.speed * 0.15;
      if (s.y < -2) { s.y = H + 2; s.x = Math.random() * W; }

      const twinkle = 0.3 + (Math.sin(s.phase + t * 1.5) * 0.5 + 0.5) * 0.7;

      ctx.save();
      ctx.shadowBlur  = s.r > 1.2 ? 8 : 0;
      ctx.shadowColor = 'rgba(180,220,255,0.8)';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,230,255,${s.alpha * twinkle})`;
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(draw);
  };

  resize();
  draw();
  window.addEventListener('resize', resize);
}

/* ─────────────────────────────────────────────────────────
   Noise texture via canvas (more authentic grain)
──────────────────────────────────────────────────────────── */
function initNoise () {
  const noiseEl = document.querySelector('.noise');
  if (!noiseEl) return;

  const size = 256;
  const c    = document.createElement('canvas');
  c.width    = size;
  c.height   = size;
  const nctx = c.getContext('2d');
  const img  = nctx.createImageData(size, size);

  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i]     = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = Math.floor(Math.random() * 30);
  }
  nctx.putImageData(img, 0, 0);
  noiseEl.style.backgroundImage = `url(${c.toDataURL()})`;
}

/* ─────────────────────────────────────────────────────────
   Main init entry
──────────────────────────────────────────────────────────── */
function initEffects () {
  initNoise();
  initCounters();
  initGridCanvas();

  /* scramble the hero title on load */
  const titleEl = document.querySelector('.hero-title .glitch');
  if (titleEl) {
    const originalText = titleEl.dataset.text || 'NEURAL';
    // brief pause before scramble so hero animates in first
    setTimeout(() => {
      const sc = new TextScramble(titleEl);
      sc.scramble(originalText, 1200);
    }, 1000);
  }

  /* Numbers heading scramble on enter (plain text element, safe to target) */
  const numTitle = document.querySelector('.numbers-title');
  if (numTitle) {
    // save original HTML with highlight span before scrambling
    const origHTML = numTitle.innerHTML;
    // only scramble the plain-text portion, then restore full HTML
    ScrollTrigger.create({
      trigger: numTitle,
      start:   'top 80%',
      once:    true,
      onEnter: () => {
        /* flash the title briefly then restore */
        gsap.fromTo(numTitle, { opacity: 0 }, {
          opacity: 1, duration: 0.6, ease: 'power2.out',
          onStart () { numTitle.innerHTML = origHTML; }
        });
      }
    });
  }
}
