// ====================================
// NEURAL NEXUS - Main JavaScript
// ====================================

document.addEventListener('DOMContentLoaded', () => {
    
    // =====================
    // CUSTOM CURSOR TRAIL
    // =====================
    const cursorTrail = document.getElementById('cursor-trail');
    let mouseX = 0, mouseY = 0;
    let trailParticles = [];
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Create new trail particle
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.left = e.clientX + 'px';
        particle.style.top = e.clientY + 'px';
        particle.style.width = '4px';
        particle.style.height = '4px';
        particle.style.borderRadius = '50%';
        particle.style.background = 'var(--accent-cyan)';
        particle.style.opacity = '0.6';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '9999';
        
        // Random size variation
        const size = Math.random() * 6 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        cursorTrail.appendChild(particle);
        trailParticles.push({ element: particle, life: 1 });
    });
    
    // Animate trail particles
    function animateTrail() {
        for (let i = trailParticles.length - 1; i >= 0; i--) {
            const p = trailParticles[i];
            p.life -= 0.02;
            p.element.style.opacity = p.life * 0.6;
            p.element.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
            
            if (p.life <= 0) {
                p.element.remove();
                trailParticles.splice(i, 1);
            }
        }
        requestAnimationFrame(animateTrail);
    }
    animateTrail();
    
    // =====================
    // GSAP ANIMATIONS
    // =====================
    gsap.registerPlugin(ScrollTrigger);
    
    // Hero animations (already in CSS, enhance with GSAP)
    gsap.from('.hero-content', {
        duration: 1.5,
        opacity: 0,
        y: 50,
        ease: 'power3.out',
        delay: 0.2
    });
    
    // About section stagger animations
    gsap.to('.about-intro', {
        scrollTrigger: {
            trigger: '.about-section',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
        },
        opacity: 1,
        duration: 0.8
    });
    
    gsap.to('.stat-card', {
        scrollTrigger: {
            trigger: '.about-section',
            start: 'top 75%',
            toggleActions: 'play none none reverse'
        },
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.2,
        ease: 'power3.out'
    });
    
    gsap.to('.timeline-section', {
        scrollTrigger: {
            trigger: '.about-section',
            start: 'top 70%',
            toggleActions: 'play none none reverse'
        },
        opacity: 1,
        x: 0,
        duration: 0.6,
        stagger: 0.2,
        ease: 'power3.out'
    });
    
    // Section headers fade in
    gsap.utils.toArray('.section-header').forEach(section => {
        gsap.from(section.querySelector('.section-tag'), {
            scrollTrigger: {
                trigger: section,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            y: 30,
            duration: 0.8,
            ease: 'power3.out'
        });
        
        gsap.from(section.querySelector('.section-title'), {
            scrollTrigger: {
                trigger: section,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            y: 30,
            duration: 0.8,
            ease: 'power3.out'
        });
    });
    
    // Applications cards stagger in
    gsap.to('.app-card', {
        scrollTrigger: {
            trigger: '.applications-section',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
        },
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power3.out'
    });
    
    // Ethics section animations
    gsap.to('.section-tag', {
        scrollTrigger: {
            trigger: '.ethics-section',
            start: 'top 85%',
            toggleActions: 'play none none reverse'
        },
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out'
    });
    
    gsap.to('.principle-card', {
        scrollTrigger: {
            trigger: '.ethics-section',
            start: 'top 75%',
            toggleActions: 'play none none reverse'
        },
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power3.out'
    });
    
    gsap.from('.diagram-ring', {
        scrollTrigger: {
            trigger: '.ethics-section',
            start: 'top 70%',
            toggleActions: 'play none none reverse'
        },
        rotate: 360,
        duration: [20, 25, 30],
        ease: 'none'
    });
    
    // Future section animations
    gsap.to('.neural-network-container', {
        scrollTrigger: {
            trigger: '.future-section',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
        },
        opacity: 1,
        duration: 1,
        ease: 'power2.out'
    });
    
    gsap.to('.timeline-point', {
        scrollTrigger: {
            trigger: '.future-section',
            start: 'top 75%',
            end: 'bottom bottom',
            toggleActions: 'play none none reverse',
            scrub: 1
        },
        opacity: 1,
        duration: 0.6,
        stagger: 0.2,
        ease: 'power3.out'
    });
    
    gsap.to('.prediction-item', {
        scrollTrigger: {
            trigger: '.future-section',
            start: 'top 70%',
            toggleActions: 'play none none reverse'
        },
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.2,
        ease: 'power3.out'
    });
    
    // Stats counter animation
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        
        ScrollTrigger.create({
            trigger: '.about-section',
            start: 'top 70%',
            once: true,
            onEnter: () => {
                gsap.to(stat, {
                    innerHTML: target,
                    duration: 2,
                    snap: { innerHTML: 1 },
                    onUpdate: function() {
                        stat.innerHTML = Math.ceil(this.targets()[0].innerHTML) + '+';
                    }
                });
            }
        });
    });
    
    // =====================
    // TYPEWRITER EFFECT
    // =====================
    const textToType = "Ethical AI development is crucial for a sustainable future.";
    const typewriterElement = document.querySelector('.typewriter-text');
    let typeIndex = 0;
    let isDeleting = false;
    
    function typeWriter() {
        if (typeIndex < textToType.length) {
            if (isDeleting) {
                typewriterElement.textContent = textToType.substring(0, typeIndex - 1);
                typeIndex--;
            } else {
                typewriterElement.textContent += textToType.charAt(typeIndex);
                typeIndex++;
            }
            
            if (!isDeleting) {
                setTimeout(typeWriter, 100 + Math.random() * 50);
            } else {
                setTimeout(typeWriter, 500);
            }
        } else {
            if (isDeleting) {
                return;
            }
            // Loop the typing effect
            isDeleting = true;
            setTimeout(typeWriter, 2000);
        }
    }
    
    // Start typewriter after a delay
    setTimeout(typeWriter, 3000);
    
    // =====================
    // PARALLAX EFFECTS
    // =====================
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth - 0.5;
        const mouseY = e.clientY / window.innerHeight - 0.5;
        
        // Parallax hero text
        gsap.to('.hero-title', {
            x: mouseX * -20,
            y: mouseY * -20,
            duration: 1,
            ease: 'power2.out'
        });
        
        // Parallax orbs
        gsap.to('.orb-1', {
            x: mouseX * 30,
            y: mouseY * 30,
            duration: 2,
            ease: 'power2.out'
        });
        
        gsap.to('.orb-2', {
            x: mouseX * 40,
            y: mouseY * 40,
            duration: 2.5,
            ease: 'power2.out'
        });
    });
    
    // =====================
    // MAGNETIC BUTTONS
    // =====================
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            gsap.to(btn, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
        
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: 'elastic.out(1, 0.3)'
            });
        });
    });
    
    // =====================
    // SCROLL TO TOP BUTTON
    // =====================
    const scrollBtn = document.getElementById('scrollToTop');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            scrollBtn.style.opacity = '1';
            scrollBtn.style.pointerEvents = 'auto';
        } else {
            scrollBtn.style.opacity = '0';
            scrollBtn.style.pointerEvents = 'none';
        }
    });
    
    scrollBtn.addEventListener('click', () => {
        gsap.to(window, {
            duration: 1,
            scrollTo: 0,
            ease: 'power2.inOut'
        });
    });
    
    // =====================
    // SMOOTH NAVIGATION LINKS
    // =====================
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                e.preventDefault();
                gsap.to(window, {
                    duration: 1,
                    scrollTo: targetSection,
                    ease: 'power2.inOut'
                });
            }
        });
    });
    
    // =====================
    // CARD TILT EFFECT (Applications)
    // =====================
    const appCards = document.querySelectorAll('[data-tilt]');
    appCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            gsap.to(card, {
                rotationX: rotateX,
                rotationY: rotateY,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
        
        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                rotationX: 0,
                rotationY: 0,
                duration: 0.5,
                ease: 'elastic.out(1, 0.3)'
            });
        });
    });
    
    // =====================
    // NEURAL NETWORK CANVAS (Simple version)
    // =====================
    function createNeuralNetwork() {
        const canvas = document.getElementById('neuralNetwork');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        let mouse = { x: null, y: null };
        
        // Resize handling
        function resize() {
            width = canvas.width = canvas.parentElement.offsetWidth;
            height = canvas.height = canvas.parentElement.offsetHeight;
        }
        
        resize();
        window.addEventListener('resize', resize);
        
        // Mouse tracking
        document.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });
        
        // Particle class
        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 1.5;
                this.vy = (Math.random() - 0.5) * 1.5;
                this.size = Math.random() * 3 + 2;
                this.color = `hsl(${Math.random() * 60 + 180}, 100%, 70%)`;
            }
            
            update() {
                this.x += this.vx;
                this.y += this.vy;
                
                // Bounce off edges
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
                
                // Mouse interaction
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    this.x -= dx / distance * 2;
                    this.y -= dy / distance * 2;
                }
            }
            
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
        }
        
        // Create particles
        for (let i = 0; i < 60; i++) {
            particles.push(new Particle());
        }
        
        // Animation loop
        function animate() {
            ctx.clearRect(0, 0, width, height);
            
            // Draw connections
            ctx.strokeStyle = 'rgba(0, 245, 255, 0.15)';
            ctx.lineWidth = 1;
            
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            
            // Update and draw particles
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });
            
            requestAnimationFrame(animate);
        }
        
        animate();
    }
    
    // Create neural network after a short delay
    setTimeout(createNeuralNetwork, 1000);
    
    // =====================
    // OBSERVER FOR LAZY ANIMATIONS
    // =====================
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all cards and sections
    document.querySelectorAll('.app-card, .principle-card, .prediction-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
    
    console.log('🚀 Neural Nexus initialized successfully!');
});
