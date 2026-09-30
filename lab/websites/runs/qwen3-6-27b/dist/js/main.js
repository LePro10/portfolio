// ===== LOADING SCREEN =====
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  setTimeout(() => {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 600);
  }, 1500);
});

// ===== NAVBAR SCROLL BEHAVIOR =====
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;

  if (currentScroll > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  lastScroll = currentScroll;
});

// ===== MOBILE NAVIGATION =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });
}

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const offsetTop = target.offsetTop - 60;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
    }
  });
});

// ===== CONTACT FORM HANDLING =====
const contactForm = document.getElementById('contactForm');

if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const btn = this.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    btn.innerHTML = `
      <span>Sending...</span>
      <svg viewBox="0 0 24 24" width="20" height="20" style="animation: spin 1s linear infinite">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="30 30" stroke-linecap="round"/>
      </svg>
    `;
    btn.disabled = true;

    setTimeout(() => {
      this.classList.add('success');
      btn.innerHTML = `
        <span>Message Sent!</span>
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      `;

      setTimeout(() => {
        this.classList.remove('success');
        btn.innerHTML = originalText;
        btn.disabled = false;
        this.reset();
      }, 3000);
    }, 1500);
  });
}

// Add spin animation for loading state
const spinStyle = document.createElement('style');
spinStyle.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(spinStyle);

// ===== NAVBAR HIDE ON SCROLL DOWN, SHOW ON SCROLL UP =====
let prevScrollPos = window.pageYOffset;
let isScrolling;

window.addEventListener('scroll', () => {
  clearTimeout(isScrolling);

  const currentScrollPos = window.pageYOffset;

  if (currentScrollPos > 100) {
    if (prevScrollPos > currentScrollPos) {
      navbar.style.transform = 'translateY(0)';
    } else {
      navbar.style.transform = 'translateY(-100%)';
    }
  } else {
    navbar.style.transform = 'translateY(0)';
  }

  prevScrollPos = currentScrollPos;

  isScrolling = setTimeout(() => {
    navbar.style.transform = 'translateY(0)';
  }, 150);
});

// ===== ACTIVE NAV LINK HIGHLIGHTING ON SCROLL =====
function highlightNavOnScroll() {
  const sections = document.querySelectorAll('section[id]');
  const scrollY = window.pageYOffset;

  sections.forEach(section => {
    const sectionTop = section.offsetTop - 100;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute('id');

    if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
          link.classList.add('active');
        }
      });
    }
  });
}

window.addEventListener('scroll', highlightNavOnScroll);

// ===== INTERSECTION OBSERVER FOR NAV HIGHLIGHT =====
if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        document.querySelectorAll('.nav-link').forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, {
    threshold: 0,
    rootMargin: '-80px 0px -60% 0px',
  });

  document.querySelectorAll('section[id]').forEach(section => {
    navObserver.observe(section);
  });
}

// ===== KEYBOARD NAVIGATION ENHANCEMENT =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (navLinks && navLinks.classList.contains('open')) {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
    }
  }
});

// ===== PERFORMANCE: REDUCE ANIMATIONS FOR PREFERS-REDUCED-MOTION =====
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (prefersReducedMotion.matches) {
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
    el.classList.add('visible');
    el.style.transition = 'none';
  });

  document.querySelectorAll('.particle').forEach(el => {
    el.style.animation = 'none';
  });
}

// ===== CONSOLE EASTER EGG =====
console.log('%c🧠 Neural Horizons', 'font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #a855f7, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;');
console.log('%cBuilt with passion and clean code.', 'font-size: 14px; color: #a0a0b5;');
