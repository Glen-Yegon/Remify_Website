document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     REMIFY — CART SYSTEM
     ========================================================= */


  /* =========================================================
     CONFIGURATION
     ========================================================= */

  const CART_STORAGE_KEY = "remifyCart";

  const MAX_QUANTITY = 20;


  /* =========================================================
     ELEMENTS
     ========================================================= */

  const cartProducts =
    document.getElementById("cartProducts");

  const cartEmpty =
    document.getElementById("cartEmpty");

  const cartSubtotal =
    document.getElementById("cartSubtotal");

  const cartTotal =
    document.getElementById("cartTotal");

  const cartSummaryCount =
    document.getElementById("cartSummaryCount");

  const cartCheckoutButton =
    document.getElementById("cartCheckoutButton");

  const cartDiscoverSection =
    document.getElementById("cartDiscoverSection");

  const cartDiscoverTrack =
    document.getElementById("cartDiscoverTrack");

  const cartDiscoverPrev =
    document.getElementById("cartDiscoverPrev");

  const cartDiscoverNext =
    document.getElementById("cartDiscoverNext");


  /* =========================================================
     STATE
     ========================================================= */

  let products = [];

  let cart = [];

  let discoverProducts = [];

  let discoverIndex = 0;


  /* =========================================================
     PRICE FORMATTER
     ========================================================= */

  const formatPrice = (
    amount,
    currency = "KES"
  ) => {

    if (
      amount === null ||
      amount === undefined ||
      amount === ""
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

    } catch {

      return `${currency} ${amount}`;

    }

  };


  /* =========================================================
     PRODUCT IMAGE
     ========================================================= */

  const getProductImage = product => {

    const media = product?.media;


    if (typeof media === "string") {

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
      Array.isArray(media) &&
      media.length
    ) {

      return media[0];

    }


    return "";

  };


  /* =========================================================
     PRODUCT SIZE
     ========================================================= */

  const getProductSize = product => {

    return (
      product?.details?.size ||
      product?.size ||
      product?.volume ||
      product?.details?.volume ||
      ""
    );

  };


  /* =========================================================
     ESCAPE HTML
     ========================================================= */

  const escapeHTML = value => {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  };


  /* =========================================================
     READ CART
     ========================================================= */

  const getStoredCart = () => {

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


      if (!Array.isArray(parsed)) {

        return [];

      }


      return parsed
        .map(item => ({

          productId:
            String(
              item?.productId || ""
            ),

          quantity:
            Math.max(
              0,
              Math.min(
                MAX_QUANTITY,
                Number(
                  item?.quantity
                ) || 0
              )
            )

        }))
        .filter(
          item =>
            item.productId &&
            item.quantity > 0
        );

    } catch (error) {

      console.error(
        "Remify cart read error:",
        error
      );

      return [];

    }

  };


  /* =========================================================
     SAVE CART
     ========================================================= */

  const saveCart = () => {

    try {

      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
      );

    } catch (error) {

      console.error(
        "Remify cart save error:",
        error
      );

    }

  };


  /* =========================================================
     FIND CART ITEM
     ========================================================= */

  const findCartItem = productId => {

    return cart.find(
      item =>
        String(item.productId)
          .toLowerCase() ===
        String(productId)
          .toLowerCase()
    );

  };


  /* =========================================================
     GET CART PRODUCT
     ========================================================= */

  const getCartProduct = item => {

    return products.find(
      product =>
        String(product.id)
          .toLowerCase() ===
        String(item.productId)
          .toLowerCase()
    );

  };


  /* =========================================================
     UPDATE QUANTITY
     ========================================================= */

  const updateQuantity = (
    productId,
    quantity
  ) => {

    const item =
      findCartItem(productId);


    if (!item) {

      if (quantity <= 0) {

        return;

      }


      cart.push({

        productId,

        quantity:
          Math.min(
            MAX_QUANTITY,
            Math.max(1, quantity)
          )

      });

    } else {

      item.quantity =
        Math.min(
          MAX_QUANTITY,
          Math.max(0, quantity)
        );


      if (item.quantity === 0) {

        cart =
          cart.filter(
            cartItem =>
              cartItem !== item
          );

      }

    }


    saveCart();

    renderCart();

  };


  /* =========================================================
     REMOVE PRODUCT
     ========================================================= */

  const removeProduct = productId => {

    cart =
      cart.filter(
        item =>
          String(item.productId)
            .toLowerCase() !==
          String(productId)
            .toLowerCase()
      );


    saveCart();

    renderCart();

  };


  /* =========================================================
     CART TOTALS
     ========================================================= */

  const calculateTotals = () => {

    let subtotal = 0;

    let itemCount = 0;


    cart.forEach(item => {

      const product =
        getCartProduct(item);


      if (!product) {

        return;

      }


      const amount =
        Number(
          product?.pricing?.amount
        ) || 0;


      const quantity =
        Number(item.quantity) || 0;


      subtotal +=
        amount * quantity;


      itemCount += quantity;

    });


    return {
      subtotal,
      itemCount
    };

  };


  /* =========================================================
     RENDER CART ITEM
     ========================================================= */

  const renderCartItem = item => {

    const product =
      getCartProduct(item);


    if (!product) {

      return "";

    }


    const amount =
      Number(
        product?.pricing?.amount
      ) || 0;


    const currency =
      product?.pricing?.currency ||
      "KES";


    const image =
      getProductImage(product);


    const size =
      getProductSize(product);


    const quantity =
      Number(item.quantity) || 0;


    const productName =
      product.name ||
      "Remify Product";


    const total =
      amount * quantity;


    return `

      <article
        class="cart-item"
        data-product-id="${escapeHTML(product.id)}"
      >

        <a
          href="products.html?id=${encodeURIComponent(product.id)}"
          class="cart-item-image"
          aria-label="View ${escapeHTML(productName)}"
        >

          <img
            src="${escapeHTML(image)}"
            alt="${escapeHTML(productName)}"
            loading="lazy"
          >

        </a>


        <div class="cart-item-info">

          <div>

            <span class="cart-item-brand">
              REMIFY
            </span>

            <a
              href="products.html?id=${encodeURIComponent(product.id)}"
              class="cart-item-name"
            >
              ${escapeHTML(productName)}
            </a>

            <p class="cart-item-size">
              ${escapeHTML(size)}
            </p>

          </div>


          <div>

            <div class="cart-item-bottom">

              <p class="cart-item-price">
                ${formatPrice(total, currency)}
              </p>


              <div
                class="cart-quantity"
                aria-label="Quantity"
              >

                <button
                  type="button"
                  class="cart-quantity-minus"
                  data-product-id="${escapeHTML(product.id)}"
                  aria-label="Decrease quantity"
                >
                  −
                </button>


                <span class="cart-quantity-value">
                  ${quantity}
                </span>


                <button
                  type="button"
                  class="cart-quantity-plus"
                  data-product-id="${escapeHTML(product.id)}"
                  aria-label="Increase quantity"
                >
                  +
                </button>

              </div>

            </div>


            <button
              type="button"
              class="cart-item-remove"
              data-product-id="${escapeHTML(product.id)}"
            >
              Remove
            </button>

          </div>

        </div>

      </article>

    `;

  };


  /* =========================================================
     RENDER CART
     ========================================================= */

  const renderCart = () => {

    const validCart =
      cart.filter(
        item =>
          getCartProduct(item)
      );


    if (
      validCart.length !==
      cart.length
    ) {

      cart = validCart;

      saveCart();

    }


    const isEmpty =
      cart.length === 0;


    if (isEmpty) {

      cartProducts.innerHTML = "";

      cartEmpty.hidden = false;

      cartCheckoutButton.classList.add(
        "is-disabled"
      );

      cartCheckoutButton.setAttribute(
        "aria-disabled",
        "true"
      );

    } else {

      cartEmpty.hidden = true;

      cartProducts.innerHTML =
        cart
          .map(renderCartItem)
          .join("");


      cartCheckoutButton.classList.remove(
        "is-disabled"
      );

      cartCheckoutButton.removeAttribute(
        "aria-disabled"
      );

    }


    updateSummary();

    renderDiscoverProducts();

    bindCartEvents();

  };


  /* =========================================================
     UPDATE SUMMARY
     ========================================================= */

  const updateSummary = () => {

    const {
      subtotal,
      itemCount
    } = calculateTotals();


    cartSubtotal.textContent =
      formatPrice(
        subtotal,
        "KES"
      );


    cartTotal.textContent =
      formatPrice(
        subtotal,
        "KES"
      );


    cartSummaryCount.textContent =
      `${itemCount} ${
        itemCount === 1
          ? "item"
          : "items"
      }`;

  };


  /* =========================================================
     BIND CART EVENTS
     ========================================================= */

  const bindCartEvents = () => {

    cartProducts
      .querySelectorAll(
        ".cart-quantity-minus"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const productId =
              button.dataset.productId;


            const item =
              findCartItem(productId);


            if (!item) return;


            updateQuantity(
              productId,
              item.quantity - 1
            );

          }
        );

      });


    cartProducts
      .querySelectorAll(
        ".cart-quantity-plus"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const productId =
              button.dataset.productId;


            const item =
              findCartItem(productId);


            if (!item) return;


            updateQuantity(
              productId,
              item.quantity + 1
            );

          }
        );

      });


    cartProducts
      .querySelectorAll(
        ".cart-item-remove"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            removeProduct(
              button.dataset.productId
            );

          }
        );

      });

  };


  /* =========================================================
     BUILD DISCOVER PRODUCTS
     ========================================================= */

  const buildDiscoverProducts = () => {

    const cartProductIds =
      new Set(
        cart.map(
          item =>
            String(item.productId)
              .toLowerCase()
        )
      );


    discoverProducts =
      products.filter(
        product =>
          !cartProductIds.has(
            String(product.id)
              .toLowerCase()
          )
      );


    discoverIndex = 0;

  };


  /* =========================================================
     RENDER DISCOVER PRODUCTS
     ========================================================= */

  const renderDiscoverProducts = () => {

    buildDiscoverProducts();


    if (
      !discoverProducts.length ||
      cart.length === 0
    ) {

      cartDiscoverSection.hidden = true;

      cartDiscoverTrack.innerHTML = "";

      return;

    }


    cartDiscoverSection.hidden = false;


    cartDiscoverTrack.innerHTML =
      discoverProducts
        .map(
          product => {

            const image =
              getProductImage(product);


            const size =
              getProductSize(product);


            const amount =
              Number(
                product?.pricing?.amount
              ) || 0;


            const currency =
              product?.pricing?.currency ||
              "KES";


            return `

              <article
                class="cart-discover-card"
                data-discover-product="${escapeHTML(product.id)}"
              >

                <a
                  href="products.html?id=${encodeURIComponent(product.id)}"
                  class="cart-discover-image"
                >

                  <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(product.name)}"
                    loading="lazy"
                  >

                </a>


                <div class="cart-discover-info">

                  <a
                    href="products.html?id=${encodeURIComponent(product.id)}"
                    class="cart-discover-name"
                  >
                    ${escapeHTML(product.name)}
                  </a>


                  <p class="cart-discover-size">
                    ${escapeHTML(size)}
                  </p>


                  <p class="cart-discover-price">
                    ${formatPrice(amount, currency)}
                  </p>


                  <button
                    type="button"
                    class="cart-discover-add"
                    data-add-product="${escapeHTML(product.id)}"
                  >
                    Add to Cart
                  </button>

                </div>

              </article>

            `;

          }
        )
        .join("");


    updateDiscoverPosition();

    bindDiscoverEvents();

  };


  /* =========================================================
     DISCOVER EVENTS
     ========================================================= */

  const bindDiscoverEvents = () => {

    cartDiscoverTrack
      .querySelectorAll(
        ".cart-discover-add"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const productId =
              button.dataset.addProduct;


            const existing =
              findCartItem(productId);


            if (existing) {

              updateQuantity(
                productId,
                existing.quantity + 1
              );

            } else {

              updateQuantity(
                productId,
                1
              );

            }

          }
        );

      });

  };


  /* =========================================================
     DISCOVER POSITION
     ========================================================= */

  const updateDiscoverPosition = () => {

    if (!cartDiscoverTrack) return;


    const cards =
      cartDiscoverTrack.querySelectorAll(
        ".cart-discover-card"
      );


    if (!cards.length) return;


    const cardWidth =
      cards[0].getBoundingClientRect().width;


    const gap =
      window.innerWidth <= 700
        ? 10
        : 18;


    const offset =
      discoverIndex *
      (cardWidth + gap);


    cartDiscoverTrack.style.transform =
      `translateX(-${offset}px)`;


    const visibleCards =
      window.innerWidth <= 700
        ? 2
        : Math.max(
            1,
            Math.floor(
              cartDiscoverTrack.parentElement
                .getBoundingClientRect()
                .width /
              (cardWidth + gap)
            )
          );


    const maxIndex =
      Math.max(
        0,
        cards.length - visibleCards
      );


    cartDiscoverPrev.disabled =
      discoverIndex <= 0;


    cartDiscoverNext.disabled =
      discoverIndex >= maxIndex;

  };


  /* =========================================================
     DISCOVER NAVIGATION
     ========================================================= */

  cartDiscoverPrev?.addEventListener(
    "click",
    () => {

      discoverIndex =
        Math.max(
          0,
          discoverIndex - 1
        );


      updateDiscoverPosition();

    }
  );


  cartDiscoverNext?.addEventListener(
    "click",
    () => {

      const cards =
        cartDiscoverTrack
          ?.querySelectorAll(
            ".cart-discover-card"
          );


      if (!cards?.length) return;


      const cardWidth =
        cards[0]
          .getBoundingClientRect()
          .width;


      const gap =
        window.innerWidth <= 700
          ? 10
          : 18;


      const visibleCards =
        window.innerWidth <= 700
          ? 2
          : Math.max(
              1,
              Math.floor(
                cartDiscoverTrack
                  .parentElement
                  .getBoundingClientRect()
                  .width /
                (cardWidth + gap)
              )
            );


      const maxIndex =
        Math.max(
          0,
          cards.length - visibleCards
        );


      discoverIndex =
        Math.min(
          maxIndex,
          discoverIndex + 1
        );


      updateDiscoverPosition();

    }
  );


  /* =========================================================
     RESIZE
     ========================================================= */

  window.addEventListener(
    "resize",
    () => {

      updateDiscoverPosition();

    }
  );


  /* =========================================================
     LOAD PRODUCTS
     ========================================================= */

  const loadProducts = async () => {

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


      products =
        Array.isArray(data)
          ? data
          : data.products;


      if (!Array.isArray(products)) {

        throw new Error(
          "Products data is not available."
        );

      }


      cart =
        getStoredCart();


      renderCart();


      document.title =
        cart.length
          ? `Cart (${calculateTotals().itemCount}) — Remify`
          : "Your Cart — Remify";


    } catch (error) {

      console.error(
        "Remify cart error:",
        error
      );


      cartProducts.innerHTML = `

        <div class="cart-empty">

          <div class="cart-empty-mark">
            !
          </div>

          <span class="cart-eyebrow">
            REMIFY
          </span>

          <h2>
            We couldn't load your cart.
          </h2>

          <p>
            Please refresh the page and try again.
          </p>

          <button
            type="button"
            class="cart-empty-button"
            onclick="window.location.reload()"
          >
            Try Again
          </button>

        </div>

      `;

    }

  };


  /* =========================================================
     CHECKOUT
     ========================================================= */

  cartCheckoutButton?.addEventListener(
    "click",
    event => {

      if (!cart.length) {

        event.preventDefault();

        return;

      }


      /*
       * Cart lives in localStorage.
       *
       * Therefore checkout.html does not
       * need product IDs in the URL.
       */

      window.location.href =
        "checkout.html";

    }
  );


  /* =========================================================
     INITIALIZE
     ========================================================= */

  loadProducts();

});