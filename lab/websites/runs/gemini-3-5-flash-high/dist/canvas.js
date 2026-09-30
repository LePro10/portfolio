/* ==========================================================================
   AETHERIS AI - HIGH-PERFORMANCE NEURAL CANVAS ENGINE
   ========================================================================== */

class NeuralBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        
        // Configuration Parameters
        this.config = {
            particleCount: 75,
            connectDistance: 135,
            particleSpeed: 0.45,
            mouseGravityRadius: 180,
            mouseGravityStrength: 0.04,
            baseNodeColor: 'rgba(0, 242, 254, ',  // Cyan
            baseLinkColor: 'rgba(184, 39, 252, ',  // Purple
        };
        
        this.particles = [];
        this.mouse = {
            x: null,
            y: null,
            targetX: null,
            targetY: null,
            active: false,
            radius: this.config.mouseGravityRadius
        };
        
        this.resizeDebounce = null;
        this.init();
    }
    
    init() {
        this.resize();
        this.spawnParticles();
        this.setupEventListeners();
        this.animate();
    }
    
    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Scale canvas for high-DPI (Retina) displays
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        this.ctx.scale(dpr, dpr);
        
        // Dynamic node scaling based on viewport width
        if (this.width < 768) {
            this.config.particleCount = 30;
            this.config.connectDistance = 90;
        } else if (this.width < 1200) {
            this.config.particleCount = 55;
            this.config.connectDistance = 120;
        } else {
            this.config.particleCount = 75;
            this.config.connectDistance = 135;
        }
    }
    
    spawnParticles() {
        this.particles = [];
        for (let i = 0; i < this.config.particleCount; i++) {
            this.particles.push(this.createParticle());
        }
    }
    
    createParticle() {
        const radius = Math.random() * 2 + 1.5;
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            vx: (Math.random() - 0.5) * this.config.particleSpeed * 2,
            vy: (Math.random() - 0.5) * this.config.particleSpeed * 2,
            radius: radius,
            originalRadius: radius,
            glow: Math.random() * 10 + 5,
            pulseSpeed: 0.02 + Math.random() * 0.03,
            pulsePhase: Math.random() * Math.PI * 2
        };
    }
    
    setupEventListeners() {
        window.addEventListener('mousemove', (e) => {
            this.mouse.active = true;
            this.mouse.targetX = e.clientX;
            this.mouse.targetY = e.clientY;
        });
        
        window.addEventListener('mouseleave', () => {
            this.mouse.active = false;
            this.mouse.targetX = null;
            this.mouse.targetY = null;
        });
        
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeDebounce);
            this.resizeDebounce = setTimeout(() => {
                const prevCount = this.config.particleCount;
                this.resize();
                if (prevCount !== this.config.particleCount) {
                    this.spawnParticles();
                }
            }, 200);
        });
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Interpolate mouse coordinates for a smooth trailing inertia feel
        if (this.mouse.active && this.mouse.targetX !== null) {
            if (this.mouse.x === null) {
                this.mouse.x = this.mouse.targetX;
                this.mouse.y = this.mouse.targetY;
            } else {
                this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.12;
                this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.12;
            }
        } else {
            this.mouse.x = null;
            this.mouse.y = null;
        }
        
        this.updateParticles();
        this.drawConnections();
        this.drawParticles();
        
        requestAnimationFrame(() => this.animate());
    }
    
    updateParticles() {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Move Particle
            p.x += p.vx;
            p.y += p.vy;
            
            // Bounce off outer bounds slightly padded to prevent getting stuck
            const padding = 10;
            if (p.x < -padding) { p.x = this.width + padding; }
            else if (p.x > this.width + padding) { p.x = -padding; }
            
            if (p.y < -padding) { p.y = this.height + padding; }
            else if (p.y > this.height + padding) { p.y = -padding; }
            
            // Subtle Node Radius Pulsing to look alive
            p.pulsePhase += p.pulseSpeed;
            p.radius = p.originalRadius + Math.sin(p.pulsePhase) * 0.5;
            
            // Magnetic Cursor Interaction (Gravity Well)
            if (this.mouse.active && this.mouse.x !== null) {
                const dx = this.mouse.x - p.x;
                const dy = this.mouse.y - p.y;
                const dist = Math.hypot(dx, dy);
                
                if (dist < this.config.mouseGravityRadius) {
                    // Calculate pull direction and apply soft vector correction
                    const force = (this.config.mouseGravityRadius - dist) / this.config.mouseGravityRadius;
                    p.x += (dx / dist) * force * this.config.mouseGravityStrength * 18;
                    p.y += (dy / dist) * force * this.config.mouseGravityStrength * 18;
                    
                    // Excite particle size and glow near cursor
                    p.radius += 0.8 * force;
                }
            }
        }
    }
    
    drawParticles() {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            
            // Nodes closer to the cursor glow brighter
            let brightness = 0.65;
            if (this.mouse.active && this.mouse.x !== null) {
                const dist = Math.hypot(this.mouse.x - p.x, this.mouse.y - p.y);
                if (dist < this.config.mouseGravityRadius) {
                    brightness += (1 - dist / this.config.mouseGravityRadius) * 0.35;
                }
            }
            
            this.ctx.fillStyle = `${this.config.baseNodeColor}${brightness})`;
            
            // Apply soft drop shadows to nodes
            this.ctx.shadowBlur = p.glow;
            this.ctx.shadowColor = 'rgba(0, 242, 254, 0.4)';
            this.ctx.fill();
        }
        // Reset shadows for lines to preserve rendering budgets
        this.ctx.shadowBlur = 0;
    }
    
    drawConnections() {
        let activeConnections = 0;
        
        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[i];
            
            // Check connections between nodes
            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.hypot(dx, dy);
                
                if (dist < this.config.connectDistance) {
                    activeConnections++;
                    const opacity = (1 - dist / this.config.connectDistance) * 0.18;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    
                    // Create gradient connections for elegant visual flows
                    const grad = this.ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                    grad.addColorStop(0, `${this.config.baseNodeColor}${opacity})`);
                    grad.addColorStop(1, `${this.config.baseLinkColor}${opacity})`);
                    
                    this.ctx.strokeStyle = grad;
                    this.ctx.lineWidth = (1 - dist / this.config.connectDistance) * 0.8;
                    this.ctx.stroke();
                }
            }
            
            // Connect nodes dynamically to cursor
            if (this.mouse.active && this.mouse.x !== null) {
                const dx = this.mouse.x - p1.x;
                const dy = this.mouse.y - p1.y;
                const dist = Math.hypot(dx, dy);
                
                if (dist < this.config.mouseGravityRadius) {
                    const opacity = (1 - dist / this.config.mouseGravityRadius) * 0.35;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(this.mouse.x, this.mouse.y);
                    
                    this.ctx.strokeStyle = `rgba(0, 242, 254, ${opacity})`;
                    this.ctx.lineWidth = (1 - dist / this.config.mouseGravityRadius) * 1.2;
                    this.ctx.stroke();
                }
            }
        }
        
        // Dynamically update the HUD net connection count
        const hudConns = document.getElementById('neural-connections-val');
        if (hudConns && Math.random() < 0.15) {
            hudConns.textContent = activeConnections + 5; // offset slightly for tech flair
        }
    }
}

// Initialise Background on DOM load
window.addEventListener('DOMContentLoaded', () => {
    window.neuralBg = new NeuralBackground('neural-canvas');
});
