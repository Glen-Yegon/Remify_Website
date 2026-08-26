/* =========================================================
   REMIFY — IMAGE PIXEL PAGE TRANSITION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const transition = document.getElementById("remifyPageTransition");
  const pixelContainer = document.getElementById("remifyTransitionPixels");

  if (!transition || !pixelContainer) return;

  const prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) return;

  /* =======================================================
     IMAGE SOURCES
     ======================================================= */

  const desktopImage = "images/hero-desk2.webp";
  const mobileImage = "images/hero-mobile-2.webp";

  /* =======================================================
     PIXEL DENSITY
     ======================================================= */

  const getGrid = () => {
    const width = window.innerWidth;

    if (width <= 600) {
      return {
        columns: 18,
        rows: 30
      };
    }

    if (width <= 900) {
      return {
        columns: 25,
        rows: 24
      };
    }

    return {
      columns: 36,
      rows: 20
    };
  };

  /* =======================================================
     BUILD PIXEL GRID
     ======================================================= */

  let currentGrid = null;

  const buildPixels = () => {
    const grid = getGrid();

    if (
      currentGrid &&
      currentGrid.columns === grid.columns &&
      currentGrid.rows === grid.rows
    ) {
      return;
    }

    currentGrid = grid;

    pixelContainer.innerHTML = "";

    pixelContainer.style.gridTemplateColumns =
      `repeat(${grid.columns}, 1fr)`;

    pixelContainer.style.gridTemplateRows =
      `repeat(${grid.rows}, 1fr)`;

    pixelContainer.style.setProperty(
      "--columns",
      grid.columns
    );

    pixelContainer.style.setProperty(
      "--rows",
      grid.rows
    );

const mobile = window.innerWidth <= 600;

const image = mobile
  ? mobileImage
  : desktopImage;

    pixelContainer.style.setProperty(
      "--transition-image",
      `url("${image}")`
    );

    const fragment = document.createDocumentFragment();

    for (let row = 0; row < grid.rows; row++) {
      for (let column = 0; column < grid.columns; column++) {
        const pixel = document.createElement("span");

        pixel.className =
          "remify-transition-pixel";

        /*
         * Every pixel receives the correct
         * section of the image.
         */

        const x =
          (column / (grid.columns - 1)) * 100;

        const y =
          (row / (grid.rows - 1)) * 100;

        pixel.style.setProperty(
          "--background-x",
          `${x}%`
        );

        pixel.style.setProperty(
          "--background-y",
          `${y}%`
        );

        fragment.appendChild(pixel);
      }
    }

    pixelContainer.appendChild(fragment);
  };

  buildPixels();

  /* =======================================================
     RESIZE
     ======================================================= */

  let resizeTimer;

  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(() => {
        buildPixels();
      }, 150);
    },
    { passive: true }
  );

  /* =======================================================
     LINK FILTER
     ======================================================= */

  const shouldIgnoreLink = (link, event) => {
    if (!link) return true;

    if (link.target === "_blank") return true;

    if (link.hasAttribute("download")) return true;

    if (link.hasAttribute("data-no-transition")) {
      return true;
    }

    const rel =
      link.getAttribute("rel") || "";

    if (rel.includes("external")) {
      return true;
    }

    const href =
      link.getAttribute("href");

    if (!href) return true;

    if (
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) {
      return true;
    }

    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return true;
    }

    let url;

    try {
      url = new URL(
        href,
        window.location.href
      );
    } catch {
      return true;
    }

    if (
      url.origin !==
      window.location.origin
    ) {
      return true;
    }

    /*
     * Same-page anchors should not
     * trigger the cinematic transition.
     */

    if (
      url.pathname ===
        window.location.pathname &&
      url.search ===
        window.location.search
    ) {
      return true;
    }

    return false;
  };

  /* =======================================================
     RANDOMIZED PIXEL ORDER
     ======================================================= */

  const shufflePixels = () => {
    const pixels = Array.from(
      pixelContainer.children
    );

    /*
     * Shuffle the visual reveal order.
     * This makes the image feel like it is
     * being assembled organically.
     */

    for (
      let i = pixels.length - 1;
      i > 0;
      i--
    ) {
      const j =
        Math.floor(
          Math.random() * (i + 1)
        );

      [
        pixels[i],
        pixels[j]
      ] = [
        pixels[j],
        pixels[i]
      ];
    }

    return pixels;
  };

  /* =======================================================
     PLAY TRANSITION
     ======================================================= */

  const playTransition = (url) => {
    const pixels =
      shufflePixels();

    transition.classList.remove(
      "word-visible"
    );

    transition.classList.add(
      "is-active"
    );

    /*
     * Force browser to register the
     * initial state before animation.
     */

    void transition.offsetWidth;

    /*
     * Reveal pixels rapidly.
     */

    pixels.forEach(
      (pixel, index) => {
        pixel.classList.remove(
          "is-filling"
        );

        pixel.style.animationDelay =
          `${index * 0.0022}s`;

        void pixel.offsetWidth;

        pixel.classList.add(
          "is-filling"
        );
      }
    );

    /*
     * Total pixel animation time.
     */

    const pixelDuration =
      550 +
      pixels.length * 2.2;

    /*
     * Word appears ONLY after the
     * image has completely formed.
     */

    setTimeout(() => {
      transition.classList.add(
        "word-visible"
      );
    }, pixelDuration + 20);

    /*
     * Navigate after the word has
     * had enough time to appear.
     */

    setTimeout(() => {
      window.location.href = url;
    }, pixelDuration + 620);
  };

  /* =======================================================
     GLOBAL LINK HANDLER
     * ======================================================= */

  document.addEventListener(
    "click",
    (event) => {
      const link =
        event.target.closest("a");

      if (
        shouldIgnoreLink(
          link,
          event
        )
      ) {
        return;
      }

      event.preventDefault();

      const url =
        new URL(
          link.href,
          window.location.href
        );

      playTransition(
        url.href
      );
    },
    true
  );

  /* =======================================================
     PAGE ARRIVAL
     ======================================================= */

  /*
   * IMPORTANT:
   *
   * The transition does NOT play
   * automatically when the new page
   * loads.
   *
   * Every page starts clean.
   */

  window.addEventListener(
    "pageshow",
    () => {
      transition.classList.remove(
        "is-active",
        "word-visible"
      );

      pixelContainer
        .querySelectorAll(".is-filling")
        .forEach((pixel) => {
          pixel.classList.remove(
            "is-filling"
          );
        });
    }
  );
});