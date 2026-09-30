(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // A quiet, responsive starfield keeps the whole world feeling alive.
  const canvas = document.getElementById("starfield");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let stars = [];
    let width = 0;
    let height = 0;
    let pointer = { x: -9999, y: -9999 };
    const starCount = () => Math.min(95, Math.max(32, Math.floor((width * height) / 17500)));

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      stars = Array.from({ length: starCount() }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.3 + 0.25,
        speed: Math.random() * 0.16 + 0.025,
        alpha: Math.random() * 0.56 + 0.12,
        tint: Math.random() > 0.86 ? "215,255,57" : Math.random() > 0.73 ? "159,130,255" : "235,233,223"
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (const star of stars) {
        const dx = pointer.x - star.x;
        const dy = pointer.y - star.y;
        const distance = Math.hypot(dx, dy);
        const near = distance < 125;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius + (near ? .55 : 0), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${star.tint}, ${star.alpha + (near ? .2 : 0)})`;
        ctx.fill();
        if (near) {
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(star.x + dx * .055, star.y + dy * .055);
          ctx.strokeStyle = `rgba(${star.tint}, .18)`;
          ctx.lineWidth = .55;
          ctx.stroke();
        }
        if (!reduceMotion) {
          star.y -= star.speed;
          if (star.y < -3) { star.y = height + 3; star.x = Math.random() * width; }
        }
      }
      if (!reduceMotion) requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", event => { pointer = { x: event.clientX, y: event.clientY }; }, { passive: true });
  }

  // Text and panels arrive as the visitor earns them by scrolling.
  const reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(item => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .1, rootMargin: "0px 0px -35px" });
    reveals.forEach(item => observer.observe(item));
  }

  // Cursor and lightly magnetic controls on pointer devices.
  if (window.matchMedia("(pointer: fine)").matches) {
    const dot = document.querySelector(".cursor-dot");
    const ring = document.querySelector(".cursor-ring");
    let ringX = -100;
    let ringY = -100;
    let targetX = -100;
    let targetY = -100;

    window.addEventListener("pointermove", event => {
      targetX = event.clientX;
      targetY = event.clientY;
      dot.style.transform = `translate(${targetX}px, ${targetY}px)`;
      dot.style.opacity = "1";
      ring.style.opacity = "1";
    }, { passive: true });

    function followCursor() {
      ringX += (targetX - ringX) * .17;
      ringY += (targetY - ringY) * .17;
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      requestAnimationFrame(followCursor);
    }
    followCursor();

    document.querySelectorAll("a, button, input, textarea").forEach(item => {
      item.addEventListener("pointerenter", () => ring.classList.add("is-hover"));
      item.addEventListener("pointerleave", () => ring.classList.remove("is-hover"));
    });

    document.querySelectorAll(".magnetic").forEach(item => {
      item.addEventListener("pointermove", event => {
        const bounds = item.getBoundingClientRect();
        const x = event.clientX - bounds.left - bounds.width / 2;
        const y = event.clientY - bounds.top - bounds.height / 2;
        item.style.transform = `translate(${x * .11}px, ${y * .11}px)`;
      });
      item.addEventListener("pointerleave", () => { item.style.transform = ""; });
    });
  }

  // Simple close-on-navigate mobile navigation.
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const opened = nav.classList.toggle("is-open");
      toggle.classList.toggle("is-open", opened);
      toggle.setAttribute("aria-expanded", String(opened));
      toggle.setAttribute("aria-label", opened ? "Close navigation" : "Open navigation");
      document.body.style.overflow = opened ? "hidden" : "";
    });
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }));
  }

  // Experiments can be filtered without a page reload.
  const filters = document.querySelectorAll(".filter");
  const cards = document.querySelectorAll(".lab-card");
  filters.forEach(filter => {
    filter.addEventListener("click", () => {
      const requested = filter.dataset.filter;
      filters.forEach(item => item.classList.toggle("active", item === filter));
      cards.forEach(card => {
        const visible = requested === "all" || card.dataset.category === requested;
        card.classList.toggle("is-hidden", !visible);
      });
    });
  });

  // Contact is an intentionally self-contained demo rather than a fake network submission.
  const form = document.querySelector(".signal-form");
  if (form) {
    const status = form.querySelector(".form-status");
    form.addEventListener("submit", event => {
      event.preventDefault();
      const name = new FormData(form).get("name")?.toString().trim();
      status.textContent = name ? `Signal received, ${name}. We’ll find you in the static.` : "Signal received. We’ll find you in the static.";
      form.reset();
    });
  }

  // The hero core responds with a barely-there parallax shift.
  const orbScene = document.querySelector(".orb-scene");
  if (orbScene && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", event => {
      const x = (event.clientX / window.innerWidth - .5) * 14;
      const y = (event.clientY / window.innerHeight - .5) * 14;
      orbScene.style.margin = `${y}px 0 0 ${x}px`;
    }, { passive: true });
  }
})();
