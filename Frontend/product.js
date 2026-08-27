document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     REMIFY PRODUCT PAGE
     ========================================================= */


  /* =========================================================
     MOBILE NAVIGATION
     ========================================================= */

  const navbar =
    document.getElementById("productNavbar");

  const navToggle =
    document.getElementById("productNavToggle");

  const mobileMenuClose =
    document.getElementById("mobileMenuClose");

  const mobileMenu =
    document.getElementById("productMobileMenu");


  const openMenu = () => {

    if (!navbar) return;

    navbar.classList.add("menu-open");

    navToggle?.setAttribute(
      "aria-expanded",
      "true"
    );

    navToggle?.setAttribute(
      "aria-label",
      "Close navigation"
    );

    document.body.style.overflow = "hidden";
  };


  const closeMenu = () => {

    if (!navbar) return;

    navbar.classList.remove("menu-open");

    navToggle?.setAttribute(
      "aria-expanded",
      "false"
    );

    navToggle?.setAttribute(
      "aria-label",
      "Open navigation"
    );

    document.body.style.overflow = "";
  };


  navToggle?.addEventListener(
    "click",
    openMenu
  );


  mobileMenuClose?.addEventListener(
    "click",
    closeMenu
  );


  mobileMenu
    ?.querySelectorAll("a")
    .forEach((link) => {

      link.addEventListener(
        "click",
        closeMenu
      );

    });


  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape" &&
        navbar?.classList.contains("menu-open")
      ) {
        closeMenu();
      }

    }
  );


  window.addEventListener(
    "resize",
    () => {

      if (
        window.innerWidth > 700 &&
        navbar?.classList.contains("menu-open")
      ) {
        closeMenu();
      }

    },
    { passive: true }
  );


  /* =========================================================
     SCROLL PROGRESS
     ========================================================= */

  const scrollFill =
    document.getElementById("scrollFill");


  const updateScrollProgress = () => {

    if (!scrollFill) return;

    const scrollTop =
      window.scrollY;

    const docHeight =
      document.documentElement.scrollHeight -
      window.innerHeight;

    const progress =
      docHeight > 0
        ? Math.min(
            Math.max(
              scrollTop / docHeight,
              0
            ),
            1
          )
        : 0;

    scrollFill.style.transform =
      `scaleY(${progress})`;
  };


  window.addEventListener(
    "scroll",
    updateScrollProgress,
    { passive: true }
  );


  window.addEventListener(
    "resize",
    updateScrollProgress,
    { passive: true }
  );


  updateScrollProgress();


  /* =========================================================
     CUSTOM CURSOR
     ========================================================= */

  setupCursor();


  /* =========================================================
     PRODUCT PAGE
     ========================================================= */

  const productPage =
    document.getElementById("productPage");

  if (!productPage) return;


  const params =
    new URLSearchParams(
      window.location.search
    );


  const productId =
    params.get("id");


  if (!productId) {

    showProductError(
      "No product was specified."
    );

    return;
  }


  /* =========================================================
     LOAD PRODUCT DATA
     ========================================================= */

  async function loadProduct() {

    try {

      const response =
        await fetch(
          "data/products.json",
          {
            cache: "no-store"
          }
        );


      if (!response.ok) {

        throw new Error(
          `Products request failed: ${response.status}`
        );

      }


      const data =
        await response.json();


      const products =
        Array.isArray(data)
          ? data
          : data.products;


      if (!Array.isArray(products)) {

        throw new Error(
          "products.json does not contain a products array."
        );

      }


      const product =
        products.find(
          item =>
            String(item.id).toLowerCase() ===
            String(productId).toLowerCase()
        );


      if (!product) {

        showProductError(
          "We couldn't find that product."
        );

        return;
      }


      renderProduct(product);

    }


    catch (error) {

      console.error(
        "Remify product error:",
        error
      );


      showProductError(
        "Something went wrong while loading this product."
      );

    }

  }


  /* =========================================================
     RENDER PRODUCT
     ========================================================= */

  function renderProduct(product) {

    const name =
      product.name ||
      "Remify Product";


    const tagline =
      product.tagline ||
      "";


    const description =
      product.description ||
      "";


    /* -----------------------------------------
       NAME
       ----------------------------------------- */

    const nameElement =
      document.getElementById(
        "productName"
      );


    if (nameElement) {

      nameElement.textContent =
        name;

    }


    /* -----------------------------------------
       TAGLINE
       ----------------------------------------- */

    const taglineElement =
      document.getElementById(
        "productTagline"
      );


    if (taglineElement) {

      taglineElement.textContent =
        tagline;

    }


    /* -----------------------------------------
       DESCRIPTION
       ----------------------------------------- */

    const descriptionElement =
      document.getElementById(
        "productDescription"
      );


    if (descriptionElement) {

      descriptionElement.textContent =
        description;

    }


    /* -----------------------------------------
       SIZE
       ----------------------------------------- */

    const sizeElement =
      document.getElementById(
        "productSize"
      );


    const size =
      product.details?.size ||
      product.size ||
      product.volume ||
      product.details?.volume ||
      "";


    if (sizeElement) {

      sizeElement.textContent =
        size;

    }


    /* -----------------------------------------
       PRICE
       ----------------------------------------- */

    const pricing =
      product.pricing || {};


    const price =
      pricing.amount ?? "";


    const currency =
      pricing.currency ||
      "KES";


    const displayPrice =
      pricing.display ||
      formatPrice(
        price,
        currency
      );


    const priceElement =
      document.getElementById(
        "productPrice"
      );


    const currencyElement =
      document.getElementById(
        "priceCurrency"
      );


    if (priceElement) {

      priceElement.textContent =
        displayPrice;

    }


    if (currencyElement) {

      currencyElement.textContent =
        pricing.display
          ? ""
          : currency;

    }


    /* -----------------------------------------
       IMAGE
       ----------------------------------------- */

    const imageElement =
      document.getElementById(
        "productImage"
      );


    const image =
      getProductImage(product);


    if (
      imageElement &&
      image
    ) {

      imageElement.src =
        image;

      imageElement.alt =
        name;

    }


    /* -----------------------------------------
       CHECKOUT
       ----------------------------------------- */

    const checkoutButton =
      document.getElementById(
        "checkoutButton"
      );


/* -----------------------------------------
   CHECKOUT
   ----------------------------------------- */

if (checkoutButton) {

  checkoutButton.href =
    `checkout.html?id=${encodeURIComponent(product.id)}&qty=1`;

  checkoutButton.removeAttribute("target");
  checkoutButton.removeAttribute("rel");

  checkoutButton.addEventListener("click",event=>{

    event.preventDefault();

    const quantityValue =
      document.getElementById("quantityValue");

    const quantity =
      Math.max(
        1,
        Math.min(
          20,
          parseInt(quantityValue?.textContent || "1",10) || 1
        )
      );

    window.location.href =
      `checkout.html?id=${encodeURIComponent(product.id)}&qty=${quantity}`;

  });

}


    /* -----------------------------------------
       AVAILABILITY
       ----------------------------------------- */

    const availability =
      document.getElementById(
        "availabilityText"
      );


    const commerce =
      product.commerce || {};


    if (availability) {

      if (
        commerce.available === false ||
        commerce.inStock === false
      ) {

        availability.textContent =
          "Currently unavailable";


        checkoutButton?.classList.add(
          "checkout-disabled"
        );

      }

      else {

        availability.textContent =
          commerce.availability ||
          "Available to order";

      }

    }


    /* -----------------------------------------
       QUANTITY
       ----------------------------------------- */

    setupQuantity(
      product,
      price
    );


    /* -----------------------------------------
       PRODUCT DETAILS
       ----------------------------------------- */

    renderProductDetails(product);


    /* -----------------------------------------
       PAGE TITLE
       ----------------------------------------- */

    document.title =
      `Remify — ${name}`;

  }


  /* =========================================================
     PRODUCT DETAILS
     ========================================================= */

  function renderProductDetails(product) {

    const details =
      product.details || {};


    /*
     * INGREDIENTS
     */

    renderIngredients(
      details.ingredients
    );


    /*
     * BENEFITS
     */

    renderBenefits(
      details.benefits
    );


    /*
     * USAGE
     */

    renderUsage(
      details.usage
    );


    /*
     * STORAGE
     */

    renderStorage(
      details.storage
    );


    /*
     * SHELF LIFE
     */

    renderShelfLife(
      details.shelfLife
    );


    /*
     * NATURAL PRODUCT NOTE
     */

    renderNaturalNote(
      details.note ||
      details.naturalNote ||
      product.naturalNote
    );


    /*
     * Remove cards whose data
     * doesn't exist.
     */

    updateDetailCardVisibility();

  }


  /* =========================================================
     INGREDIENTS
     ========================================================= */

  function renderIngredients(
    ingredients
  ) {

    const container =
      document.getElementById(
        "productIngredients"
      );


    if (!container) return;


    const list =
      normalizeList(
        ingredients
      );


    if (!list.length) {

      hideDetailCard("ingredients");

      return;

    }


    container.innerHTML =
      list
        .map(
          (item, index) => {

            const ingredient =
              normalizeDetailItem(
                item
              );


            return `

              <div class="product-ingredient">

                <span class="product-ingredient-number">
                  ${String(index + 1).padStart(2, "0")}
                </span>

                <div class="product-ingredient-content">

                  <strong>
                    ${escapeHTML(ingredient.title)}
                  </strong>

                  ${
                    ingredient.description
                      ? `
                        <span>
                          ${escapeHTML(
                            ingredient.description
                          )}
                        </span>
                      `
                      : ""
                  }

                </div>

              </div>

            `;

          }
        )
        .join("");

  }


  /* =========================================================
     BENEFITS
     ========================================================= */

  function renderBenefits(
    benefits
  ) {

    const container =
      document.getElementById(
        "productBenefits"
      );


    if (!container) return;


    const list =
      normalizeList(
        benefits
      );


    if (!list.length) {

      hideDetailCard("benefits");

      return;

    }


    container.innerHTML =
      list
        .map(
          (item, index) => {

            const benefit =
              normalizeDetailItem(
                item
              );


            return `

              <div class="product-benefit">

                <span class="product-benefit-check">
                  ✓
                </span>

                <div>

                  <strong>
                    ${escapeHTML(
                      benefit.title
                    )}
                  </strong>

                  ${
                    benefit.description
                      ? `
                        <span>
                          ${escapeHTML(
                            benefit.description
                          )}
                        </span>
                      `
                      : ""
                  }

                </div>

              </div>

            `;

          }
        )
        .join("");

  }


  /* =========================================================
     USAGE
     ========================================================= */

  function renderUsage(
    usage
  ) {

    const textContainer =
      document.getElementById(
        "productUsageText"
      );


    const tagsContainer =
      document.getElementById(
        "productUsageTags"
      );


    if (
      !textContainer ||
      !tagsContainer
    ) {
      return;
    }


    let text = "";
    let tags = [];


    if (typeof usage === "string") {

      text = usage;

    }

    else if (
      usage &&
      typeof usage === "object"
    ) {

      text =
        usage.description ||
        usage.text ||
        usage.instructions ||
        usage.directions ||
        "";


      tags =
        normalizeList(
          usage.options ||
          usage.methods ||
          usage.tags ||
          usage.ways
        )
        .map(
          item =>
            typeof item === "string"
              ? item
              : item.title || item.name || ""
        )
        .filter(Boolean);

    }


    if (!text && !tags.length) {

      hideDetailCard("usage");

      return;

    }


    if (text) {

      textContainer.innerHTML =
        `<p>${escapeHTML(text)}</p>`;

    }


    if (tags.length) {

      tagsContainer.innerHTML =
        tags
          .map(
            tag =>
              `<span>${escapeHTML(tag)}</span>`
          )
          .join("");

    }

  }


  /* =========================================================
     STORAGE
     ========================================================= */

  function renderStorage(
    storage
  ) {

    const container =
      document.getElementById(
        "productStorage"
      );


    if (!container) return;


    if (!storage) {

      hideDetailCard("freshness");

      return;

    }


    let text = "";


    if (typeof storage === "string") {

      text = storage;

    }

    else if (
      typeof storage === "object"
    ) {

      text =
        storage.description ||
        storage.text ||
        storage.instructions ||
        "";

    }


    if (!text) {

      hideDetailCard("freshness");

      return;

    }


    container.innerHTML = `

      <div class="product-storage-icon">
        <span></span>
      </div>

      <div class="product-storage-copy">

        <span>
          Storage
        </span>

        <p>
          ${escapeHTML(text)}
        </p>

      </div>

    `;

  }


  /* =========================================================
     SHELF LIFE
     ========================================================= */

  function renderShelfLife(
    shelfLife
  ) {

    const element =
      document.getElementById(
        "productShelfLife"
      );


    if (!element) return;


    if (!shelfLife) {

      element.textContent =
        "—";

      return;

    }


    if (
      typeof shelfLife === "object"
    ) {

      shelfLife =
        shelfLife.display ||
        shelfLife.value ||
        shelfLife.text ||
        "";

    }


    element.textContent =
      shelfLife;

  }


  /* =========================================================
     NATURAL NOTE
     ========================================================= */

  function renderNaturalNote(
    note
  ) {

    const element =
      document.getElementById(
        "productNaturalNoteText"
      );


    if (!element) return;


    if (!note) return;


    element.textContent =
      typeof note === "string"
        ? note
        : note.text ||
          note.description ||
          element.textContent;

  }


  /* =========================================================
     DETAIL CARD VISIBILITY
     ========================================================= */

  function hideDetailCard(
    type
  ) {

    const card =
      document.querySelector(
        `[data-detail-card="${type}"]`
      );


    if (card) {

      card.hidden = true;

    }

  }


  function updateDetailCardVisibility() {

    document
      .querySelectorAll(
        ".product-detail-card"
      )
      .forEach(
        card => {

          if (
            card.hidden &&
            !card.querySelector(
              ":not([hidden])"
            )
          ) {
            card.hidden = true;
          }

        }
      );

  }


  /* =========================================================
     NORMALIZE LIST DATA
     ========================================================= */

  function normalizeList(
    value
  ) {

    if (!value) return [];


    if (Array.isArray(value)) {

      return value.filter(Boolean);

    }


    return [];

  }


  /* =========================================================
     NORMALIZE DETAIL ITEM
     ========================================================= */

  function normalizeDetailItem(
    item
  ) {

    if (
      typeof item === "string"
    ) {

      return {
        title: item,
        description: ""
      };

    }


    if (
      item &&
      typeof item === "object"
    ) {

      return {

        title:
          item.name ||
          item.title ||
          item.ingredient ||
          item.label ||
          "",

        description:
          item.description ||
          item.detail ||
          item.subtitle ||
          ""

      };

    }


    return {
      title: "",
      description: ""
    };

  }


  /* =========================================================
     ESCAPE HTML
     ========================================================= */

  function escapeHTML(
    value
  ) {

    return String(value)
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );

  }


  /* =========================================================
     PRODUCT IMAGE RESOLVER
     ========================================================= */

  function getProductImage(
    product
  ) {

    const media =
      product.media;


    if (
      typeof media === "string"
    ) {

      return media;

    }


    if (
      media &&
      typeof media === "object" &&
      typeof media.image === "string"
    ) {

      return media.image;

    }


    if (
      media &&
      typeof media === "object" &&
      Array.isArray(media.images) &&
      media.images.length
    ) {

      return media.images[0];

    }


    if (
      Array.isArray(media)
    ) {

      return media[0];

    }


    return "";

  }


  /* =========================================================
     PRICE FORMATTER
     ========================================================= */

  function formatPrice(
    amount,
    currency
  ) {

    if (
      amount === "" ||
      amount === null ||
      amount === undefined
    ) {

      return "";

    }


    try {

      return new Intl.NumberFormat(
        "en-KE",
        {
          style: "currency",
          currency,
          maximumFractionDigits: 0
        }
      ).format(amount);

    }

    catch {

      return `${currency} ${amount}`;

    }

  }


  /* =========================================================
     QUANTITY
     ========================================================= */

  function setupQuantity(
    product,
    basePrice
  ) {

    const minus =
      document.getElementById(
        "quantityMinus"
      );


    const plus =
      document.getElementById(
        "quantityPlus"
      );


    const value =
      document.getElementById(
        "quantityValue"
      );


    if (
      !minus ||
      !plus ||
      !value
    ) {

      return;

    }


    let quantity = 1;


    const updateQuantity = () => {

      value.textContent =
        quantity;


      if (
        typeof basePrice === "number"
      ) {

        const total =
          basePrice * quantity;


        const pricing =
          product.pricing || {};


        const currency =
          pricing.currency ||
          "KES";


        const priceElement =
          document.getElementById(
            "productPrice"
          );


        if (priceElement) {

          priceElement.textContent =
            formatPrice(
              total,
              currency
            );

        }

      }

    };


    minus.addEventListener(
      "click",
      () => {

        if (
          quantity <= 1
        ) {
          return;
        }


        quantity--;

        updateQuantity();

      }
    );


    plus.addEventListener(
      "click",
      () => {

        if (
          quantity >= 20
        ) {
          return;
        }


        quantity++;

        updateQuantity();

      }
    );


    updateQuantity();

  }


  /* =========================================================
     REVEAL ANIMATIONS
     ========================================================= */

  const revealElements =
    document.querySelectorAll(
      ".reveal"
    );


  if (
    revealElements.length &&
    "IntersectionObserver" in window
  ) {

    const revealObserver =
      new IntersectionObserver(
        (entries, observer) => {

          entries.forEach(
            entry => {

              if (
                !entry.isIntersecting
              ) {
                return;
              }


              entry.target.classList.add(
                "in-view"
              );


              observer.unobserve(
                entry.target
              );

            }
          );

        },
        {
          threshold: 0.14
        }
      );


    revealElements.forEach(
      element =>
        revealObserver.observe(
          element
        )
    );

  }

  else {

    revealElements.forEach(
      element =>
        element.classList.add(
          "in-view"
        )
    );

  }


  /* =========================================================
     ERROR STATE
     ========================================================= */

  function showProductError(
    message
  ) {

    productPage.innerHTML = `

      <section class="product-error">

        <div>

          <span>REMIFY</span>

          <h1>
            ${escapeHTML(message)}
          </h1>

          <a href="index.html">
            ← Back to Remify
          </a>

        </div>

      </section>

    `;

  }


  /* =========================================================
     CUSTOM CURSOR
     ========================================================= */

  function setupCursor() {

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
      !isFinePointer ||
      !cursorSpark ||
      !cursorTrail
    ) {
      return;
    }


    const ctx =
      cursorTrail.getContext(
        "2d"
      );


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


    window.addEventListener(
      "mousemove",
      event => {

        mouseX =
          event.clientX;

        mouseY =
          event.clientY;

      },
      {
        passive: true
      }
    );


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


      requestAnimationFrame(
        animateCursor
      );

    };


    animateCursor();


    document
      .querySelectorAll(
        "a, button, input, textarea, select, [role='button']"
      )
      .forEach(
        element => {

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

  }


  /* =========================================================
     START
     ========================================================= */

  loadProduct();

});