document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     AOS
     ========================================================= */

  if (typeof AOS !== "undefined") {
    AOS.init({
      once: false,
      duration: 1000,
      easing: "cubic-bezier(.16,1,.3,1)",
      offset: 40,
      disable: () =>
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
    });
  }


  /* =========================================================
     MOBILE MENU
     ========================================================= */

  const menuToggle = document.getElementById("contactMenuToggle");
  const mobileMenu = document.getElementById("contactMobileMenu");
  const menuClose = document.getElementById("contactMenuClose");

  if (menuToggle && mobileMenu) {

    const openMenu = () => {
      menuToggle.classList.add("is-open");
      mobileMenu.classList.add("is-open");

      menuToggle.setAttribute("aria-expanded","true");
      menuToggle.setAttribute("aria-label","Close menu");

      mobileMenu.setAttribute("aria-hidden","false");

      document.body.style.overflow = "hidden";
    };

    const closeMenu = () => {
      menuToggle.classList.remove("is-open");
      mobileMenu.classList.remove("is-open");

      menuToggle.setAttribute("aria-expanded","false");
      menuToggle.setAttribute("aria-label","Open menu");

      mobileMenu.setAttribute("aria-hidden","true");

      document.body.style.overflow = "";
    };

    menuToggle.addEventListener("click", () => {
      mobileMenu.classList.contains("is-open")
        ? closeMenu()
        : openMenu();
    });

    if (menuClose) {
      menuClose.addEventListener("click", closeMenu);
    }

    mobileMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });
  }


  /* =========================================================
     SCROLL PROGRESS
     ========================================================= */

  const scrollFill = document.getElementById("scrollFill");

  if (scrollFill) {

    let ticking = false;

    const updateScrollProgress = () => {

      const scrollTop = window.scrollY || 0;
      const documentHeight =
        document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;

      const scrollableHeight =
        documentHeight - viewportHeight;

      const progress =
        scrollableHeight > 0
          ? scrollTop / scrollableHeight
          : 0;

      scrollFill.style.transform =
        `scaleY(${Math.min(Math.max(progress,0),1)})`;

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
      { passive: true }
    );

    window.addEventListener(
      "resize",
      requestScrollUpdate,
      { passive: true }
    );

    updateScrollProgress();
  }


  /* =========================================================
     SPARK CURSOR
     ========================================================= */

  const cursorSpark =
    document.getElementById("cursorSpark");

  const cursorTrail =
    document.getElementById("cursorTrail");

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
      cursorTrail.getContext("2d");

    let mouseX =
      window.innerWidth / 2;

    let mouseY =
      window.innerHeight / 2;

    let currentX = mouseX;
    let currentY = mouseY;

    const trail = [];
    const TRAIL_LENGTH = 24;


    /* CANVAS */

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
      { passive: true }
    );


    /* MOUSE */

    window.addEventListener(
      "mousemove",
      event => {
        mouseX = event.clientX;
        mouseY = event.clientY;
      },
      { passive: true }
    );


    /* TRAIL */

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

      if (trail.length > TRAIL_LENGTH) {
        trail.shift();
      }

      if (trail.length < 2) return;

      for (
        let i = 1;
        i < trail.length;
        i++
      ) {

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
          `rgba(41,0,82,${opacity})`;

        ctx.lineWidth = width;
        ctx.lineCap = "round";

        ctx.stroke();
      }
    };


    /* ANIMATION */

    const animateCursor = () => {

      currentX +=
        (mouseX - currentX) * 0.24;

      currentY +=
        (mouseY - currentY) * 0.24;

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


    /* INTERACTIVE ELEMENTS */

    const interactiveElements =
      document.querySelectorAll(
        "a,button,input,textarea,select,[role='button']"
      );

    interactiveElements.forEach(element => {

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
    });


    /* CLICK */

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


  /* =========================================================
     CONTACT FORM
     ========================================================= */

  const contactForm =
    document.getElementById("contactForm");

  const formStatus =
    document.getElementById("contactFormStatus");

  if (contactForm) {

    contactForm.addEventListener(
      "submit",
      event => {

        event.preventDefault();

        if (!contactForm.checkValidity()) {

          contactForm.reportValidity();

          return;
        }

        formStatus.textContent =
          "Thanks — your message is ready to be sent.";

        contactForm.reset();

      }
    );
  }

});