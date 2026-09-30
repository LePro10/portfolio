/* ============================================================
   animations.js — GSAP + ScrollTrigger
   All scroll-driven animations: reveals, pin, horizontal scroll
   ============================================================ */

function initAnimations () {
  gsap.registerPlugin(ScrollTrigger);

  /* ── Nav: scrolled state ─────────────────────────────── */
  const nav = document.getElementById('nav');
  ScrollTrigger.create({
    start: 'top -80',
    onUpdate: self => {
      if (self.progress > 0) nav.classList.add('scrolled');
      else                   nav.classList.remove('scrolled');
    }
  });

  /* ── Hero: entrance cascade ──────────────────────────── */
  const heroItems = gsap.utils.toArray('#hero .reveal-up');
  gsap.fromTo(heroItems, {
    opacity: 0,
    y: 50
  }, {
    opacity: 1,
    y: 0,
    duration: 1,
    stagger: 0.14,
    ease: 'power3.out',
    delay: 0.3
  });

  /* ── What is AI: paragraph fade-ins ─────────────────── */
  gsap.utils.toArray('.wai-p').forEach((p, i) => {
    gsap.fromTo(p,
      { opacity: 0, x: 40 },
      {
        opacity: 1, x: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: p,
          start:   'top 80%',
          end:     'top 40%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  });

  /* SVG lines draw on enter */
  gsap.fromTo('.svg-lines line',
    { strokeDashoffset: 300, strokeDasharray: 300, opacity: 0 },
    {
      strokeDashoffset: 0,
      opacity: 1,
      duration: 1.2,
      stagger: 0.08,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '#what-is-ai',
        start:   'top 70%',
        toggleActions: 'play none none reverse'
      }
    }
  );

  /* ── Timeline: horizontal scroll ────────────────────── */
  _setupTimeline();

  /* ── Capabilities: stagger + tilt ───────────────────── */
  gsap.utils.toArray('.cap-card').forEach((card, i) => {
    gsap.fromTo(card,
      { opacity: 0, y: 60, scale: 0.95 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.7,
        ease: 'power3.out',
        delay: (i % 3) * 0.1,
        scrollTrigger: {
          trigger: card,
          start:   'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  });
  _setupCardTilt();

  /* ── Numbers: entry ──────────────────────────────────── */
  gsap.utils.toArray('.stat-card').forEach((card, i) => {
    gsap.fromTo(card,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0,
        duration: 0.6,
        delay: i * 0.07,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start:   'top 85%',
          onEnter: () => card.classList.add('in-view'),
          toggleActions: 'play none none none'
        }
      }
    );
  });

  /* ── Future section words parallax ──────────────────── */
  gsap.utils.toArray('.fw').forEach(word => {
    const speed = 0.2 + Math.random() * 0.4;
    gsap.to(word, {
      y:    () => -80 * speed,
      ease: 'none',
      scrollTrigger: {
        trigger: '#future',
        start:   'top bottom',
        end:     'bottom top',
        scrub:   true
      }
    });
  });

  /* Future title + sub */
  gsap.fromTo(['.future-title', '.future-sub', '.future-btn'],
    { opacity: 0, y: 60 },
    {
      opacity: 1, y: 0,
      duration: 1,
      stagger: 0.18,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#future',
        start:   'top 65%',
        toggleActions: 'play none none reverse'
      }
    }
  );

  /* ── Contact: glass panel slide ──────────────────────── */
  gsap.fromTo('.contact-glass',
    { opacity: 0, y: 80, scale: 0.97 },
    {
      opacity: 1, y: 0, scale: 1,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#contact',
        start:   'top 75%',
        toggleActions: 'play none none reverse'
      }
    }
  );
}

/* ─────────────────────────────────────────────────────────
   Timeline horizontal scroll
──────────────────────────────────────────────────────────── */
function _setupTimeline () {
  const track   = document.querySelector('.timeline-track');
  const section = document.querySelector('#timeline');
  if (!track || !section) return;

  // wait for layout to compute widths
  requestAnimationFrame(() => {
    const trackW    = track.scrollWidth;
    const wrapW     = document.querySelector('.timeline-track-wrap').offsetWidth;
    const distance  = trackW - wrapW;

    if (distance <= 0) return;

    gsap.to(track, {
      x:    -distance,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start:   'top top',
        end:     () => '+=' + (distance + 200),
        pin:     true,
        scrub:   1,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    /* individual card reveals as they enter view */
    gsap.utils.toArray('.tl-card').forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger:       card,
            containerAnimation: ScrollTrigger.getAll().find(st => st.vars.pin === true),
            start:   'left 90%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });
  });
}

/* ─────────────────────────────────────────────────────────
   3D tilt on capability cards
──────────────────────────────────────────────────────────── */
function _setupCardTilt () {
  document.querySelectorAll('.cap-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect  = card.getBoundingClientRect();
      const cx    = rect.left + rect.width  / 2;
      const cy    = rect.top  + rect.height / 2;
      const rX    = -(e.clientY - cy) / (rect.height / 2) * 14;
      const rY    =  (e.clientX - cx) / (rect.width  / 2) * 14;

      gsap.to(card, {
        rotateX:    rX,
        rotateY:    rY,
        scale:      1.04,
        duration:   0.35,
        ease:       'power2.out',
        transformPerspective: 800
      });

      /* glow follows cursor */
      const glow = card.querySelector('.cap-bg-glow');
      if (glow) {
        glow.style.left    = (e.clientX - rect.left) + 'px';
        glow.style.top     = (e.clientY - rect.top)  + 'px';
        glow.style.opacity = '1';
      }
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0, rotateY: 0, scale: 1,
        duration: 0.6,
        ease: 'elastic.out(1, 0.5)',
        transformPerspective: 800
      });
      const glow = card.querySelector('.cap-bg-glow');
      if (glow) glow.style.opacity = '0';
    });
  });
}
