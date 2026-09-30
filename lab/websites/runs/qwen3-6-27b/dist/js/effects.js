// ===== TYPING ANIMATION =====
class TypingEffect {
  constructor(element, phrases, typeSpeed = 60, deleteSpeed = 30, pauseDuration = 2000) {
    this.element = element;
    this.phrases = phrases;
    this.typeSpeed = typeSpeed;
    this.deleteSpeed = deleteSpeed;
    this.pauseDuration = pauseDuration;
    this.phraseIndex = 0;
    this.charIndex = 0;
    this.isDeleting = false;
    this.start();
  }

  start() {
    this.type();
  }

  type() {
    const currentPhrase = this.phrases[this.phraseIndex];

    if (this.isDeleting) {
      this.charIndex--;
    } else {
      this.charIndex++;
    }

    this.element.textContent = currentPhrase.substring(0, this.charIndex);

    let speed = this.isDeleting ? this.deleteSpeed : this.typeSpeed;

    if (!this.isDeleting && this.charIndex === currentPhrase.length) {
      speed = this.pauseDuration;
      this.isDeleting = true;
    } else if (this.isDeleting && this.charIndex === 0) {
      this.isDeleting = false;
      this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
      speed = 500;
    }

    setTimeout(() => this.type(), speed);
  }
}

// ===== CUSTOM CURSOR =====
class CustomCursor {
  constructor() {
    this.cursor = document.getElementById('cursor');
    this.dot = this.cursor.querySelector('.cursor-dot');
    this.ring = this.cursor.querySelector('.cursor-ring');
    this.pos = { x: 0, y: 0 };
    this.dotPos = { x: 0, y: 0 };
    this.ringPos = { x: 0, y: 0 };
    this.init();
  }

  init() {
    if (window.innerWidth <= 768) return;

    document.addEventListener('mousemove', (e) => {
      this.pos.x = e.clientX;
      this.pos.y = e.clientY;
    });

    const hoverElements = document.querySelectorAll('a, button, .capability-card, .gallery-item, input, textarea, select');
    hoverElements.forEach(el => {
      el.addEventListener('mouseenter', () => this.cursor.classList.add('hovering'));
      el.addEventListener('mouseleave', () => this.cursor.classList.remove('hovering'));
    });

    this.animate();
  }

  animate() {
    this.dotPos.x += (this.pos.x - this.dotPos.x) * 0.3;
    this.dotPos.y += (this.pos.y - this.dotPos.y) * 0.3;
    this.ringPos.x += (this.pos.x - this.ringPos.x) * 0.12;
    this.ringPos.y += (this.pos.y - this.ringPos.y) * 0.12;

    this.dot.style.left = this.dotPos.x + 'px';
    this.dot.style.top = this.dotPos.y + 'px';
    this.ring.style.left = this.ringPos.x + 'px';
    this.ring.style.top = this.ringPos.y + 'px';

    requestAnimationFrame(() => this.animate());
  }
}

// ===== SCROLL REVEAL =====
class ScrollReveal {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.15;
    this.rootMargin = options.rootMargin || '0px 0px -50px 0px';
    this.init();
  }

  init() {
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: this.threshold,
        rootMargin: this.rootMargin,
      });

      reveals.forEach(el => observer.observe(el));
    } else {
      reveals.forEach(el => el.classList.add('visible'));
    }
  }
}

// ===== COUNTER ANIMATION =====
class CounterAnimation {
  constructor() {
    this.counters = document.querySelectorAll('.counter');
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      this.counters.forEach(counter => observer.observe(counter));
    }
  }

  animateCounter(el) {
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = Math.floor(eased * target);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target;
      }
    };

    requestAnimationFrame(step);
  }
}

// ===== PARALLAX ON SCROLL =====
class ParallaxEffect {
  constructor() {
    this.init();
  }

  init() {
    const parallaxElements = document.querySelectorAll('.parallax-layer');

    window.addEventListener('scroll', () => {
      const scrollY = window.pageYOffset;

      parallaxElements.forEach(el => {
        const speed = parseFloat(el.dataset.speed) || 0.5;
        const yPos = -(scrollY * speed);
        el.style.transform = `translateY(${yPos}px)`;
      });
    });
  }
}

// ===== MAGNETIC BUTTONS =====
class MagneticEffect {
  constructor() {
    this.buttons = document.querySelectorAll('.magnetic');
    this.strength = 0.3;
    this.init();
  }

  init() {
    this.buttons.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * this.strength}px, ${y * this.strength}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
      });
    });
  }
}

// ===== TILT EFFECT ON CARDS =====
class TiltEffect {
  constructor() {
    this.cards = document.querySelectorAll('.capability-card');
    this.init();
  }

  init() {
    this.cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 15;
        const rotateY = (centerX - x) / 15;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
      });
    });
  }
}

// ===== FLOATING PARTICLES =====
class FloatingParticles {
  constructor(count = 20) {
    this.particles = [];
    this.count = count;
    this.init();
  }

  init() {
    for (let i = 0; i < this.count; i++) {
      this.createParticle();
    }
  }

  createParticle() {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    const size = Math.random() * 4 + 1;
    const colors = ['rgba(168, 85, 247, 0.3)', 'rgba(6, 182, 212, 0.3)', 'rgba(236, 72, 153, 0.2)'];

    particle.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}vw;
      top: ${Math.random() * 100}vh;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation: particle-float ${Math.random() * 20 + 15}s linear infinite;
      animation-delay: ${Math.random() * -20}s;
    `;

    document.body.appendChild(particle);
  }
}

// Add particle animation to effects.css dynamically
const particleStyle = document.createElement('style');
particleStyle.textContent = `
  @keyframes particle-float {
    0% {
      transform: translateY(0) translateX(0) rotate(0deg);
      opacity: 0;
    }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% {
      transform: translateY(-100vh) translateX(${Math.random() > 0.5 ? '' : '-'}${Math.random() * 200}px) rotate(360deg);
      opacity: 0;
    }
  }
`;
document.head.appendChild(particleStyle);

// ===== SMOOTH SECTION HIGHLIGHTING =====
class SectionHighlight {
  constructor() {
    this.sections = document.querySelectorAll('section[id]');
    this.navLinks = document.querySelectorAll('.nav-link');
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            this.navLinks.forEach(link => {
              link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
            });
          }
        });
      }, { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' });

      this.sections.forEach(section => observer.observe(section));
    }
  }
}

// ===== INITIALIZE ALL EFFECTS =====
document.addEventListener('DOMContentLoaded', () => {
  // Typing animation
  const typingEl = document.getElementById('typingText');
  if (typingEl) {
    new TypingEffect(typingEl, [
      'Where human creativity meets machine intelligence.',
      'Pushing the boundaries of what\'s possible.',
      'Transforming ideas into reality.',
      'The future of thinking is here.',
      'Intelligence without limits.',
    ], 55, 30, 2500);
  }

  // Custom cursor
  new CustomCursor();

  // Scroll reveal
  new ScrollReveal({ threshold: 0.12 });

  // Counter animation
  new CounterAnimation();

  // Parallax
  new ParallaxEffect();

  // Magnetic buttons
  new MagneticEffect();

  // Tilt effect on capability cards
  new TiltEffect();

  // Floating particles
  new FloatingParticles(25);

  // Section highlighting
  new SectionHighlight();
});
