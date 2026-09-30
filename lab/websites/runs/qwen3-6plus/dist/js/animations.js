document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  // Loading screen
  const loader = document.getElementById('loading-screen');
  if (loader) {
    const tl = gsap.timeline();
    tl.to(loader, {
      opacity: 0,
      duration: 0.8,
      delay: 1.5,
      ease: 'power2.inOut',
      onComplete: () => {
        loader.style.display = 'none';
        animateHero();
      }
    });
  } else {
    animateHero();
  }

  function animateHero() {
    const heroBadge = document.querySelector('.hero-badge');
    const heroTitle = document.querySelector('.hero-title');
    const heroDesc = document.querySelector('.hero-description');
    const heroButtons = document.querySelector('.hero-buttons');

    if (heroBadge) {
      gsap.from(heroBadge, { opacity: 0, y: 30, duration: 0.8, delay: 0.2 });
    }
    if (heroTitle) {
      gsap.from(heroTitle, { opacity: 0, y: 50, duration: 1, delay: 0.4, ease: 'power3.out' });
    }
    if (heroDesc) {
      gsap.from(heroDesc, { opacity: 0, y: 40, duration: 0.8, delay: 0.6 });
    }
    if (heroButtons) {
      gsap.from(heroButtons, { opacity: 0, y: 30, duration: 0.8, delay: 0.8 });
    }
  }

  // Section title animations
  gsap.utils.toArray('.section-title').forEach(title => {
    gsap.from(title, {
      scrollTrigger: {
        trigger: title,
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      opacity: 0,
      y: 50,
      duration: 1,
      ease: 'power3.out'
    });
  });

  gsap.utils.toArray('.section-subtitle').forEach(subtitle => {
    gsap.from(subtitle, {
      scrollTrigger: {
        trigger: subtitle,
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      },
      opacity: 0,
      y: 30,
      duration: 0.8,
      delay: 0.2
    });
  });

  // Card stagger animations
  gsap.utils.toArray('.capabilities-grid, .stats-grid, .showcase-grid').forEach(grid => {
    const cards = grid.children;
    gsap.from(cards, {
      scrollTrigger: {
        trigger: grid,
        start: 'top 75%',
        toggleActions: 'play none none reverse'
      },
      opacity: 0,
      y: 60,
      stagger: 0.15,
      duration: 0.8,
      ease: 'power3.out'
    });
  });

  // About section parallax
  const aboutImage = document.querySelector('.about-image');
  const aboutContent = document.querySelector('.about-content');

  if (aboutImage) {
    gsap.from(aboutImage, {
      scrollTrigger: {
        trigger: aboutImage,
        start: 'top 80%',
        end: 'bottom 20%',
        scrub: 1
      },
      x: -100,
      opacity: 0.5
    });
  }

  if (aboutContent) {
    gsap.from(aboutContent, {
      scrollTrigger: {
        trigger: aboutContent,
        start: 'top 80%',
        end: 'bottom 20%',
        scrub: 1
      },
      x: 100,
      opacity: 0.5
    });
  }

  // Timeline animations
  gsap.utils.toArray('.timeline-item').forEach((item, i) => {
    gsap.from(item, {
      scrollTrigger: {
        trigger: item,
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      opacity: 0,
      x: i % 2 === 0 ? -50 : 50,
      duration: 0.8,
      ease: 'power3.out'
    });
  });

  // Stat counter animation
  gsap.utils.toArray('.stat-number').forEach(stat => {
    const target = parseInt(stat.textContent);
    const suffix = stat.textContent.replace(/[0-9]/g, '');

    ScrollTrigger.create({
      trigger: stat,
      start: 'top 85%',
      onEnter: () => {
        gsap.to(stat, {
          duration: 2,
          ease: 'power2.out',
          onUpdate: function() {
            const progress = this.progress();
            stat.textContent = Math.floor(target * progress) + suffix;
          }
        });
      },
      once: true
    });
  });

  // Contact form animation
  const formGroups = document.querySelectorAll('.form-group');
  formGroups.forEach((group, i) => {
    gsap.from(group, {
      scrollTrigger: {
        trigger: group,
        start: 'top 90%',
        toggleActions: 'play none none reverse'
      },
      opacity: 0,
      x: -30,
      duration: 0.6,
      delay: i * 0.1
    });
  });

  // Showcase filter animations
  const filterBtns = document.querySelectorAll('.filter-btn');
  const showcaseItems = document.querySelectorAll('.showcase-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      showcaseItems.forEach(item => {
        const category = item.dataset.category;

        if (filter === 'all' || category === filter) {
          item.classList.remove('hidden');
          gsap.fromTo(item, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' });
        } else {
          gsap.to(item, {
            opacity: 0,
            scale: 0.8,
            duration: 0.3,
            onComplete: () => item.classList.add('hidden')
          });
        }
      });
    });
  });

  // Parallax backgrounds
  gsap.utils.toArray('.about-section::before, .capabilities-section::before, .contact-section::before').forEach(bg => {
    gsap.to(bg, {
      scrollTrigger: {
        trigger: bg.parentElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      },
      y: -100
    });
  });

  // Magnetic button effect
  document.querySelectorAll('.btn').forEach(btn => {
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

  // 3D card tilt effect
  document.querySelectorAll('.capability-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const rotateX = (y - 0.5) * -20;
      const rotateY = (x - 0.5) * 20;

      gsap.to(card, {
        rotateX: rotateX,
        rotateY: rotateY,
        duration: 0.3,
        ease: 'power2.out',
        transformPerspective: 1000
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)'
      });
    });
  });

  // Text reveal animation
  gsap.utils.toArray('.reveal-text').forEach(text => {
    gsap.from(text, {
      scrollTrigger: {
        trigger: text,
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      },
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: 'power3.out'
    });
  });
});
