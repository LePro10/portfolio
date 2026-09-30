class NeuralNetwork {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nodes = [];
    this.connections = [];
    this.particles = [];
    this.mouse = { x: -1000, y: -1000 };
    this.nodeCount = 80;
    this.connectionDistance = 180;
    this.mouseRadius = 200;
    this.init();
  }

  init() {
    this.resize();
    this.createNodes();
    this.createConnections();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.w = this.canvas.width;
    this.h = this.canvas.height;
  }

  createNodes() {
    this.nodes = [];
    for (let i = 0; i < this.nodeCount; i++) {
      this.nodes.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        baseRadius: Math.random() * 2 + 1,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
  }

  createConnections() {
    this.connections = [];
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const dx = this.nodes[i].x - this.nodes[j].x;
        const dy = this.nodes[i].y - this.nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.connectionDistance) {
          this.connections.push({
            a: i,
            b: j,
            dist,
            opacity: (1 - dist / this.connectionDistance) * 0.15,
          });
        }
      }
    }
  }

  createParticles() {
    for (let i = 0; i < 30; i++) {
      const connIdx = Math.floor(Math.random() * this.connections.length);
      if (this.connections[connIdx]) {
        this.particles.push({
          conn: connIdx,
          t: Math.random(),
          speed: (Math.random() * 0.005 + 0.002) * (Math.random() > 0.5 ? 1 : -1),
          size: Math.random() * 2 + 1,
        });
      }
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.createNodes();
      this.createConnections();
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
  }

  updateNodes() {
    this.nodes.forEach((node) => {
      node.x += node.vx;
      node.y += node.vy;
      node.pulse += node.pulseSpeed;

      if (node.x < 0 || node.x > this.w) node.vx *= -1;
      if (node.y < 0 || node.y > this.h) node.vy *= -1;

      node.x = Math.max(0, Math.min(this.w, node.x));
      node.y = Math.max(0, Math.min(this.h, node.y));

      const dx = this.mouse.x - node.x;
      const dy = this.mouse.y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.mouseRadius) {
        const force = (this.mouseRadius - dist) / this.mouseRadius;
        node.radius = node.baseRadius + force * 3;
        node.opacity = Math.min(1, node.opacity + force * 0.3);
      } else {
        node.radius += (node.baseRadius - node.radius) * 0.05;
      }
    });
  }

  updateConnections() {
    this.connections.forEach((conn) => {
      const a = this.nodes[conn.a];
      const b = this.nodes[conn.b];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      conn.dist = Math.sqrt(dx * dx + dy * dy);
      conn.opacity = Math.max(0, (1 - conn.dist / this.connectionDistance)) * 0.15;
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.w, this.h);

    this.connections.forEach((conn) => {
      if (conn.dist > this.connectionDistance) return;
      const a = this.nodes[conn.a];
      const b = this.nodes[conn.b];

      const gradient = this.ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      gradient.addColorStop(0, `rgba(168, 85, 247, ${conn.opacity})`);
      gradient.addColorStop(1, `rgba(6, 182, 212, ${conn.opacity})`);

      this.ctx.beginPath();
      this.ctx.moveTo(a.x, a.y);
      this.ctx.lineTo(b.x, b.y);
      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = 0.5;
      this.ctx.stroke();
    });

    this.nodes.forEach((node) => {
      const pulseSize = Math.sin(node.pulse) * 0.5 + 1;

      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius * pulseSize, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(168, 85, 247, ${node.opacity * 0.8})`;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius * pulseSize * 2, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(168, 85, 247, ${node.opacity * 0.15})`;
      this.ctx.fill();
    });

    this.particles.forEach((p) => {
      const conn = this.connections[p.conn];
      if (!conn || conn.dist > this.connectionDistance) return;

      p.t += p.speed;
      if (p.t > 1) p.t -= 1;
      if (p.t < 0) p.t += 1;

      const a = this.nodes[conn.a];
      const b = this.nodes[conn.b];
      const x = a.x + (b.x - a.x) * p.t;
      const y = a.y + (b.y - a.y) * p.t;

      this.ctx.beginPath();
      this.ctx.arc(x, y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(6, 182, 212, 0.6)';
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(x, y, p.size * 3, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      this.ctx.fill();
    });
  }

  animate() {
    this.updateNodes();
    this.updateConnections();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('neuralCanvas');
  if (canvas) {
    new NeuralNetwork(canvas);
  }
});
