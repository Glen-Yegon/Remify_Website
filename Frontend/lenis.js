/* =========================================================
   REMIFY — LENIS SMOOTH SCROLL
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const lenis = new Lenis({
    duration: 1.15,
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 0.9,
    touchMultiplier: 1,
    lerp: 0.1,
    infinite: false
  });


  /* =======================================================
     ANIMATION LOOP
     ======================================================= */

  function raf(time) {

    lenis.raf(time);

    requestAnimationFrame(raf);

  }

  requestAnimationFrame(raf);


  /* =======================================================
     MAKE LENIS AVAILABLE GLOBALLY
     ======================================================= */

  window.remifyLenis = lenis;

});