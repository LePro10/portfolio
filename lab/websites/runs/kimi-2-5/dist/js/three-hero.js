/* ========================================
   SYNAPSE - Three.js Neural Network Hero
   Living particle network with synapse effects
   ======================================== */

class NeuralNetwork {
  constructor(container) {
    this.container = container;
    if (!this.container) return;
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.particles = null;
    this.connections = null;
    this.mouse = new THREE.Vector2();
    this.targetMouse = new THREE.Vector2();
    this.time = 0;
    this.width = container.offsetWidth;
    this.height = container.offsetHeight;
    this.isActive = true;
    
    this.init();
  }
  
  init() {
    // Scene setup
    this.scene = new THREE.Scene();
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
    this.camera.position.z = 30;
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);
    
    // Create particles
    this.createParticles();
    this.createConnections();
    
    // Mouse events
    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      this.targetMouse.x = ((e.clientX - rect.left) / this.width) * 2 - 1;
      this.targetMouse.y = -((e.clientY - rect.top) / this.height) * 2 + 1;
    });
    
    // Resize
    window.addEventListener('resize', () => this.onResize());
    
    // Visibility
    document.addEventListener('visibilitychange', () => {
      this.isActive = !document.hidden;
    });
    
    // Start animation
    this.animate();
  }
  
  createParticles() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);
    
    const color1 = new THREE.Color(0x00f0ff); // Cyan
    const color2 = new THREE.Color(0x6b21a8);   // Purple
    
    for (let i = 0; i < particleCount; i++) {
      // Random position in a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 10 + Math.random() * 15;
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      // Mix colors
      const mixRatio = Math.random();
      const mixedColor = color1.clone().lerp(color2, mixRatio);
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
      
      sizes[i] = Math.random() * 3 + 1;
      
      // Random velocities
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    // Custom shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 velocity;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform vec2 uMouse;
        
        void main() {
          vColor = color;
          
          vec3 pos = position;
          
          // Gentle floating animation
          pos.x += sin(uTime * 0.5 + position.y * 0.5) * 0.5;
          pos.y += cos(uTime * 0.3 + position.x * 0.5) * 0.5;
          pos.z += sin(uTime * 0.4 + position.z * 0.3) * 0.3;
          
          // Mouse interaction - particles repel from mouse
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vec2 screenPos = (projectionMatrix * modelViewMatrix * vec4(position, 1.0)).xy;
          
          float dist = distance(screenPos, uMouse);
          float influence = smoothstep(0.5, 0.0, dist);
          
          vec3 dir = normalize(pos);
          pos += dir * influence * 2.0;
          
          // Pulse size
          float pulse = sin(uTime * 2.0 + position.x * 0.5) * 0.3 + 0.7;
          vAlpha = pulse;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * pulse * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          // Circular particle
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          if (dist > 0.5) discard;
          
          // Glow effect
          float glow = 1.0 - smoothstep(0.0, 0.5, dist);
          float core = 1.0 - smoothstep(0.0, 0.15, dist);
          
          vec3 finalColor = vColor * (glow * 0.6 + core * 0.4);
          float alpha = glow * vAlpha;
          
          gl_FragColor = vec4(finalColor, alpha * 0.8);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }
  
  createConnections() {
    // Create connection lines between nearby particles
    const positions = this.particles.geometry.attributes.position.array;
    const particleCount = positions.length / 3;
    const maxConnections = 3;
    const connectionDistance = 8;
    
    const linePositions = [];
    const lineColors = [];
    
    for (let i = 0; i < particleCount; i++) {
      let connections = 0;
      const pos1 = new THREE.Vector3(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );
      
      for (let j = i + 1; j < particleCount && connections < maxConnections; j++) {
        const pos2 = new THREE.Vector3(
          positions[j * 3],
          positions[j * 3 + 1],
          positions[j * 3 + 2]
        );
        
        const dist = pos1.distanceTo(pos2);
        
        if (dist < connectionDistance) {
          linePositions.push(
            pos1.x, pos1.y, pos1.z,
            pos2.x, pos2.y, pos2.z
          );
          
          // Color based on distance
          const alpha = 1.0 - (dist / connectionDistance);
          const r = 0.0 * alpha;
          const g = 0.94 * alpha * 0.5;
          const b = 1.0 * alpha * 0.5;
          
          lineColors.push(r, g, b, r, g, b);
          
          connections++;
        }
      }
    }
    
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
    
    const lineMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }
      },
      vertexShader: `
        varying float vAlpha;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float uTime;
        
        void main() {
          vColor = color;
          
          vec3 pos = position;
          pos.x += sin(uTime * 0.5 + position.y * 0.5) * 0.5;
          pos.y += cos(uTime * 0.3 + position.x * 0.5) * 0.5;
          pos.z += sin(uTime * 0.4 + position.z * 0.3) * 0.3;
          
          vAlpha = length(color);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;
        
        void main() {
          float alpha = vAlpha * 0.15;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.connections = new THREE.LineSegments(lineGeometry, lineMaterial);
    this.scene.add(this.connections);
  }
  
  onResize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  
  animate() {
    if (!this.isActive) {
      requestAnimationFrame(() => this.animate());
      return;
    }
    
    this.time += 0.01;
    
    // Smooth mouse follow
    this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;
    
    // Update uniforms
    if (this.particles && this.particles.material.uniforms) {
      this.particles.material.uniforms.uTime.value = this.time;
      this.particles.material.uniforms.uMouse.value = this.mouse;
    }
    
    if (this.connections && this.connections.material.uniforms) {
      this.connections.material.uniforms.uTime.value = this.time;
    }
    
    // Rotate scene slowly
    this.scene.rotation.y = this.time * 0.1;
    this.scene.rotation.x = Math.sin(this.time * 0.2) * 0.1;
    
    // Render
    this.renderer.render(this.scene, this.camera);
    
    requestAnimationFrame(() => this.animate());
  }
  
  destroy() {
    this.isActive = false;
    if (this.renderer) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const heroContainer = document.getElementById('hero-canvas');
  if (heroContainer && typeof THREE !== 'undefined') {
    new NeuralNetwork(heroContainer);
  }
});
