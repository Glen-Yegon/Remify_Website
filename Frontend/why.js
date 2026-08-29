/* =========================================================
   REMIFY — WHY REMIFY
   why.js
   ========================================================= */

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
     NAVBAR — STICKY / GLASS STATE
     ========================================================= */

  const navbar =
    document.getElementById("navbar");


  if (navbar) {

    let navbarTicking = false;


    const updateNavbar = () => {

      const scrollY =
        window.scrollY || 0;


      if (scrollY > 10) {

        navbar.classList.add(
          "navbar--scrolled"
        );

      } else {

        navbar.classList.remove(
          "navbar--scrolled"
        );

      }


      navbarTicking = false;

    };


    const requestNavbarUpdate = () => {

      if (!navbarTicking) {

        navbarTicking = true;

        window.requestAnimationFrame(
          updateNavbar
        );

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



  /* =========================================================
     MOBILE MENU
     ========================================================= */

  const navToggle =
    document.getElementById("navToggle");

  const mobileMenu =
    document.getElementById("mobileMenu");

  const mobileMenuClose =
    document.getElementById("mobileMenuClose");


  const openMobileMenu = () => {

    if (!mobileMenu) return;


    mobileMenu.classList.add("open");

    mobileMenu.setAttribute(
      "aria-hidden",
      "false"
    );


    if (navToggle) {

      navToggle.classList.add("is-open");

      navToggle.setAttribute(
        "aria-expanded",
        "true"
      );

      navToggle.setAttribute(
        "aria-label",
        "Close menu"
      );

    }


    document.body.classList.add(
      "mobile-menu-open"
    );


    document.body.style.overflow =
      "hidden";

  };


  const closeMobileMenu = () => {

    if (!mobileMenu) return;


    mobileMenu.classList.remove("open");

    mobileMenu.setAttribute(
      "aria-hidden",
      "true"
    );


    if (navToggle) {

      navToggle.classList.remove("is-open");

      navToggle.setAttribute(
        "aria-expanded",
        "false"
      );

      navToggle.setAttribute(
        "aria-label",
        "Open menu"
      );

    }


    document.body.classList.remove(
      "mobile-menu-open"
    );


    document.body.style.overflow = "";

  };


  /* =========================================================
     HAMBURGER
     ========================================================= */

  if (navToggle) {

    navToggle.addEventListener(
      "click",
      () => {

        if (
          mobileMenu &&
          mobileMenu.classList.contains("open")
        ) {

          closeMobileMenu();

        } else {

          openMobileMenu();

        }

      }
    );

  }


  /* =========================================================
     MOBILE CLOSE BUTTON
     ========================================================= */

  if (mobileMenuClose) {

    mobileMenuClose.addEventListener(
      "click",
      closeMobileMenu
    );

  }


  /* =========================================================
     CLOSE MOBILE MENU WHEN LINK IS CLICKED
     ========================================================= */

  if (mobileMenu) {

    mobileMenu
      .querySelectorAll("a")
      .forEach((link) => {

        link.addEventListener(
          "click",
          closeMobileMenu
        );

      });

  }


  /* =========================================================
     CLOSE MOBILE MENU WITH ESC
     ========================================================= */

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape" &&
        mobileMenu &&
        mobileMenu.classList.contains("open")
      ) {

        closeMobileMenu();

      }

    }
  );



  /* =========================================================
     CART
     ========================================================= */

  const cartBtn =
    document.getElementById("cartBtn");

  const cartCount =
    document.getElementById("cartCount");


  if (cartBtn) {

    cartBtn.addEventListener(
      "click",
      () => {

        window.location.href =
          "cart.html";

      }
    );

  }


  /* =========================================================
     GLOBAL CART COUNT
     ========================================================= */

  const CART_STORAGE_KEY =
    "remifyCart";


  const getCart = () => {

    try {

      const stored =
        localStorage.getItem(
          CART_STORAGE_KEY
        );


      if (!stored) {
        return [];
      }


      const parsed =
        JSON.parse(stored);


      return Array.isArray(parsed)
        ? parsed
        : [];

    } catch (error) {

      console.error(
        "Remify cart error:",
        error
      );

      return [];

    }

  };


  const updateCartCount = (
    animate = false
  ) => {

    if (!cartCount) return;


    const cart =
      getCart();


    const totalQuantity =
      cart.reduce(
        (total, item) => {

          const quantity =
            Number(item?.quantity) || 0;

          return total + quantity;

        },
        0
      );


    /* =====================================================
       COUNT
       ===================================================== */

    cartCount.textContent =
      totalQuantity > 99
        ? "99+"
        : totalQuantity;


    /* =====================================================
       EMPTY STATE
       ===================================================== */

    cartCount.classList.toggle(
      "is-empty",
      totalQuantity === 0
    );


    /* =====================================================
       ACCESSIBILITY
       ===================================================== */

    if (cartBtn) {

      cartBtn.setAttribute(
        "aria-label",
        totalQuantity === 0
          ? "View cart, 0 items"
          : `View cart, ${totalQuantity} ${
              totalQuantity === 1
                ? "item"
                : "items"
            }`
      );

    }


    /* =====================================================
       UPDATE ANIMATION
       ===================================================== */

    if (animate) {

      cartCount.classList.remove(
        "is-updated"
      );


      void cartCount.offsetWidth;


      cartCount.classList.add(
        "is-updated"
      );

    }

  };


  /* =========================================================
     INITIAL CART COUNT
     ========================================================= */

  updateCartCount();


  /* =========================================================
     SAME-TAB CART UPDATES
     ========================================================= */

  window.addEventListener(
    "cartUpdated",
    () => {

      updateCartCount(true);

    }
  );


  /* =========================================================
     OTHER TAB CART UPDATES
     ========================================================= */

  window.addEventListener(
    "storage",
    (event) => {

      if (
        event.key === CART_STORAGE_KEY
      ) {

        updateCartCount(true);

      }

    }
  );


  /* =========================================================
     PUBLIC CART COUNT FUNCTION
     ========================================================= */

  window.updateWhyCartCount =
    updateCartCount;



  /* =========================================================
     REMIFY SPARK CURSOR
     ========================================================= */

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


  const prefersReducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  if (
    isFinePointer &&
    !prefersReducedMotion &&
    cursorSpark &&
    cursorTrail
  ) {

    const ctx =
      cursorTrail.getContext("2d");


    if (!ctx) return;


    let mouseX =
      window.innerWidth / 2;

    let mouseY =
      window.innerHeight / 2;


    let currentX =
      mouseX;

    let currentY =
      mouseY;


    const trail = [];


    const TRAIL_LENGTH =
      24;



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
       DRAW TRAIL
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
          `rgba(41, 0, 82, ${opacity})`;


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

    document
      .querySelectorAll(
        "a, button, input, textarea, select, [role='button']"
      )
      .forEach((element) => {

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



    /* =====================================================
       CLICK EFFECT
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