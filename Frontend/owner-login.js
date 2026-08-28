const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://remify-website.onrender.com";

document.addEventListener("DOMContentLoaded", () => {

  const form =
    document.getElementById("ownerLoginForm");

  const button =
    document.getElementById("ownerLoginButton");

  const errorElement =
    document.getElementById("ownerLoginError");


  if (!form) {
    return;
  }


  form.addEventListener("submit", async (event) => {

    event.preventDefault();


    errorElement.textContent = "";
    errorElement.style.display = "none";


    const username =
      document
        .getElementById("username")
        .value
        .trim();

    const password =
      document
        .getElementById("password")
        .value;


    button.disabled = true;
    button.textContent = "Signing in...";


    try {

      const response =
        await fetch(
          `${API_BASE_URL}/api/owner/login`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({
              username,
              password
            })
          }
        );


      const data =
        await response.json();


      if (
        !response.ok ||
        !data.success
      ) {

        throw new Error(
          data.message ||
          "Unable to sign in."
        );

      }


      /* =========================================
         SAVE OWNER TOKEN
         ========================================= */

      localStorage.setItem(
        "remifyOwnerToken",
        data.token
      );


      /* =========================================
         REDIRECT
         ========================================= */

      window.location.href =
        "owner-dashboard.html";


    } catch (error) {

      console.error(
        "Owner login error:",
        error
      );


      errorElement.textContent =
        error.message ||
        "Unable to sign in. Please try again.";

      errorElement.style.display =
        "block";


      button.disabled = false;
      button.textContent = "Sign in";

    }

  });

});

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

    window.addEventListener(
      'mousemove',
      (event) => {

        mouseX = event.clientX;
        mouseY = event.clientY;

      },
      { passive: true }
    );


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

      if (trail.length < 2) {
        return;
      }


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
       CLICK EFFECT
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


  /* =========================================================
     SCROLL PROGRESS
     ========================================================= */

  const scrollFill =
    document.getElementById('scrollFill');

  if (scrollFill) {

    const updateScroll = () => {

      const scrollTop =
        window.scrollY;

      const docHeight =
        document.documentElement.scrollHeight -
        window.innerHeight;

      const progress =
        docHeight > 0
          ? scrollTop / docHeight
          : 0;

      scrollFill.style.transform =
        `scaleY(${progress})`;

    };


    window.addEventListener(
      'scroll',
      updateScroll,
      { passive: true }
    );

    updateScroll();

  }

});