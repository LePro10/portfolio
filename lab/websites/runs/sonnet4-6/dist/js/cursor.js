/* ============================================================
   cursor.js — Custom glow cursor + magnetic button effect
   ============================================================ */

class Cursor {
  constructor () {
    this.dot      = document.getElementById('cursor');
    this.ring     = document.getElementById('cursor-follower');
    this.mouse    = { x: -200, y: -200 };
    this.pos      = { x: -200, y: -200 };
    this.speed    = 0.12;
    this.frameId  = null;

    if (!this.dot || !this.ring) return;

    this._bind();
    this._loop();
    this._magneticSetup();
  }

  _bind () {
    document.addEventListener('mousemove', e => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    // hover state on interactive elements
    const targets = 'a, button, .cap-card, .tl-card, .stat-card, .ctrl-btn, .magnetic-btn, #neural-canvas';
    document.querySelectorAll(targets).forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    // hide when leaving window
    document.addEventListener('mouseleave', () => {
      gsap.to([this.dot, this.ring], { opacity: 0, duration: 0.3 });
    });
    document.addEventListener('mouseenter', () => {
      gsap.to([this.dot, this.ring], { opacity: 1, duration: 0.3 });
    });
  }

  _loop () {
    // dot: instant
    this.dot.style.left = this.mouse.x + 'px';
    this.dot.style.top  = this.mouse.y + 'px';

    // follower: lerp
    this.pos.x += (this.mouse.x - this.pos.x) * this.speed;
    this.pos.y += (this.mouse.y - this.pos.y) * this.speed;

    this.ring.style.left = this.pos.x + 'px';
    this.ring.style.top  = this.pos.y + 'px';

    this.frameId = requestAnimationFrame(() => this._loop());
  }

  _magneticSetup () {
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect   = btn.getBoundingClientRect();
        const cx     = rect.left + rect.width  / 2;
        const cy     = rect.top  + rect.height / 2;
        const dx     = e.clientX - cx;
        const dy     = e.clientY - cy;
        const factor = 0.35;

        gsap.to(btn, {
          x: dx * factor,
          y: dy * factor,
          duration: 0.4,
          ease: 'power2.out'
        });
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: 'elastic.out(1, 0.5)'
        });
      });
    });
  }
}
