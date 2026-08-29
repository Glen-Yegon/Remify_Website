document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     API CONFIGURATION
     ========================================================= */

  const API_BASE_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://localhost:5000"
      : "https://remify-website.onrender.com";


  /* =========================================================
     CHECKOUT STATE
     ========================================================= */

  const params =
    new URLSearchParams(window.location.search);


  /*
   * EXISTING PRODUCT CHECKOUT
   *
   * checkout.html?id=product-id&qty=2
   */

  const productId =
    params.get("id");


  let quantity =
    Math.max(
      1,
      Math.min(
        20,
        parseInt(
          params.get("qty") || "1",
          10
        ) || 1
      )
    );


  /*
   * CART CHECKOUT
   *
   * checkout.html
   */

  const CART_STORAGE_KEY =
    "remifyCart";


  /*
   * If an ID exists, this is the existing
   * single-product checkout.
   *
   * If no ID exists, this is cart checkout.
   */

  const isCartCheckout =
    !productId;


  let currentProduct =
    null;


  let products =
    [];


  let cart =
    [];


  /* =========================================================
     HELPERS
     ========================================================= */

  const $ =
    id => document.getElementById(id);


  const formatPrice =
    (amount, currency = "KES") => {

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


  const getProductImage =
    product => {

      const media =
        product?.media;


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
        Array.isArray(media) &&
        media.length
      ) {
        return media[0];
      }


      return "";

    };


  const getProductSize =
    product => {

      return (
        product?.details?.size ||
        product?.size ||
        product?.volume ||
        product?.details?.volume ||
        ""
      );

    };


  const getProductPrice =
    product => {

      return Number(
        product?.pricing?.amount ??
        product?.price ??
        0
      );

    };


  const getProductCurrency =
    product => {

      return String(
        product?.pricing?.currency ??
        product?.currency ??
        "KES"
      ).toUpperCase();

    };


  const escapeHTML =
    value => {

      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    };


  /* =========================================================
     CART STORAGE
     ========================================================= */

  const readCart =
    () => {

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
          "Remify cart read error:",
          error
        );


        return [];

      }

    };


  /*
   * Normalize different possible cart
   * item structures.
   *
   * Supported:
   *
   * {
   *   productId: "purple-sea-moss-gel",
   *   quantity: 2
   * }
   *
   * or:
   *
   * {
   *   id: "purple-sea-moss-gel",
   *   quantity: 2
   * }
   */

  const getCartProductId =
    item => {

      return String(
        item?.productId ??
        item?.id ??
        ""
      ).trim();

    };


  const getCartQuantity =
    item => {

      const parsed =
        Number(
          item?.quantity ?? 1
        );


      if (
        !Number.isInteger(parsed) ||
        parsed < 1
      ) {
        return 1;
      }


      return Math.min(
        20,
        parsed
      );

    };


  /* =========================================================
     UPDATE CART STORAGE
     ========================================================= */

  const saveCart =
    () => {

      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
      );

    };


  /* =========================================================
     FIND CART ITEM
     ========================================================= */

  const findCartItem =
    productIdToFind => {

      return cart.find(
        item =>
          getCartProductId(item) ===
          String(productIdToFind)
      );

    };


  /* =========================================================
     UPDATE CART ITEM QUANTITY
     ========================================================= */

  const changeCartQuantity =
    (cartProductId, change) => {

      const item =
        findCartItem(
          cartProductId
        );


      if (!item) {
        return;
      }


      const currentQuantity =
        getCartQuantity(item);


      const newQuantity =
        Math.max(
          1,
          Math.min(
            20,
            currentQuantity + change
          )
        );


      item.quantity =
        newQuantity;


      saveCart();


      renderCartSummary();

    };


  /* =========================================================
     REMOVE CART ITEM
     ========================================================= */

  const removeCartItem =
    cartProductId => {

      cart =
        cart.filter(
          item =>
            getCartProductId(item) !==
            String(cartProductId)
        );


      saveCart();


      renderCartSummary();

    };


  /* =========================================================
     UPDATE SINGLE PRODUCT URL
     ========================================================= */

  const updateURL =
    () => {

      if (
        !currentProduct ||
        isCartCheckout
      ) {
        return;
      }


      const url =
        new URL(
          window.location.href
        );


      url.searchParams.set(
        "id",
        currentProduct.id
      );


      url.searchParams.set(
        "qty",
        quantity
      );


      window.history.replaceState(
        {},
        "",
        url
      );

    };


  /* =========================================================
     SUMMARY TOTALS
     ========================================================= */

  const getCartTotals =
    () => {

      let subtotal = 0;

      let itemCount = 0;

      let currency = "KES";


      cart.forEach(
        item => {

          const product =
            products.find(
              product =>
                String(product.id).toLowerCase() ===
                getCartProductId(item).toLowerCase()
            );


          if (!product) {
            return;
          }


          const itemQuantity =
            getCartQuantity(item);


          const price =
            getProductPrice(product);


          currency =
            getProductCurrency(product);


          subtotal +=
            price * itemQuantity;


          itemCount +=
            itemQuantity;

        }
      );


      return {
        subtotal,
        itemCount,
        currency
      };

    };


  /* =========================================================
     RENDER SINGLE PRODUCT SUMMARY
     ========================================================= */

  const renderSingleProductSummary =
    () => {

      if (!currentProduct) {
        return;
      }


      const price =
        getProductPrice(
          currentProduct
        );


      const currency =
        getProductCurrency(
          currentProduct
        );


      const total =
        price * quantity;


      const image =
        getProductImage(
          currentProduct
        );


      const size =
        getProductSize(
          currentProduct
        );


      const summaryProducts =
        $("summaryProducts");


      if (!summaryProducts) {
        return;
      }


      summaryProducts.innerHTML = `

        <div
          class="summary-product"
          data-product-id="${escapeHTML(currentProduct.id)}"
        >

          <div class="summary-product-image">

            <img
              src="${escapeHTML(image)}"
              alt="${escapeHTML(currentProduct.name || "Remify product")}"
            >

          </div>


          <div class="summary-product-info">

            <div class="summary-product-top">

              <div>

                <span class="summary-product-brand">
                  REMIFY
                </span>

                <h3>
                  ${escapeHTML(
                    currentProduct.name ||
                    "Remify Product"
                  )}
                </h3>

              </div>


              <strong>
                ${formatPrice(
                  price,
                  currency
                )}
              </strong>

            </div>


            <div class="summary-product-bottom">

              <span>
                ${escapeHTML(size)}
              </span>


              <div class="summary-quantity">

                <button
                  type="button"
                  id="summaryQuantityMinus"
                  aria-label="Decrease quantity"
                >
                  −
                </button>


                <span id="summaryQuantity">
                  ${quantity}
                </span>


                <button
                  type="button"
                  id="summaryQuantityPlus"
                  aria-label="Increase quantity"
                >
                  +
                </button>

              </div>

            </div>

          </div>

        </div>

      `;


      const subtotal =
        $("summarySubtotal");


      const totalElement =
        $("summaryTotal");


      const itemCount =
        $("summaryItemCount");


      if (subtotal) {

        subtotal.textContent =
          formatPrice(
            total,
            currency
          );

      }


      if (totalElement) {

        totalElement.textContent =
          formatPrice(
            total,
            currency
          );

      }


      if (itemCount) {

        itemCount.textContent =
          `${quantity} ${
            quantity === 1
              ? "item"
              : "items"
          }`;

      }


      document.title =
        `Checkout — ${
          currentProduct.name ||
          "Remify"
        }`;


      $("summaryQuantityMinus")
        ?.addEventListener(
          "click",
          () => {

            changeQuantity(-1);

          }
        );


      $("summaryQuantityPlus")
        ?.addEventListener(
          "click",
          () => {

            changeQuantity(1);

          }
        );

    };


  /* =========================================================
     RENDER CART SUMMARY
     ========================================================= */

  const renderCartSummary =
    () => {

      if (!isCartCheckout) {
        return;
      }


      const summaryProducts =
        $("summaryProducts");


      if (!summaryProducts) {
        return;
      }


      const totals =
        getCartTotals();


      /*
       * Remove cart items whose products
       * no longer exist in products.json.
       */

      const validCart =
        cart.filter(
          item =>
            products.some(
              product =>
                String(product.id).toLowerCase() ===
                getCartProductId(item).toLowerCase()
            )
        );


      if (
        validCart.length !==
        cart.length
      ) {

        cart =
          validCart;


        saveCart();

      }


      if (!cart.length) {

        summaryProducts.innerHTML = `

          <div class="checkout-empty-cart">

            <span class="checkout-eyebrow">
              YOUR CART
            </span>

            <h3>
              Your cart is empty.
            </h3>

            <p>
              Add something from the Remify collection
              before continuing to checkout.
            </p>

            <a href="index.html">
              Continue shopping
            </a>

          </div>

        `;


        if ($("summarySubtotal")) {
          $("summarySubtotal").textContent =
            formatPrice(0, "KES");
        }


        if ($("summaryTotal")) {
          $("summaryTotal").textContent =
            formatPrice(0, "KES");
        }


        if ($("summaryItemCount")) {
          $("summaryItemCount").textContent =
            "0 items";
        }


        document.title =
          "Checkout — Remify";


        return;

      }


      summaryProducts.innerHTML = "";


      cart.forEach(
        item => {

          const product =
            products.find(
              product =>
                String(product.id).toLowerCase() ===
                getCartProductId(item).toLowerCase()
            );


          if (!product) {
            return;
          }


          const itemQuantity =
            getCartQuantity(item);


          const price =
            getProductPrice(product);


          const currency =
            getProductCurrency(product);


          const image =
            getProductImage(product);


          const size =
            getProductSize(product);


          const itemTotal =
            price * itemQuantity;


          const itemElement =
            document.createElement(
              "div"
            );


          itemElement.className =
            "summary-product";


          itemElement.dataset.productId =
            product.id;


          itemElement.innerHTML = `

            <div class="summary-product-image">

              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(product.name || "Remify product")}"
              >

            </div>


            <div class="summary-product-info">

              <div class="summary-product-top">

                <div>

                  <span class="summary-product-brand">
                    REMIFY
                  </span>

                  <h3>
                    ${escapeHTML(
                      product.name ||
                      "Remify Product"
                    )}
                  </h3>

                </div>


                <strong>
                  ${formatPrice(
                    itemTotal,
                    currency
                  )}
                </strong>

              </div>


              <div class="summary-product-bottom">

                <span>
                  ${escapeHTML(size)}
                </span>


                <div class="summary-quantity">

                  <button
                    type="button"
                    class="cart-quantity-minus"
                    data-product-id="${escapeHTML(product.id)}"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>


                  <span>
                    ${itemQuantity}
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


                <button
                  type="button"
                  class="cart-remove-item"
                  data-product-id="${escapeHTML(product.id)}"
                  aria-label="Remove ${escapeHTML(product.name || "product")}"
                >
                  Remove
                </button>

              </div>

            </div>

          `;


          summaryProducts.appendChild(
            itemElement
          );

        }
      );


      const finalTotals =
        getCartTotals();


      if ($("summarySubtotal")) {

        $("summarySubtotal").textContent =
          formatPrice(
            finalTotals.subtotal,
            finalTotals.currency
          );

      }


      if ($("summaryTotal")) {

        $("summaryTotal").textContent =
          formatPrice(
            finalTotals.subtotal,
            finalTotals.currency
          );

      }


      if ($("summaryItemCount")) {

        $("summaryItemCount").textContent =
          `${finalTotals.itemCount} ${
            finalTotals.itemCount === 1
              ? "item"
              : "items"
          }`;

      }


      document.title =
        "Checkout — Remify";


      /*
       * Quantity buttons
       */

      summaryProducts
        .querySelectorAll(
          ".cart-quantity-minus"
        )
        .forEach(
          button => {

            button.addEventListener(
              "click",
              () => {

                changeCartQuantity(
                  button.dataset.productId,
                  -1
                );

              }
            );

          }
        );


      summaryProducts
        .querySelectorAll(
          ".cart-quantity-plus"
        )
        .forEach(
          button => {

            button.addEventListener(
              "click",
              () => {

                changeCartQuantity(
                  button.dataset.productId,
                  1
                );

              }
            );

          }
        );


      /*
       * Remove buttons
       */

      summaryProducts
        .querySelectorAll(
          ".cart-remove-item"
        )
        .forEach(
          button => {

            button.addEventListener(
              "click",
              () => {

                removeCartItem(
                  button.dataset.productId
                );

              }
            );

          }
        );

    };


  /* =========================================================
     SINGLE PRODUCT QUANTITY
     ========================================================= */

  const changeQuantity =
    change => {

      if (
        !currentProduct ||
        isCartCheckout
      ) {
        return;
      }


      quantity =
        Math.max(
          1,
          Math.min(
            20,
            quantity + change
          )
        );


      updateURL();


      renderSingleProductSummary();

    };


  /* =========================================================
     ERROR STATE
     ========================================================= */

  const showError =
    message => {

      const checkoutPage =
        $("checkoutPage");


      if (!checkoutPage) {
        return;
      }


      checkoutPage.innerHTML = `

        <div class="checkout-error-state">

          <div>

            <span class="checkout-eyebrow">
              REMIFY
            </span>

            <h1>
              We couldn't load your order.
            </h1>

            <p>
              ${escapeHTML(message)}
            </p>

            <a href="index.html">
              Back to Remify
            </a>

          </div>

        </div>

      `;

    };


  /* =========================================================
     LOAD PRODUCTS
     ========================================================= */

  const loadProducts =
    async () => {

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


        /*
         * =====================================================
         * EXISTING SINGLE PRODUCT FLOW
         * =====================================================
         */

        if (!isCartCheckout) {

          currentProduct =
            products.find(
              product =>
                String(product.id)
                  .toLowerCase() ===
                String(productId)
                  .toLowerCase()
            );


          if (!currentProduct) {

            showError(
              "That product could not be found."
            );

            return;

          }


          renderSingleProductSummary();


          return;

        }


        /*
         * =====================================================
         * NEW CART FLOW
         * =====================================================
         */

        cart =
          readCart();


        if (!cart.length) {

          renderCartSummary();

          return;

        }


        renderCartSummary();

      } catch (error) {

        console.error(
          "Remify checkout error:",
          error
        );


        showError(
          "Something went wrong while loading your order."
        );

      }

    };


  /* =========================================================
     FORM
     ========================================================= */

  const form =
    $("checkoutForm");


  /* =========================================================
     FIELD VALIDATION
     ========================================================= */

  const validateField =
    field => {

      const value =
        field.value.trim();


      const error =
        field.parentElement
          ?.querySelector(
            ".field-error"
          );


      field.parentElement
        ?.classList.remove(
          "has-error"
        );


      if (error) {
        error.textContent = "";
      }


      /*
       * REQUIRED
       */

      if (
        field.required &&
        !value
      ) {

        if (error) {

          error.textContent =
            "This field is required.";

        }


        field.parentElement
          ?.classList.add(
            "has-error"
          );


        return false;

      }


      /*
       * EMAIL
       */

      if (
        field.type === "email" &&
        value
      ) {

        const valid =
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(value);


        if (!valid) {

          if (error) {

            error.textContent =
              "Enter a valid email address.";

          }


          field.parentElement
            ?.classList.add(
              "has-error"
            );


          return false;

        }

      }


      /*
       * PHONE
       */

      if (
        field.id === "phone" &&
        value
      ) {

        const digits =
          value.replace(
            /\D/g,
            ""
          );


        if (digits.length < 9) {

          if (error) {

            error.textContent =
              "Enter a valid phone number.";

          }


          field.parentElement
            ?.classList.add(
              "has-error"
            );


          return false;

        }

      }


      return true;

    };


  form?.querySelectorAll(
    "input"
  ).forEach(
    input => {

      input.addEventListener(
        "blur",
        () => validateField(input)
      );


      input.addEventListener(
        "input",
        () => {

          if (
            input.parentElement
              .classList.contains(
                "has-error"
              )
          ) {

            validateField(input);

          }

        }
      );

    }
  );


  /* =========================================================
     BUILD CUSTOMER + DELIVERY DATA
     ========================================================= */

  const buildCustomerOrderData =
    () => {

      const formData =
        new FormData(form);


      return {

        customer: {

          fullName:
            String(
              formData.get("fullName") || ""
            ).trim(),

          email:
            String(
              formData.get("email") || ""
            ).trim(),

          phone:
            String(
              formData.get("phone") || ""
            ).trim()

        },


        delivery: {

          country:
            String(
              formData.get("country") || ""
            ).trim(),

          city:
            String(
              formData.get("city") || ""
            ).trim(),

          address:
            String(
              formData.get("address") || ""
            ).trim(),

          apartment:
            String(
              formData.get("apartment") || ""
            ).trim()

        },


        affiliateCode:
          localStorage.getItem(
            "remifyAffiliateCode"
          ) || null

      };

    };


  /* =========================================================
     PAYMENT BUTTON
     ========================================================= */

  const button =
    $("paymentButton");


  const buttonText =
    button?.querySelector(
      "span"
    );


  const setProcessing =
    text => {

      button?.classList.add(
        "is-processing"
      );


      if (buttonText) {

        buttonText.textContent =
          text;

      }


      if (button) {

        button.disabled = true;

      }

    };


  const resetButton =
    () => {

      button?.classList.remove(
        "is-processing"
      );


      if (buttonText) {

        buttonText.textContent =
          "Continue to payment";

      }


      if (button) {

        button.disabled = false;

      }

    };


  /* =========================================================
     PAYMENT FORM SUBMISSION
     ========================================================= */

  form?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      /*
       * =====================================
       * VALIDATE FORM
       * =====================================
       */

      const fields =
        [
          ...form.querySelectorAll(
            "input[required]"
          )
        ];


      const valid =
        fields.every(
          validateField
        );


      if (!valid) {

        const firstInvalid =
          form.querySelector(
            ".has-error input"
          );


        firstInvalid?.focus();


        return;

      }


      /*
       * =====================================
       * CART VALIDATION
       * =====================================
       */

      if (isCartCheckout) {

        cart =
          readCart();


        if (!cart.length) {

          showCheckoutPaymentError(
            "Your cart is empty. Please add a product before continuing."
          );


          return;

        }

      } else {

        if (!currentProduct) {

          showCheckoutPaymentError(
            "We couldn't find the selected product. Please return to the product page and try again."
          );


          return;

        }

      }


      /*
       * =====================================
       * CUSTOMER + DELIVERY
       * =====================================
       */

      const customerData =
        buildCustomerOrderData();


      /*
       * =====================================
       * BUILD ORDER
       * =====================================
       *
       * IMPORTANT:
       *
       * Single-product checkout keeps the
       * EXACT existing order structure.
       *
       * Cart checkout uses a separate
       * `items` structure.
       */

      let order;


      if (isCartCheckout) {

        order = {

          mode: "cart",

          items:
            cart.map(
              item => ({

                productId:
                  getCartProductId(item),

                quantity:
                  getCartQuantity(item)

              })
            ),

          customer:
            customerData.customer,

          delivery:
            customerData.delivery,

          affiliateCode:
            customerData.affiliateCode

        };

      } else {

        /*
         * ===================================
         * EXISTING PRODUCT ORDER
         * ===================================
         */

        order = {

          productId:
            currentProduct.id,

          quantity,


          customer:
            customerData.customer,


          delivery:
            customerData.delivery,


          affiliateCode:
            customerData.affiliateCode

        };

      }


      /* =====================================================
         PAYMENT INITIALIZATION
         ===================================================== */

      try {

        setProcessing(
          "Preparing secure payment..."
        );


        /*
         * Existing product checkout:
         *
         * /api/payment/initialize
         *
         * New cart checkout:
         *
         * /api/payment/initialize-cart
         */

        const endpoint =
          isCartCheckout
            ? "/api/payment/initialize-cart"
            : "/api/payment/initialize";


        const response =
          await fetch(
            `${API_BASE_URL}${endpoint}`,
            {

              method: "POST",

              headers: {

                "Content-Type":
                  "application/json"

              },

              body:
                JSON.stringify(order)

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
            "We couldn't prepare your payment."
          );

        }


        /*
         * =====================================
         * SAVE PENDING ORDER
         * =====================================
         */

        sessionStorage.setItem(
          "remifyPendingOrder",
          JSON.stringify(order)
        );


        /*
         * =====================================
         * SAVE PAYMENT REFERENCE
         * =====================================
         */

        if (data.reference) {

          sessionStorage.setItem(
            "remifyPaymentReference",
            data.reference
          );

        }


        /*
         * =====================================
         * OPEN PAYSTACK
         * =====================================
         */

        setProcessing(
          "Opening secure payment..."
        );


        if (!data.authorizationUrl) {

          throw new Error(
            "We couldn't open the secure payment page. Please try again."
          );

        }


        /*
         * IMPORTANT:
         *
         * Paystack is opened using a normal
         * redirect.
         *
         * No iframe.
         * No popup.
         */

        window.location.href =
          data.authorizationUrl;


      } catch (error) {

        console.error(
          "Remify payment error:",
          error
        );


        resetButton();


        showCheckoutPaymentError(
          error.message ||
          "We couldn't start your payment. Please try again."
        );

      }

    }
  );


  /* =========================================================
     CHECKOUT STATUS ELEMENTS
     ========================================================= */

  const checkoutStatus =
    $("checkoutStatus");


  const checkoutStatusIcon =
    $("checkoutStatusIcon");


  const checkoutStatusTitle =
    $("checkoutStatusTitle");


  const checkoutStatusMessage =
    $("checkoutStatusMessage");


  const checkoutStatusReference =
    $("checkoutStatusReference");


  const checkoutStatusAction =
    $("checkoutStatusAction");


  const checkoutStatusClose =
    $("checkoutStatusClose");


  /* =========================================================
     CHECKOUT STATUS
     ========================================================= */

  const showCheckoutStatus =
    ({
      icon = "✦",
      title = "Processing your order",
      message = "Please wait.",
      reference = "",
      actionText = "Continue",
      showAction = false
    } = {}) => {

      if (!checkoutStatus) {
        return;
      }


      checkoutStatusIcon.textContent =
        icon;


      checkoutStatusTitle.textContent =
        title;


      checkoutStatusMessage.textContent =
        message;


      checkoutStatusReference.textContent =
        reference
          ? `Order reference: ${reference}`
          : "";


      checkoutStatusAction.textContent =
        actionText;


      checkoutStatusAction.style.display =
        showAction
          ? "inline-flex"
          : "none";


      checkoutStatus.classList.add(
        "is-visible"
      );


      checkoutStatus.setAttribute(
        "aria-hidden",
        "false"
      );


      document.body.classList.add(
        "checkout-status-open"
      );

    };


  const hideCheckoutStatus =
    () => {

      checkoutStatus?.classList.remove(
        "is-visible"
      );


      checkoutStatus?.setAttribute(
        "aria-hidden",
        "true"
      );


      document.body.classList.remove(
        "checkout-status-open"
      );

    };


  const showCheckoutSuccess =
    reference => {

      showCheckoutStatus({

        icon: "✓",

        title:
          "Your order is confirmed.",

        message:
          "Payment has been verified and your order details have been received. We've also sent a confirmation to your email.",

        reference,

        actionText:
          "Done",

        showAction:
          true

      });

    };


  const showCheckoutPaymentError =
    message => {

      showCheckoutStatus({

        icon: "!",

        title:
          "Payment needs your attention.",

        message,

        actionText:
          "Try again",

        showAction:
          true

      });

    };


  checkoutStatusClose?.addEventListener(
    "click",
    hideCheckoutStatus
  );


  checkoutStatusAction?.addEventListener(
    "click",
    hideCheckoutStatus
  );


  /* =========================================================
     MENU
     ========================================================= */

  const menu =
    $("checkoutMenu");


  const menuToggle =
    $("checkoutMenuToggle");


  const menuClose =
    $("checkoutMenuClose");


  const openMenu =
    () => {

      menu?.classList.add(
        "is-open"
      );


      menu?.setAttribute(
        "aria-hidden",
        "false"
      );


      menuToggle?.setAttribute(
        "aria-expanded",
        "true"
      );


      document.body.classList.add(
        "menu-open"
      );

    };


  const closeMenu =
    () => {

      menu?.classList.remove(
        "is-open"
      );


      menu?.setAttribute(
        "aria-hidden",
        "true"
      );


      menuToggle?.setAttribute(
        "aria-expanded",
        "false"
      );


      document.body.classList.remove(
        "menu-open"
      );

    };


  menuToggle?.addEventListener(
    "click",
    openMenu
  );


  menuClose?.addEventListener(
    "click",
    closeMenu
  );


  menu?.querySelectorAll(
    "a"
  ).forEach(
    link => {

      link.addEventListener(
        "click",
        closeMenu
      );

    }
  );


  document.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {

        closeMenu();

      }

    }
  );


  menu?.addEventListener(
    "click",
    event => {

      if (event.target === menu) {

        closeMenu();

      }

    }
  );


  /* =========================================================
     INITIALIZE CHECKOUT
     ========================================================= */

  loadProducts();


  /* =========================================================
     REMIFY SCROLL PROGRESS
     ========================================================= */

  const scrollFill =
    document.getElementById(
      "scrollFill"
    );


  const updateScrollProgress =
    () => {

      if (!scrollFill) {
        return;
      }


      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        0;


      const scrollHeight =
        document.documentElement.scrollHeight -
        window.innerHeight;


      const progress =
        scrollHeight > 0
          ? Math.min(
              1,
              Math.max(
                0,
                scrollTop / scrollHeight
              )
            )
          : 0;


      scrollFill.style.transform =
        `scaleY(${progress})`;

    };


  window.addEventListener(
    "scroll",
    updateScrollProgress,
    {
      passive: true
    }
  );


  window.addEventListener(
    "resize",
    updateScrollProgress
  );


  updateScrollProgress();


  /* =========================================================
     REMIFY CUSTOM CURSOR
     ========================================================= */

  const cursorCanvas =
    document.getElementById(
      "cursorTrail"
    );


  const cursorSpark =
    document.getElementById(
      "cursorSpark"
    );


  if (
    cursorCanvas &&
    cursorSpark
  ) {

    const cursorContext =
      cursorCanvas.getContext(
        "2d"
      );


    let cursorWidth =
      window.innerWidth;


    let cursorHeight =
      window.innerHeight;


    let mouseX =
      cursorWidth / 2;


    let mouseY =
      cursorHeight / 2;


    let currentX =
      mouseX;


    let currentY =
      mouseY;


    const trail = [];


    const TRAIL_LENGTH =
      18;


    const resizeCursorCanvas =
      () => {

        cursorWidth =
          window.innerWidth;


        cursorHeight =
          window.innerHeight;


        const dpr =
          Math.min(
            window.devicePixelRatio || 1,
            2
          );


        cursorCanvas.width =
          cursorWidth * dpr;


        cursorCanvas.height =
          cursorHeight * dpr;


        cursorCanvas.style.width =
          `${cursorWidth}px`;


        cursorCanvas.style.height =
          `${cursorHeight}px`;


        cursorContext.setTransform(
          dpr,
          0,
          0,
          dpr,
          0,
          0
        );

      };


    const moveCursor =
      event => {

        mouseX =
          event.clientX;


        mouseY =
          event.clientY;


        cursorSpark.style.left =
          `${mouseX}px`;


        cursorSpark.style.top =
          `${mouseY}px`;


        trail.push({

          x: mouseX,

          y: mouseY

        });


        if (
          trail.length >
          TRAIL_LENGTH
        ) {

          trail.shift();

        }

      };


    const drawCursorTrail =
      () => {

        cursorContext.clearRect(
          0,
          0,
          cursorWidth,
          cursorHeight
        );


        currentX +=
          (mouseX - currentX) *
          0.18;


        currentY +=
          (mouseY - currentY) *
          0.18;


        if (
          trail.length > 1
        ) {

          cursorContext.beginPath();


          trail.forEach(
            (point, index) => {

              if (index === 0) {

                cursorContext.moveTo(
                  point.x,
                  point.y
                );

              } else {

                cursorContext.lineTo(
                  point.x,
                  point.y
                );

              }

            }
          );


          cursorContext.strokeStyle =
            "rgba(91,45,130,.18)";


          cursorContext.lineWidth =
            1.2;


          cursorContext.lineCap =
            "round";


          cursorContext.lineJoin =
            "round";


          cursorContext.stroke();

        }


        requestAnimationFrame(
          drawCursorTrail
        );

      };


    resizeCursorCanvas();


    drawCursorTrail();


    window.addEventListener(
      "resize",
      resizeCursorCanvas
    );


    window.addEventListener(
      "mousemove",
      moveCursor,
      {
        passive: true
      }
    );


    const interactiveElements =
      document.querySelectorAll(
        "a,button,input,select,textarea,[role='button']"
      );


    interactiveElements.forEach(
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

});