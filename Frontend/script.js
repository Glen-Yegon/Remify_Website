document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
   STICKY GLASS NAVBAR
   ========================================= */

const navbar = document.getElementById('navbar');

if (navbar) {

  const updateNavbar = () => {

    if (window.scrollY > 40) {
      navbar.classList.add('navbar--scrolled');
    } else {
      navbar.classList.remove('navbar--scrolled');
    }

  };

  window.addEventListener(
    'scroll',
    updateNavbar,
    { passive: true }
  );

  updateNavbar();
}

const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const mobileMenuClose = document.getElementById('mobileMenuClose');

if (navToggle && navLinks) {

  const openMenu = () => {

    navLinks.classList.add('open');

    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Menu open');

    if (mobileMenuClose) {
      mobileMenuClose.classList.add('is-visible');
    }

    document.body.style.overflow = 'hidden';
  };


  const closeMenu = () => {

    navLinks.classList.remove('open');

    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');

    if (mobileMenuClose) {
      mobileMenuClose.classList.remove('is-visible');
    }

    document.body.style.overflow = '';
  };


  navToggle.addEventListener('click', openMenu);


  if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', closeMenu);
  }


  navLinks.querySelectorAll('a').forEach((link) => {

    link.addEventListener('click', closeMenu);

  });

}

  const cartBtn = document.getElementById('cartBtn');
  const cartCount = document.getElementById('cartCount');

  if (cartBtn) {
    cartBtn.addEventListener('click', () => {
      window.location.href = '/cart';
    });
  }

  window.updateCartCount = (count) => {
    if (cartCount) {
      cartCount.textContent = count;
      cartBtn.setAttribute('aria-label', `View cart, ${count} items`);
    }
  };


/* =========================================
   REMIFY SPARK CURSOR
   ========================================= */

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


  /* -----------------------------------------
     CANVAS
     ----------------------------------------- */

  function resizeCursorCanvas() {

    const dpr =
      Math.min(window.devicePixelRatio || 1, 2);

    cursorTrail.width =
      window.innerWidth * dpr;

    cursorTrail.height =
      window.innerHeight * dpr;

    cursorTrail.style.width =
      `${window.innerWidth}px`;

    cursorTrail.style.height =
      `${window.innerHeight}px`;

    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );
  }

  resizeCursorCanvas();

  window.addEventListener(
    'resize',
    resizeCursorCanvas,
    { passive: true }
  );


  /* -----------------------------------------
     MOUSE MOVEMENT
     ----------------------------------------- */

  window.addEventListener('mousemove', (e) => {

    mouseX = e.clientX;
    mouseY = e.clientY;

  }, { passive: true });


  /* -----------------------------------------
     TRAIL DRAWING
     ----------------------------------------- */

  function drawTrail() {

    ctx.clearRect(
      0,
      0,
      window.innerWidth,
      window.innerHeight
    );

    trail.push({
      x: currentX,
      y: currentY
    });

    if (trail.length > TRAIL_LENGTH) {
      trail.shift();
    }

    if (trail.length < 2) return;


    for (let i = 1; i < trail.length; i++) {

      const previous = trail[i - 1];
      const point = trail[i];

      const progress =
        i / trail.length;

      const opacity =
        progress * 0.32;

      const width =
        progress * 3.2;

      ctx.beginPath();

      ctx.moveTo(
        previous.x,
        previous.y
      );

      ctx.lineTo(
        point.x,
        point.y
      );

      ctx.strokeStyle =
        `rgba(41, 0, 82, ${opacity})`;

      ctx.lineWidth = width;

      ctx.lineCap = 'round';

      ctx.stroke();
    }
  }


  /* -----------------------------------------
     CURSOR ANIMATION
     ----------------------------------------- */

  function animateCursor() {

    currentX +=
      (mouseX - currentX) * 0.24;

    currentY +=
      (mouseY - currentY) * 0.24;


    cursorSpark.style.left =
      `${currentX}px`;

    cursorSpark.style.top =
      `${currentY}px`;


    drawTrail();


    requestAnimationFrame(
      animateCursor
    );
  }

  animateCursor();


  /* -----------------------------------------
     INTERACTIVE ELEMENTS
     ----------------------------------------- */

  document
    .querySelectorAll(
      'a, button, input, textarea, select, [role="button"]'
    )
    .forEach((element) => {

      element.addEventListener(
        'mouseenter',
        () => {
          cursorSpark.classList.add(
            'cursor-spark--active'
          );
        }
      );

      element.addEventListener(
        'mouseleave',
        () => {
          cursorSpark.classList.remove(
            'cursor-spark--active'
          );
        }
      );

    });


  /* -----------------------------------------
     CLICK
     ----------------------------------------- */

  window.addEventListener(
    'mousedown',
    () => {
      cursorSpark.classList.add(
        'cursor-spark--click'
      );
    }
  );

  window.addEventListener(
    'mouseup',
    () => {
      cursorSpark.classList.remove(
        'cursor-spark--click'
      );
    }
  );

}


    const brandReveal = document.getElementById('brandReveal');
  const brandWordText = document.getElementById('brandWordText');
  const brandCursor = document.getElementById('brandCursor');
  const brandUnderline = document.getElementById('brandUnderline');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (brandReveal && brandWordText) {
    const word = 'remify';

    function typeWord() {
      if (prefersReducedMotion) {
        brandWordText.textContent = word;
        brandCursor.classList.add('hide');
        brandUnderline.classList.add('in-view');
        return;
      }

      let i = 0;
      const speed = 90;

      function typeNext() {
        if (i < word.length) {
          brandWordText.textContent += word.charAt(i);
          i++;
          setTimeout(typeNext, speed);
        } else {
          setTimeout(() => {
            brandCursor.classList.add('hide');
            brandUnderline.classList.add('in-view');
          }, 300);
        }
      }
      typeNext();
    }

    const brandObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          typeWord();
          brandObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    brandObserver.observe(brandReveal);
  }

    const productCard = document.getElementById('productCard');

  if (productCard) {
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          cardObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    cardObserver.observe(productCard);
  }

  const productShowcase = document.getElementById('productShowcase');
  const showcaseBgImg = document.querySelector('.product-showcase-bg img');

  if (productShowcase && showcaseBgImg) {
    function updateParallax() {
      const rect = productShowcase.getBoundingClientRect();
      const winH = window.innerHeight;

      if (rect.bottom > 0 && rect.top < winH) {
        const progress = (winH - rect.top) / (winH + rect.height);
        const offset = (progress - 0.5) * 60;
        showcaseBgImg.style.transform = `scale(1.15) translateY(${offset}px)`;
      }
    }

    window.addEventListener('scroll', () => {
      window.requestAnimationFrame(updateParallax);
    }, { passive: true });

    updateParallax();
  }

    const revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const siblings = Array.from(entry.target.parentElement.children).filter(el => el.classList.contains('reveal'));
          const index = siblings.indexOf(entry.target);
          entry.target.style.transitionDelay = `${index * 0.12}s`;
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    revealEls.forEach((el) => revealObserver.observe(el));
  }


    const howSteps = document.querySelectorAll('.how-step');

  if (howSteps.length) {
    const howStepObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          howStepObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    howSteps.forEach((step) => howStepObserver.observe(step));
  }

  const howStepsContainer = document.getElementById('howSteps');
  const howConnectorFill = document.getElementById('howConnectorFill');
  const isMobileLayout = () => window.matchMedia('(max-width: 900px)').matches;

  if (howStepsContainer && howConnectorFill) {
    function updateConnector() {
      const rect = howStepsContainer.getBoundingClientRect();
      const winH = window.innerHeight;
      const progress = Math.min(Math.max((winH * 0.75 - rect.top) / (rect.height), 0), 1);

      if (isMobileLayout()) {
        howConnectorFill.style.width = '100%';
        howConnectorFill.style.height = `${progress * 100}%`;
      } else {
        howConnectorFill.style.height = '100%';
        howConnectorFill.style.width = `${progress * 100}%`;
      }
    }

    window.addEventListener('scroll', () => {
      window.requestAnimationFrame(updateConnector);
    }, { passive: true });

    window.addEventListener('resize', updateConnector);
    updateConnector();
  }

  /* Scroll progress */

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