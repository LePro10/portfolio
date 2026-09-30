/* ============================================
   NEXUS AI — Neural particle network canvas
   ============================================ */

(function() {
  const canvas = document.querySelector('.hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0;
  const mouse = { x: -9999, y: -9999, active: false };

  const PARTICLE_COUNT = Math.min(120, Math.floor(window.innerWidth / 14));
  const LINK_DIST = 140;
  const MOUSE_DIST = 200;
  const particles = [];

  class P {
    constructor() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = (Math.random() - 0.5) * 0.35;
      this.r = Math.random() * 1.5 + 0.6;
      this.hue = Math.random() < 0.5 ? 188 : 280; // cyan / purple
    }
    step() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > w) this.vx *= -1;
      if (this.y < 0 || this.y > h) this.vy *= -1;
      // mouse attraction
      if (mouse.active) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const d = Math.hypot(dx, dy);
        if (d < MOUSE_DIST) {
          const f = (1 - d / MOUSE_DIST) * 0.04;
          this.vx += dx / d * f;
          this.vy += dy / d * f;
        }
      }
      // damping
      this.vx *= 0.985;
      this.vy *= 0.985;
      // gentle drift
      this.vx += (Math.random() - 0.5) * 0.01;
      this.vy += (Math.random() - 0.5) * 0.01;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 100%, 70%, 0.9)`;
      ctx.fill();
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function init() {
    resize();
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new P());
  }

  function linkParticles() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < LINK_DIST) {
          const alpha = (1 - d / LINK_DIST) * 0.22;
          ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      // mouse links
      if (mouse.active) {
        const dx = particles[i].x - mouse.x;
        const dy = particles[i].y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < MOUSE_DIST) {
          const alpha = (1 - d / MOUSE_DIST) * 0.6;
          ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }
  }

  let running = true;
  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) { p.step(); p.draw(); }
    linkParticles();
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    resize();
  });
  window.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    mouse.active = mouse.x > 0 && mouse.x < w && mouse.y > 0 && mouse.y < h;
  });
  window.addEventListener('mouseleave', () => { mouse.active = false; });

  // Pause when offscreen
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      running = e.isIntersecting;
      if (running) frame();
    });
  });
  io.observe(canvas);

  init();
  frame();
})();
