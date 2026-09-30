/* ========================================
   SYNAPSE - Main JavaScript
   Shared functionality & utilities
   ======================================== */

// ========================================
// CUSTOM CURSOR
// ========================================
class CustomCursor {
  constructor() {
    this.cursor = document.querySelector('.cursor');
    this.trails = [];
    this.mouseX = 0;
    this.mouseY = 0;
    this.cursorX = 0;
    this.cursorY = 0;
    this.isTouch = window.matchMedia('(pointer: coarse)').matches;
    
    if (!this.cursor || this.isTouch) return;
    
    // Create trail elements
    for (let i = 0; i < 5; i++) {
      const trail = document.createElement('div');
      trail.className = 'cursor-trail';
      trail.style.opacity = (0.5 - i * 0.1).toString();
      document.body.appendChild(trail);
      this.trails.push({
        el: trail,
        x: 0,
        y: 0
      });
    }
    
    this.init();
  }
  
  init() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    
    // Magnetic effect for links and buttons
    const interactiveElements = document.querySelectorAll('a, button, .btn, .nav-links a');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        this.cursor.classList.add('hover');
      });
      el.addEventListener('mouseleave', () => {
        this.cursor.classList.remove('hover');
      });
    });
    
    this.animate();
  }
  
  animate() {
    // Smooth follow for main cursor
    this.cursorX += (this.mouseX - this.cursorX) * 0.15;
    this.cursorY += (this.mouseY - this.cursorY) * 0.15;
    
    this.cursor.style.left = this.cursorX + 'px';
    this.cursor.style.top = this.cursorY + 'px';
    
    // Trail effect
    let prevX = this.cursorX;
    let prevY = this.cursorY;
    
    this.trails.forEach((trail, i) => {
      trail.x += (prevX - trail.x) * (0.15 - i * 0.02);
      trail.y += (prevY - trail.y) * (0.15 - i * 0.02);
      
      trail.el.style.left = trail.x + 'px';
      trail.el.style.top = trail.y + 'px';
      
      prevX = trail.x;
      prevY = trail.y;
    });
    
    requestAnimationFrame(() => this.animate());
  }
}

// ========================================
// SMOOTH SCROLL (Lenis)
// ========================================
let lenis;

function initSmoothScroll() {
  if (typeof Lenis === 'undefined') return;
  
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 2,
  });
  
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  
  requestAnimationFrame(raf);
  
  // Connect Lenis to GSAP ScrollTrigger if available
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }
}

// ========================================
// NAVIGATION
// ========================================
class Navigation {
  constructor() {
    this.nav = document.querySelector('.nav');
    this.toggle = document.querySelector('.nav-toggle');
    this.links = document.querySelector('.nav-links');
    this.lastScroll = 0;
    
    this.init();
  }
  
  init() {
    // Scroll behavior
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      
      if (currentScroll > 50) {
        this.nav.classList.add('scrolled');
      } else {
        this.nav.classList.remove('scrolled');
      }
      
      this.lastScroll = currentScroll;
    }, { passive: true });
    
    // Mobile toggle
    if (this.toggle) {
      this.toggle.addEventListener('click', () => {
        this.links.classList.toggle('open');
        this.toggle.classList.toggle('active');
      });
    }
    
    // Close mobile menu on link click
    const linkItems = this.links.querySelectorAll('a');
    linkItems.forEach(link => {
      link.addEventListener('click', () => {
        this.links.classList.remove('open');
        this.toggle.classList.remove('active');
      });
    });
    
    // Set active link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    linkItems.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  }
}

// ========================================
// PAGE TRANSITIONS
// ========================================
class PageTransition {
  constructor() {
    this.transition = document.querySelector('.page-transition');
    this.links = document.querySelectorAll('a[href]:not([href^="#"]):not([href^="http"]):not([target="_blank"])');
    
    this.init();
  }
  
  init() {
    this.links.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('http')) {
          e.preventDefault();
          this.transitionTo(href);
        }
      });
    });
  }
  
  transitionTo(href) {
    if (!this.transition) {
      window.location.href = href;
      return;
    }
    
    // Stop smooth scroll
    if (lenis) lenis.stop();
    
    // Activate transition
    this.transition.classList.add('active');
    
    // Random glitch text
    const glitchText = this.transition.querySelector('.glitch-text');
    const phrases = ['INITIALIZING...', 'LOADING NEURAL NET...', 'SYNAPSE FIRING...', 'ACCESSING...'];
    if (glitchText) {
      glitchText.textContent = phrases[Math.floor(Math.random() * phrases.length)];
    }
    
    setTimeout(() => {
      window.location.href = href;
    }, 700);
  }
}

// ========================================
// LOADING SCREEN
// ========================================
class LoadingScreen {
  constructor() {
    this.screen = document.querySelector('.loading-screen');
    this.bar = document.querySelector('.loading-bar-fill');
    this.percent = document.querySelector('.loading-percent');
    this.progress = 0;
    
    if (!this.screen) return;
    
    this.init();
  }
  
  init() {
    // Simulate loading progress
    const interval = setInterval(() => {
      this.progress += Math.random() * 15 + 5;
      if (this.progress >= 100) {
        this.progress = 100;
        clearInterval(interval);
        this.complete();
      }
      
      if (this.bar) {
        this.bar.style.width = this.progress + '%';
      }
      if (this.percent) {
        this.percent.textContent = Math.floor(this.progress) + '%';
      }
    }, 150);
  }
  
  complete() {
    setTimeout(() => {
      this.screen.classList.add('hidden');
      // Trigger entrance animations after load
      if (typeof gsap !== 'undefined') {
        document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
          gsap.to(el, {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              once: true
            }
          });
        });
      }
    }, 500);
  }
}

// ========================================
// GSAP ANIMATIONS INIT
// ========================================
function initGSAPAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  
  gsap.registerPlugin(ScrollTrigger);
  
  // Default reveal animations
  document.querySelectorAll('.reveal').forEach(el => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true
      }
    });
  });
  
  document.querySelectorAll('.reveal-left').forEach(el => {
    gsap.to(el, {
      opacity: 1,
      x: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true
      }
    });
  });
  
  document.querySelectorAll('.reveal-right').forEach(el => {
    gsap.to(el, {
      opacity: 1,
      x: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true
      }
    });
  });
  
  document.querySelectorAll('.reveal-scale').forEach(el => {
    gsap.to(el, {
      opacity: 1,
      scale: 1,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true
      }
    });
  });
  
  // Parallax elements
  document.querySelectorAll('[data-parallax]').forEach(el => {
    const speed = parseFloat(el.dataset.parallax) || 0.5;
    gsap.to(el, {
      yPercent: -20 * speed,
      ease: 'none',
      scrollTrigger: {
        trigger: el.parentElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
  });
}

// ========================================
// MAGNETIC BUTTONS
// ========================================
function initMagneticButtons() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  
  const buttons = document.querySelectorAll('.btn, .nav-logo');
  
  buttons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

// ========================================
// TEXT SCRAMBLE EFFECT
// ========================================
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.originalText = el.textContent;
  }
  
  scramble() {
    const text = this.originalText;
    const length = text.length;
    let iteration = 0;
    
    const interval = setInterval(() => {
      this.el.textContent = text
        .split('')
        .map((char, index) => {
          if (index < iteration) {
            return text[index];
          }
          return this.chars[Math.floor(Math.random() * this.chars.length)];
        })
        .join('');
      
      if (iteration >= length) {
        clearInterval(interval);
      }
      
      iteration += 1 / 3;
    }, 30);
  }
  
  static initForElements(selector) {
    document.querySelectorAll(selector).forEach(el => {
      const scrambler = new TextScramble(el);
      
      // Trigger on scroll
      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 80%',
          once: true,
          onEnter: () => scrambler.scramble()
        });
      } else {
        // Fallback: trigger on load after delay
        setTimeout(() => scrambler.scramble(), 1000);
      }
    });
  }
}

// ========================================
// TYPEWRITER EFFECT
// ========================================
class TypeWriter {
  constructor(el, text, speed = 50) {
    this.el = el;
    this.text = text;
    this.speed = speed;
    this.index = 0;
  }
  
  type() {
    if (this.index < this.text.length) {
      this.el.textContent += this.text.charAt(this.index);
      this.index++;
      setTimeout(() => this.type(), this.speed);
    }
  }
  
  static initForElements(selector) {
    document.querySelectorAll(selector).forEach(el => {
      const text = el.textContent;
      el.textContent = '';
      
      const writer = new TypeWriter(el, text);
      
      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 80%',
          once: true,
          onEnter: () => writer.type()
        });
      } else {
        setTimeout(() => writer.type(), 1500);
      }
    });
  }
}

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  new LoadingScreen();
  new CustomCursor();
  new Navigation();
  new PageTransition();
  initSmoothScroll();
  
  // Delay GSAP init to ensure all elements are ready
  setTimeout(() => {
    initGSAPAnimations();
    initMagneticButtons();
    TextScramble.initForElements('[data-scramble]');
    TypeWriter.initForElements('[data-typewriter]');
  }, 100);
});
