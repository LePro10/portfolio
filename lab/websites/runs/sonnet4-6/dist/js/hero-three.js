/* ============================================================
   hero-three.js — Three.js 3D particle neural brain
   ============================================================ */

class HeroThree {
  constructor () {
    this.canvas   = document.getElementById('hero-canvas');
    if (!this.canvas || typeof THREE === 'undefined') return;

    this.mouse    = { x: 0, y: 0 };
    this.target   = { rx: 0, ry: 0 };
    this.current  = { rx: 0, ry: 0 };
    this.baseRY   = 0;
    this.clock    = { t: 0 };

    this._init();
    this._buildParticles();
    this._buildConnections();
    this._buildAmbient();
    this._bind();
    this._animate();
  }

  _init () {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.scene    = new THREE.Scene();
    this.camera   = new THREE.PerspectiveCamera(55, w / h, 0.1, 1000);
    this.camera.position.z = 18;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha:  true,
      antialias: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(0x000000, 0);

    this.group = new THREE.Group();
    this.scene.add(this.group);
  }

  _buildParticles () {
    const COUNT = 280;
    const pos   = new Float32Array(COUNT * 3);
    const col   = new Float32Array(COUNT * 3);

    this._pdata = [];           // store for connection calc

    for (let i = 0; i < COUNT; i++) {
      // uniform sphere distribution
      const u   = Math.random();
      const v   = Math.random();
      const th  = 2 * Math.PI * u;
      const ph  = Math.acos(2 * v - 1);
      const r   = Math.cbrt(Math.random()) * 7.5;

      const x = r * Math.sin(ph) * Math.cos(th);
      const y = r * Math.sin(ph) * Math.sin(th);
      const z = r * Math.cos(ph);

      pos[i * 3]     = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      this._pdata.push(x, y, z);

      // cyan → purple gradient by Y
      const t = (y + 7.5) / 15;
      col[i * 3]     = t * 0.48;              // R
      col[i * 3 + 1] = (1 - t) * 0.96 + t * 0.37; // G
      col[i * 3 + 2] = 1.0;                   // B
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size:            0.14,
      vertexColors:    true,
      transparent:     true,
      opacity:         0.85,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(geo, mat);
    this.group.add(this.particles);
  }

  _buildConnections () {
    const pd      = this._pdata;       // flat array [x,y,z, x,y,z ...]
    const lines   = [];
    const lcols   = [];
    const THRESH  = 2.8;
    const MAX     = 600;

    for (let i = 0; i < pd.length / 3 && lines.length / 6 < MAX; i++) {
      for (let j = i + 1; j < pd.length / 3 && lines.length / 6 < MAX; j++) {
        const dx = pd[i*3]   - pd[j*3];
        const dy = pd[i*3+1] - pd[j*3+1];
        const dz = pd[i*3+2] - pd[j*3+2];
        const d  = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (d < THRESH) {
          lines.push(pd[i*3], pd[i*3+1], pd[i*3+2],
                     pd[j*3], pd[j*3+1], pd[j*3+2]);
          const a = 1 - d / THRESH;
          // cyan lines
          lcols.push(0, a * 0.96, a,  0, a * 0.37, a * 0.65);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lines), 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(lcols), 3));

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent:  true,
      opacity:      0.28
    });

    this.lines = new THREE.LineSegments(geo, mat);
    this.group.add(this.lines);
  }

  _buildAmbient () {
    // outer haze ring
    const COUNT = 80;
    const pos   = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const th = (i / COUNT) * Math.PI * 2;
      const r  = 9 + Math.random() * 2;
      pos[i*3]   = r * Math.cos(th);
      pos[i*3+1] = (Math.random() - 0.5) * 2;
      pos[i*3+2] = r * Math.sin(th);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.08, color: 0x7B5EA7, transparent: true, opacity: 0.4,
      sizeAttenuation: true
    });
    this.haze = new THREE.Points(geo, mat);
    this.group.add(this.haze);
  }

  _bind () {
    window.addEventListener('mousemove', e => {
      this.mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      this.mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  _animate () {
    requestAnimationFrame(() => this._animate());

    // smooth mouse parallax
    this.target.rx = -this.mouse.y * 0.35;
    this.target.ry =  this.mouse.x * 0.35;
    this.current.rx += (this.target.rx - this.current.rx) * 0.04;
    this.current.ry += (this.target.ry - this.current.ry) * 0.04;

    // auto rotation
    this.baseRY += 0.0018;

    this.group.rotation.x = this.current.rx;
    this.group.rotation.y = this.baseRY + this.current.ry;

    // haze counter-rotation
    if (this.haze) this.haze.rotation.y -= 0.003;

    // subtle scale breathe
    const s = 1 + Math.sin(Date.now() * 0.0006) * 0.012;
    this.group.scale.setScalar(s);

    this.renderer.render(this.scene, this.camera);
  }
}
