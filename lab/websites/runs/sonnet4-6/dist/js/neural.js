/* ============================================================
   neural.js — Interactive 2D neural network canvas
   ============================================================ */

class NeuralNet {
  constructor (canvas) {
    this.canvas   = canvas;
    this.ctx      = canvas.getContext('2d');
    this.nodes    = [];
    this.signals  = [];
    this.drag     = null;
    this.didDrag  = false;
    this.animId   = null;
    this._idSeed  = 0;

    this._resize();
    this._initNodes();
    this._bind();
    this._loop();
  }

  /* ── Public API ────────────────────────────────────────── */
  addNode (x, y) {
    this.nodes.push({
      id:    this._idSeed++,
      x:     x ?? Math.random() * this.canvas.width,
      y:     y ?? Math.random() * this.canvas.height,
      vx:    (Math.random() - 0.5) * 0.4,
      vy:    (Math.random() - 0.5) * 0.4,
      r:     7 + Math.random() * 5,
      color: this._rndColor(),
      pulse: 0
    });
  }

  fireAll () {
    const edges = this._edges();
    edges.forEach((e, i) => {
      setTimeout(() => this._spawnSignal(e.a, e.b), i * 30 + Math.random() * 200);
    });
  }

  reset () {
    this.nodes   = [];
    this.signals = [];
    this._initNodes();
  }

  /* ── Private ───────────────────────────────────────────── */
  _rndColor () {
    return ['#00F5FF', '#7B5EA7', '#FF2D78', '#A8F8FF', '#C0A0FF'][
      Math.floor(Math.random() * 5)
    ];
  }

  _resize () {
    this.canvas.width  = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight || window.innerHeight * 0.65;
  }

  _initNodes () {
    const count = 18;
    for (let i = 0; i < count; i++) this.addNode();
    // auto-fire after init
    setTimeout(() => this.fireAll(), 600);
  }

  _edges () {
    const THRESH = Math.min(this.canvas.width, this.canvas.height) * 0.32;
    const out    = [];
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const dx = this.nodes[i].x - this.nodes[j].x;
        const dy = this.nodes[i].y - this.nodes[j].y;
        const d  = Math.hypot(dx, dy);
        if (d < THRESH) out.push({ a: this.nodes[i], b: this.nodes[j], d, THRESH });
      }
    }
    return out;
  }

  _spawnSignal (fromNode, toNode) {
    this.signals.push({
      from:  fromNode,
      to:    toNode,
      t:     0,
      speed: 0.006 + Math.random() * 0.008,
      color: fromNode.color,
      size:  3 + Math.random() * 3
    });
  }

  _draw () {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const edges = this._edges();

    /* edges */
    edges.forEach(({ a, b, d, THRESH }) => {
      const alpha = (1 - d / THRESH) * 0.35;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(123,94,167,${alpha})`;
      ctx.lineWidth   = 1;
      ctx.stroke();
    });

    /* signals */
    this.signals.forEach(s => {
      const x = s.from.x + (s.to.x - s.from.x) * s.t;
      const y = s.from.y + (s.to.y - s.from.y) * s.t;

      /* trail */
      const tx = s.from.x + (s.to.x - s.from.x) * Math.max(0, s.t - 0.12);
      const ty = s.from.y + (s.to.y - s.from.y) * Math.max(0, s.t - 0.12);
      const grad = ctx.createLinearGradient(tx, ty, x, y);
      grad.addColorStop(0, s.color + '00');
      grad.addColorStop(1, s.color + 'CC');
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(x, y);
      ctx.strokeStyle = grad;
      ctx.lineWidth   = s.size * 0.6;
      ctx.stroke();

      /* head glow */
      ctx.save();
      ctx.shadowBlur  = 16;
      ctx.shadowColor = s.color;
      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.restore();
    });

    /* nodes */
    this.nodes.forEach(n => {
      /* outer glow */
      const gr = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4);
      gr.addColorStop(0, n.color + '55');
      gr.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
      ctx.fillStyle = gr;
      ctx.fill();

      /* core */
      ctx.save();
      ctx.shadowBlur  = 10;
      ctx.shadowColor = n.color;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.fill();
      ctx.restore();

      /* border ring */
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + 2, 0, Math.PI * 2);
      ctx.strokeStyle = n.color + '66';
      ctx.lineWidth   = 1;
      ctx.stroke();

      /* pulse ring */
      if (n.pulse > 0) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * (1 + n.pulse * 4), 0, Math.PI * 2);
        const hex = Math.round(n.pulse * 200).toString(16).padStart(2, '0');
        ctx.strokeStyle = n.color + hex;
        ctx.lineWidth   = 2;
        ctx.stroke();
        n.pulse -= 0.018;
        if (n.pulse < 0) n.pulse = 0;
      }
    });
  }

  _update () {
    const W = this.canvas.width;
    const H = this.canvas.height;

    /* move nodes */
    this.nodes.forEach(n => {
      if (this.drag && this.drag.id === n.id) return;
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < n.r || n.x > W - n.r) n.vx *= -1;
      if (n.y < n.r || n.y > H - n.r) n.vy *= -1;
    });

    /* advance signals */
    this.signals = this.signals.filter(s => {
      s.t += s.speed;
      if (s.t >= 1) {
        s.to.pulse = 1;
        // bounce back occasionally
        if (Math.random() > 0.6) {
          setTimeout(() => this._spawnSignal(s.to, s.from), 80 + Math.random() * 200);
        }
        return false;
      }
      return true;
    });

    /* random auto-fire */
    if (Math.random() < 0.025) {
      const edges = this._edges();
      if (edges.length) {
        const e = edges[Math.floor(Math.random() * edges.length)];
        this._spawnSignal(e.a, e.b);
      }
    }
  }

  _loop () {
    this._draw();
    this._update();
    this.animId = requestAnimationFrame(() => this._loop());
  }

  _bind () {
    const c = this.canvas;

    /* click = add node */
    c.addEventListener('click', e => {
      if (this.didDrag) { this.didDrag = false; return; }
      const r   = c.getBoundingClientRect();
      const x   = e.clientX - r.left;
      const y   = e.clientY - r.top;
      // don't place on existing node
      const hit = this.nodes.find(n => Math.hypot(n.x - x, n.y - y) < n.r * 2);
      if (!hit) {
        this.addNode(x, y);
        this.nodes[this.nodes.length - 1].pulse = 1;
      }
    });

    /* drag */
    c.addEventListener('mousedown', e => {
      const r  = c.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      this.drag     = this.nodes.find(n => Math.hypot(n.x - mx, n.y - my) < n.r * 2.5) || null;
      this.didDrag  = false;
    });
    c.addEventListener('mousemove', e => {
      if (!this.drag) return;
      const r = c.getBoundingClientRect();
      this.drag.x = e.clientX - r.left;
      this.drag.y = e.clientY - r.top;
      this.didDrag = true;
    });
    const stopDrag = () => { this.drag = null; };
    c.addEventListener('mouseup',    stopDrag);
    c.addEventListener('mouseleave', stopDrag);

    /* touch support */
    c.addEventListener('touchstart', e => {
      e.preventDefault();
      const t  = e.touches[0];
      const r  = c.getBoundingClientRect();
      const mx = t.clientX - r.left;
      const my = t.clientY - r.top;
      const hit = this.nodes.find(n => Math.hypot(n.x - mx, n.y - my) < n.r * 3);
      if (hit) { this.drag = hit; this.didDrag = false; }
      else      { this.addNode(mx, my); this.nodes[this.nodes.length-1].pulse = 1; }
    }, { passive: false });
    c.addEventListener('touchmove', e => {
      e.preventDefault();
      if (!this.drag) return;
      const t = e.touches[0];
      const r = c.getBoundingClientRect();
      this.drag.x   = t.clientX - r.left;
      this.drag.y   = t.clientY - r.top;
      this.didDrag  = true;
    }, { passive: false });
    c.addEventListener('touchend', stopDrag);

    window.addEventListener('resize', () => this._resize());
  }
}

/* ── Button controls (wired up in main.js after canvas init) ── */
function initNeuralControls (net) {
  document.getElementById('btn-add-node').addEventListener('click', () => {
    const W = net.canvas.width;
    const H = net.canvas.height;
    net.addNode(
      W * 0.2 + Math.random() * W * 0.6,
      H * 0.2 + Math.random() * H * 0.6
    );
    net.nodes[net.nodes.length - 1].pulse = 1;
  });
  document.getElementById('btn-fire').addEventListener('click', () => net.fireAll());
  document.getElementById('btn-reset').addEventListener('click', () => net.reset());
}
