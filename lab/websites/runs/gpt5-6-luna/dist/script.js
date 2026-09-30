(() => {
  'use strict';

  const body = document.body;
  const pages = [...document.querySelectorAll('.page')];
  const routeLinks = [...document.querySelectorAll('[data-route]')];
  const validRoutes = new Set(pages.map((page) => page.dataset.page));
  const cursorDot = document.querySelector('#cursor-dot');
  const cursorRing = document.querySelector('#cursor-ring');
  const header = document.querySelector('.site-header');
  let activeRoute = 'home';
  let cursor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let ring = { x: cursor.x, y: cursor.y };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  function observeActivePage() {
    const activePage = document.querySelector('.page.is-active');
    activePage?.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
    activePage?.querySelectorAll('[data-counter]').forEach((element) => counterObserver.observe(element));
  }

  function activateRoute(route, updateUrl = true) {
    const nextRoute = validRoutes.has(route) ? route : 'home';
    activeRoute = nextRoute;
    pages.forEach((page) => page.classList.toggle('is-active', page.dataset.page === nextRoute));
    routeLinks.forEach((link) => {
      link.classList.toggle('is-active', link.dataset.route === nextRoute);
      if (link.matches('.nav-link')) link.setAttribute('aria-current', link.dataset.route === nextRoute ? 'page' : 'false');
    });
    if (updateUrl && window.location.hash !== `#${nextRoute}`) history.pushState({}, '', `#${nextRoute}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
    closeMobileMenu();
    window.setTimeout(observeActivePage, 70);
  }

  routeLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = link.dataset.route;
      if (!target) return;
      event.preventDefault();
      activateRoute(target);
    });
  });

  window.addEventListener('hashchange', () => activateRoute(window.location.hash.slice(1), false));

  const menuToggle = document.querySelector('#menu-toggle');
  const mobileMenu = document.querySelector('#mobile-menu');
  function closeMobileMenu() {
    menuToggle?.classList.remove('is-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    mobileMenu?.classList.remove('is-open');
    mobileMenu?.setAttribute('aria-hidden', 'true');
    body.classList.remove('menu-open');
  }
  menuToggle?.addEventListener('click', () => {
    const isOpen = menuToggle.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    mobileMenu.classList.toggle('is-open', isOpen);
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    body.classList.toggle('menu-open', isOpen);
  });

  document.querySelectorAll('[data-scroll-to]').forEach((button) => {
    button.addEventListener('click', () => document.getElementById(button.dataset.scrollTo)?.scrollIntoView({ behavior: 'smooth' }));
  });

  function updateScrollState() {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
    document.querySelector('#scroll-progress').style.width = `${progress}%`;
    header?.classList.toggle('is-scrolled', window.scrollY > 18);
  }
  window.addEventListener('scroll', updateScrollState, { passive: true });
  updateScrollState();

  if (window.matchMedia('(pointer: fine)').matches) {
    body.classList.add('cursor-ready');
    window.addEventListener('pointermove', (event) => {
      cursor.x = event.clientX;
      cursor.y = event.clientY;
      cursorDot.style.left = `${cursor.x}px`;
      cursorDot.style.top = `${cursor.y}px`;
    }, { passive: true });

    const cursorLoop = () => {
      ring.x += (cursor.x - ring.x) * .17;
      ring.y += (cursor.y - ring.y) * .17;
      cursorRing.style.left = `${ring.x}px`;
      cursorRing.style.top = `${ring.y}px`;
      requestAnimationFrame(cursorLoop);
    };
    cursorLoop();

    document.querySelectorAll('a, button, [data-tilt]').forEach((element) => {
      element.addEventListener('mouseenter', () => body.classList.add('cursor-hover'));
      element.addEventListener('mouseleave', () => body.classList.remove('cursor-hover'));
    });

    document.querySelectorAll('.magnetic').forEach((element) => {
      element.addEventListener('pointermove', (event) => {
        const box = element.getBoundingClientRect();
        const x = (event.clientX - box.left - box.width / 2) * .16;
        const y = (event.clientY - box.top - box.height / 2) * .16;
        element.style.transform = `translate(${x}px, ${y}px)`;
      });
      element.addEventListener('pointerleave', () => { element.style.transform = ''; });
    });

    document.querySelectorAll('[data-tilt]').forEach((element) => {
      element.addEventListener('pointermove', (event) => {
        const box = element.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - .5;
        const y = (event.clientY - box.top) / box.height - .5;
        element.style.transform = `perspective(900px) rotateY(${x * 5}deg) rotateX(${y * -5}deg) translateZ(4px)`;
      });
      element.addEventListener('pointerleave', () => { element.style.transform = ''; });
    });
  }

  const engineDetails = {
    perception: { number: '01', coordinate: '04.82 / 91.07', readout: 'reading the visible world', title: 'It sees the<br /><em>shape</em> of things.', description: 'Before an answer, there is attention. AI can read a room, find a rhythm, trace the gesture inside an image — and make the invisible available to us.' },
    reasoning: { number: '02', coordinate: '18.44 / 73.29', readout: 'connecting the hidden thread', title: 'It finds the<br /><em>throughline.</em>', description: 'Facts become relationships. Relationships become possibilities. The system moves through the space between what is known and what could be true.' },
    creation: { number: '03', coordinate: '62.19 / 28.64', readout: 'making the unreal tangible', title: 'It gives ideas<br /><em>a body.</em>', description: 'The gap between having an idea and holding it in your hands gets wonderfully, radically small. Creation becomes a conversation.' },
    memory: { number: '04', coordinate: '80.02 / 12.55', readout: 'holding the useful past', title: 'It keeps the<br /><em>echo.</em>', description: 'Memory is not a vault. It is context — the texture that lets a system meet you where you are and carry the thread forward.' }
  };
  const detailNumber = document.querySelector('.engine-detail__number');
  const detailTitle = document.querySelector('.engine-detail h2');
  const detailDescription = document.querySelector('#engine-description');
  const detailCoordinate = document.querySelector('#engine-coordinate');
  const detailReadout = document.querySelector('#engine-readout');
  document.querySelectorAll('[data-engine]').forEach((node) => {
    node.addEventListener('click', () => {
      const data = engineDetails[node.dataset.engine];
      if (!data) return;
      document.querySelectorAll('[data-engine]').forEach((item) => item.classList.toggle('is-selected', item === node));
      [detailNumber, detailTitle, detailDescription, detailCoordinate, detailReadout].forEach((element) => element?.classList.add('is-changing'));
      window.setTimeout(() => {
        detailNumber.textContent = data.number;
        detailTitle.innerHTML = data.title;
        detailDescription.textContent = data.description;
        detailCoordinate.textContent = data.coordinate;
        detailReadout.textContent = data.readout;
        [detailNumber, detailTitle, detailDescription, detailCoordinate, detailReadout].forEach((element) => element?.classList.remove('is-changing'));
      }, 220);
    });
  });

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      const value = element.dataset.counter;
      if (value === '∞') { element.textContent = '∞'; counterObserver.unobserve(element); return; }
      const target = Number(value);
      let start = 0;
      const duration = 1200;
      const startTime = performance.now();
      const tick = (time) => {
        const progress = Math.min((time - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.floor(start + (target - start) * eased);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counterObserver.unobserve(element);
    });
  }, { threshold: .8 });

  const promptInput = document.querySelector('#prompt-input');
  const promptForm = document.querySelector('#prompt-form');
  const outputText = document.querySelector('#output-text');
  const outputArt = document.querySelector('#output-art');
  const generateButton = document.querySelector('.generate-button');
  const promptResponses = [
    'A garden of soft machines, growing light instead of leaves. Their roots remember every hand that has ever reached for them.',
    'The city wakes in layers: first the windows, then the streets, then the quiet intelligence beneath every door.',
    'A new kind of weather arrives — made of shared attention, moving through the room like a warm current.',
    'Keep the strange parts. They are usually where the future is hiding.'
  ];
  let responseIndex = 0;

  document.querySelectorAll('[data-seed]').forEach((seed) => {
    seed.addEventListener('click', () => {
      promptInput.value = seed.dataset.seed;
      promptInput.focus();
      promptInput.style.height = 'auto';
      promptInput.style.height = `${promptInput.scrollHeight}px`;
    });
  });
  document.querySelectorAll('[data-style]').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-style]').forEach((item) => item.classList.toggle('is-active', item === chip));
      outputArt.dataset.style = chip.dataset.style;
    });
  });
  promptForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    generateButton.classList.add('is-generating');
    generateButton.querySelector('span').textContent = 'Finding signal…';
    outputArt.classList.add('is-refreshing');
    await wait(700);
    responseIndex = (responseIndex + 1) % promptResponses.length;
    outputText.textContent = promptResponses[responseIndex];
    generateButton.querySelector('span').textContent = 'Generate signal';
    generateButton.classList.remove('is-generating');
    outputArt.classList.remove('is-refreshing');
  });
  document.querySelector('#copy-result')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    try { await navigator.clipboard.writeText(outputText.textContent); } catch { /* Clipboard is optional in local previews. */ }
    button.textContent = 'Copied / ✓';
    window.setTimeout(() => { button.textContent = 'Copy result'; }, 1600);
  });

  // A small, ambient constellation gives the background a responsive sense of depth.
  const canvas = document.querySelector('#particle-canvas');
  const ctx = canvas.getContext('2d');
  const pointer = { x: -1000, y: -1000 };
  let particles = [];
  let canvasWidth = 0;
  let canvasHeight = 0;
  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth * ratio;
    canvas.height = canvasHeight * ratio;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.min(115, Math.max(42, Math.floor(canvasWidth / 12)));
    particles = Array.from({ length: count }, () => ({ x: Math.random() * canvasWidth, y: Math.random() * canvasHeight, vx: (Math.random() - .5) * .11, vy: (Math.random() - .5) * .11, radius: Math.random() * 1.5 + .35, hue: Math.random() > .72 ? 145 : Math.random() > .45 ? 225 : 265 }));
  }
  function drawParticles() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    particles.forEach((particle, index) => {
      particle.x += particle.vx; particle.y += particle.vy;
      if (particle.x < -10 || particle.x > canvasWidth + 10) particle.vx *= -1;
      if (particle.y < -10 || particle.y > canvasHeight + 10) particle.vy *= -1;
      const dx = pointer.x - particle.x; const dy = pointer.y - particle.y; const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 130) { particle.x -= dx * .0009; particle.y -= dy * .0009; }
      ctx.beginPath(); ctx.fillStyle = `hsla(${particle.hue}, 80%, 78%, .7)`; ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2); ctx.fill();
      for (let next = index + 1; next < particles.length; next += 1) {
        const other = particles[next]; const x = particle.x - other.x; const y = particle.y - other.y; const distanceBetween = Math.sqrt(x * x + y * y);
        if (distanceBetween < 105) { ctx.beginPath(); ctx.strokeStyle = `rgba(143,123,255,${(1 - distanceBetween / 105) * .12})`; ctx.lineWidth = .5; ctx.moveTo(particle.x, particle.y); ctx.lineTo(other.x, other.y); ctx.stroke(); }
      }
    });
    requestAnimationFrame(drawParticles);
  }
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('pointermove', (event) => { pointer.x = event.clientX; pointer.y = event.clientY; }, { passive: true });
  resizeCanvas(); drawParticles();

  // Set up the first view after the entry animation has had time to breathe.
  const initialRoute = window.location.hash.slice(1);
  activateRoute(validRoutes.has(initialRoute) ? initialRoute : 'home', false);
  wait(850).then(() => {
    body.classList.remove('is-loading');
    document.querySelector('#preloader')?.classList.add('is-done');
    observeActivePage();
  });
})();
