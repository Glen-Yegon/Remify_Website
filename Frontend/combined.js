/* =========================================================
   REMIFY — CUSTOM CURSOR + SCROLL PROGRESS
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* =========================================================
     REMIFY SPARK CURSOR
     ========================================================= */

  const cursorSpark = document.getElementById('cursorSpark');
  const cursorTrail = document.getElementById('cursorTrail');

  const isFinePointer =
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (isFinePointer && cursorSpark && cursorTrail) {

    const ctx = cursorTrail.getContext('2d');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    let currentX = mouseX;
    let currentY = mouseY;

    const trail = [];
    const TRAIL_LENGTH = 24;

    function resizeCursorCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cursorTrail.width = window.innerWidth * dpr;
      cursorTrail.height = window.innerHeight * dpr;
      cursorTrail.style.width = `${window.innerWidth}px`;
      cursorTrail.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resizeCursorCanvas();
    window.addEventListener('resize', resizeCursorCanvas, { passive: true });

    window.addEventListener('mousemove', (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    }, { passive: true });

    function drawTrail() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      trail.push({ x: currentX, y: currentY });
      if (trail.length > TRAIL_LENGTH) trail.shift();
      if (trail.length < 2) return;

      for (let i = 1; i < trail.length; i++) {
        const previous = trail[i - 1];
        const point = trail[i];
        const progress = i / trail.length;
        const opacity = progress * 0.32;
        const width = progress * 3.2;

        ctx.beginPath();
        ctx.moveTo(previous.x, previous.y);
        ctx.lineTo(point.x, point.y);
        ctx.strokeStyle = `rgba(41, 0, 82, ${opacity})`;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }

    function animateCursor() {
      currentX += (mouseX - currentX) * 0.24;
      currentY += (mouseY - currentY) * 0.24;

      cursorSpark.style.left = `${currentX}px`;
      cursorSpark.style.top = `${currentY}px`;

      drawTrail();
      requestAnimationFrame(animateCursor);
    }

    animateCursor();

    document
      .querySelectorAll('a, button, input, textarea, select, [role="button"]')
      .forEach((element) => {
        element.addEventListener('mouseenter', () => {
          cursorSpark.classList.add('cursor-spark--active');
        });
        element.addEventListener('mouseleave', () => {
          cursorSpark.classList.remove('cursor-spark--active');
        });
      });

    window.addEventListener('mousedown', () => {
      cursorSpark.classList.add('cursor-spark--click');
    });

    window.addEventListener('mouseup', () => {
      cursorSpark.classList.remove('cursor-spark--click');
    });
  }

  /* =========================================================
     SCROLL PROGRESS
     ========================================================= */

  const scrollFill = document.getElementById('scrollFill');

  if (scrollFill) {
    const updateScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      scrollFill.style.transform = `scaleY(${progress})`;
    };

    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();
  }

});

  /* =========================================================
     HAMBURGER NAV OVERLAY
     ========================================================= */

  const menuToggle = document.getElementById('menuToggle');
  const navOverlay = document.getElementById('navOverlay');

  if (menuToggle && navOverlay) {

    const openMenu = () => {
      navOverlay.classList.add('is-open');
      navOverlay.setAttribute('aria-hidden', 'false');
      menuToggle.classList.add('is-active');
      menuToggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-open');
      if (window.remifyLenis) window.remifyLenis.stop();
    };

    const closeMenu = () => {
      navOverlay.classList.remove('is-open');
      navOverlay.setAttribute('aria-hidden', 'true');
      menuToggle.classList.remove('is-active');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
      if (window.remifyLenis) window.remifyLenis.start();
    };

    menuToggle.addEventListener('click', () => {
      navOverlay.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    navOverlay.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navOverlay.classList.contains('is-open')) {
        closeMenu();
      }
    });
  }