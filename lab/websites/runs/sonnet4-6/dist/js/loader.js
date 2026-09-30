/* ============================================================
   loader.js — Binary rain loading screen
   ============================================================ */

class Loader {
  constructor () {
    this.canvas   = document.getElementById('binary-rain');
    this.ctx      = this.canvas.getContext('2d');
    this.animId   = null;
    this.done     = false;

    this._resize();
    this._initDrops();
    this._animate();
    this._runProgress();

    window.addEventListener('resize', () => this._resize());
  }

  _resize () {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this._initDrops();
  }

  _initDrops () {
    this.fs      = 14;
    this.cols    = Math.floor(this.canvas.width / this.fs);
    this.drops   = Array.from({ length: this.cols }, () =>
      Math.random() * (this.canvas.height / this.fs)
    );
    this.speeds  = Array.from({ length: this.cols }, () => 0.8 + Math.random() * 2.5);
  }

  _draw () {
    const { ctx, canvas, fs } = this;

    // fade trail
    ctx.fillStyle = 'rgba(2, 0, 16, 0.06)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${fs}px "Courier New", monospace`;

    for (let i = 0; i < this.drops.length; i++) {
      const char  = Math.random() > 0.5 ? '1' : '0';
      const x     = i * fs;
      const y     = this.drops[i] * fs;
      const alpha = 0.35 + Math.random() * 0.65;

      // bright head
      if (Math.random() > 0.9) {
        ctx.fillStyle = `rgba(200, 255, 255, ${alpha})`;
      } else {
        ctx.fillStyle = `rgba(0, 245, 255, ${alpha * 0.7})`;
      }

      ctx.fillText(char, x, y);

      if (y > canvas.height && Math.random() > 0.975) {
        this.drops[i] = 0;
      }
      this.drops[i] += this.speeds[i];
    }
  }

  _animate () {
    this._draw();
    this.animId = requestAnimationFrame(() => this._animate());
  }

  _runProgress () {
    const bar     = document.querySelector('.loader-progress');
    const pct     = document.querySelector('.loader-percent');
    let progress  = 0;

    const tick = () => {
      if (this.done) return;
      // accelerate near end
      const step = progress < 70
        ? (3 + Math.random() * 7)
        : (1 + Math.random() * 2);

      progress = Math.min(100, progress + step);
      bar.style.width = progress + '%';
      pct.textContent = Math.round(progress) + '%';

      if (progress < 100) {
        setTimeout(tick, 60 + Math.random() * 60);
      } else {
        setTimeout(() => this._hide(), 600);
      }
    };
    setTimeout(tick, 300);
  }

  _hide () {
    this.done = true;
    cancelAnimationFrame(this.animId);

    const el = document.getElementById('loader');
    gsap.to(el, {
      opacity: 0,
      duration: 0.7,
      ease: 'power2.inOut',
      onComplete: () => {
        el.style.display = 'none';
        window.dispatchEvent(new CustomEvent('loaderDone'));
      }
    });
  }
}
