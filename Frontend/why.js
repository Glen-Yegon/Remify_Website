/* =========================================================
   REMIFY — WHY REMIFY
   why.js
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {


  /* =======================================================
     AOS
     ======================================================= */

  if (typeof AOS !== "undefined") {

    AOS.init({

      once: false,

      duration: 1000,

      easing:
        "cubic-bezier(.16,1,.3,1)",

      offset: 40,

      disable: () =>
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches

    });

  }


  /* =======================================================
     WHY NAVBAR — STICKY / GLASS STATE
     ======================================================= */

  const whyNavbar =
    document.getElementById(
      "whyNavbar"
    );

  const whyHero =
    document.getElementById(
      "whyHero"
    );


  if (whyNavbar && whyHero) {

    let navbarTicking = false;


    const updateNavbar = () => {

      const scrollY =
        window.scrollY || 0;


      /*
       * The navbar stays in its original
       * hero position until the hero has
       * been passed.
       */

      const heroHeight =
        whyHero.offsetHeight;


      if (scrollY >= heroHeight - 20) {

        whyNavbar.classList.add(
          "why-navbar--sticky"
        );

      } else {

        whyNavbar.classList.remove(
          "why-navbar--sticky"
        );

      }


      navbarTicking = false;

    };


    const requestNavbarUpdate = () => {

      if (!navbarTicking) {

        window.requestAnimationFrame(
          updateNavbar
        );

        navbarTicking = true;

      }

    };


    window.addEventListener(
      "scroll",
      requestNavbarUpdate,
      {
        passive: true
      }
    );


    window.addEventListener(
      "resize",
      requestNavbarUpdate,
      {
        passive: true
      }
    );


    updateNavbar();

  }


  /* =======================================================
     MOBILE MENU
     ======================================================= */

  const menuToggle =
    document.getElementById(
      "whyMenuToggle"
    );

  const mobileMenu =
    document.getElementById(
      "whyMobileMenu"
    );


  if (menuToggle && mobileMenu) {


    const openMenu = () => {

      menuToggle.classList.add(
        "is-open"
      );

      mobileMenu.classList.add(
        "is-open"
      );

      menuToggle.setAttribute(
        "aria-expanded",
        "true"
      );

      menuToggle.setAttribute(
        "aria-label",
        "Close menu"
      );

      mobileMenu.setAttribute(
        "aria-hidden",
        "false"
      );

      document.body.classList.add(
        "menu-open"
      );

    };


    const closeMenu = () => {

      menuToggle.classList.remove(
        "is-open"
      );

      mobileMenu.classList.remove(
        "is-open"
      );

      menuToggle.setAttribute(
        "aria-expanded",
        "false"
      );

      menuToggle.setAttribute(
        "aria-label",
        "Open menu"
      );

      mobileMenu.setAttribute(
        "aria-hidden",
        "true"
      );

      document.body.classList.remove(
        "menu-open"
      );

    };


    menuToggle.addEventListener(
      "click",
      () => {

        const isOpen =
          mobileMenu.classList.contains(
            "is-open"
          );

        if (isOpen) {

          closeMenu();

        } else {

          openMenu();

        }

      }
    );


    mobileMenu
      .querySelectorAll("a")
      .forEach((link) => {

        link.addEventListener(
          "click",
          closeMenu
        );

      });


    document.addEventListener(
      "keydown",
      (event) => {

        if (event.key === "Escape") {

          closeMenu();

        }

      }
    );

  }


  /* =======================================================
     SCROLL PROGRESS
     ======================================================= */

  const scrollFill =
    document.getElementById(
      "scrollFill"
    );


  if (scrollFill) {

    let ticking = false;


    const updateScrollProgress = () => {

      const scrollTop =
        window.scrollY || 0;


      const documentHeight =
        document.documentElement
          .scrollHeight;


      const viewportHeight =
        window.innerHeight;


      const scrollableHeight =
        documentHeight -
        viewportHeight;


      const progress =
        scrollableHeight > 0
          ? scrollTop / scrollableHeight
          : 0;


      scrollFill.style.transform =
        `scaleY(${Math.min(
          Math.max(progress, 0),
          1
        )})`;


      ticking = false;

    };


    const requestScrollUpdate = () => {

      if (!ticking) {

        window.requestAnimationFrame(
          updateScrollProgress
        );

        ticking = true;

      }

    };


    window.addEventListener(
      "scroll",
      requestScrollUpdate,
      {
        passive: true
      }
    );


    window.addEventListener(
      "resize",
      requestScrollUpdate,
      {
        passive: true
      }
    );


    updateScrollProgress();

  }


  /* =======================================================
     REMIFY SPARK CURSOR
     ======================================================= */

  const cursorSpark =
    document.getElementById(
      "cursorSpark"
    );

  const cursorTrail =
    document.getElementById(
      "cursorTrail"
    );


  const isFinePointer =
    window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;


  if (
    isFinePointer &&
    cursorSpark &&
    cursorTrail
  ) {


    const ctx =
      cursorTrail.getContext(
        "2d"
      );


    let mouseX =
      window.innerWidth / 2;

    let mouseY =
      window.innerHeight / 2;


    let currentX = mouseX;

    let currentY = mouseY;


    const trail = [];


    const TRAIL_LENGTH = 24;


    /* =====================================================
       CANVAS RESIZE
       ===================================================== */

    const resizeCursorCanvas = () => {

      const dpr =
        Math.min(
          window.devicePixelRatio || 1,
          2
        );


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

    };


    resizeCursorCanvas();


    window.addEventListener(
      "resize",
      resizeCursorCanvas,
      {
        passive: true
      }
    );


    /* =====================================================
       MOUSE MOVEMENT
       ===================================================== */

    window.addEventListener(
      "mousemove",
      (event) => {

        mouseX =
          event.clientX;

        mouseY =
          event.clientY;

      },
      {
        passive: true
      }
    );


    /* =====================================================
       TRAIL DRAWING
       ===================================================== */

    const drawTrail = () => {

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


      if (
        trail.length >
        TRAIL_LENGTH
      ) {

        trail.shift();

      }


      if (
        trail.length < 2
      ) {

        return;

      }


      for (
        let i = 1;
        i < trail.length;
        i++
      ) {


        const previous =
          trail[i - 1];


        const point =
          trail[i];


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
          `rgba(
            41,
            0,
            82,
            ${opacity}
          )`;


        ctx.lineWidth =
          width;


        ctx.lineCap =
          "round";


        ctx.stroke();

      }

    };


    /* =====================================================
       CURSOR ANIMATION
       ===================================================== */

    const animateCursor = () => {


      currentX +=
        (mouseX - currentX) *
        0.24;


      currentY +=
        (mouseY - currentY) *
        0.24;


      cursorSpark.style.left =
        `${currentX}px`;


      cursorSpark.style.top =
        `${currentY}px`;


      drawTrail();


      window.requestAnimationFrame(
        animateCursor
      );

    };


    animateCursor();


    /* =====================================================
       INTERACTIVE ELEMENTS
       ===================================================== */

    const interactiveElements =
      document.querySelectorAll(
        "a, button, input, textarea, select, [role='button']"
      );


    interactiveElements.forEach(
      (element) => {


        element.addEventListener(
          "mouseenter",
          () => {

            cursorSpark.classList.add(
              "cursor-spark--active"
            );

          }
        );


        element.addEventListener(
          "mouseleave",
          () => {

            cursorSpark.classList.remove(
              "cursor-spark--active"
            );

          }
        );

      }
    );


    /* =====================================================
       CLICK RESPONSE
       ===================================================== */

    window.addEventListener(
      "mousedown",
      () => {

        cursorSpark.classList.add(
          "cursor-spark--click"
        );

      }
    );


    window.addEventListener(
      "mouseup",
      () => {

        cursorSpark.classList.remove(
          "cursor-spark--click"
        );

      }
    );


    window.addEventListener(
      "mouseleave",
      () => {

        cursorSpark.classList.remove(
          "cursor-spark--active"
        );

      }
    );

  }

});