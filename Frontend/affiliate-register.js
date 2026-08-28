/* =========================================================
   REMIFY — AFFILIATE REGISTRATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     CONFIGURATION
  ======================================================= */

const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://remify-website.onrender.com";


  /* =======================================================
     ELEMENTS
  ======================================================= */

  const form =
    document.getElementById("affiliateRegisterForm");

  const submitButton =
    document.getElementById("submitButton");

  const formMessage =
    document.getElementById("formMessage");

  const successState =
    document.getElementById("successState");

  const referralCode =
    document.getElementById("referralCode");

  const fullNameInput =
    document.getElementById("fullName");

  const emailInput =
    document.getElementById("email");

  const phoneInput =
    document.getElementById("phone");

  const passwordInput =
    document.getElementById("password");

  const confirmPasswordInput =
    document.getElementById("confirmPassword");

  const termsInput =
    document.getElementById("terms");

  const socialPlatformInput =
  document.getElementById("socialPlatform");

  const socialHandleInput =
  document.getElementById("socialHandle");

  /* =======================================================
     SAFETY CHECK
  ======================================================= */

if (
  !form ||
  !submitButton ||
  !fullNameInput ||
  !emailInput ||
  !phoneInput ||
  !socialPlatformInput ||
  !socialHandleInput ||
  !passwordInput ||
  !confirmPasswordInput ||
  !termsInput
) {

  console.error(
    "Remify affiliate registration: required elements are missing."
  );

  return;

}


  /* =======================================================
     ERROR HELPERS
  ======================================================= */

  const getErrorElement = (fieldName) => {

    return document.getElementById(
      `${fieldName}Error`
    );

  };


  const setFieldError = (
    fieldName,
    message = ""
  ) => {

    const input =
      document.getElementById(fieldName);

    const errorElement =
      getErrorElement(fieldName);

    if (errorElement) {
      errorElement.textContent = message;
    }

    const wrapper =
      input?.closest(".input-wrap");

    if (wrapper) {

      wrapper.classList.toggle(
        "has-error",
        Boolean(message)
      );

    }

  };


  const clearErrors = () => {

    [
      "fullName",
      "email",
      "phone",
      "password",
      "confirmPassword"
    ].forEach(field => {

      setFieldError(field, "");

    });

    const termsError =
      document.getElementById("termsError");

    if (termsError) {
      termsError.textContent = "";
    }

  };


  /* =======================================================
     FORM MESSAGE
  ======================================================= */

  const showMessage = (
    message,
    type = "error"
  ) => {

    formMessage.textContent = message;

    formMessage.className =
      `form-message is-visible is-${type}`;

  };


  const hideMessage = () => {

    formMessage.textContent = "";

    formMessage.className =
      "form-message";

  };


  /* =======================================================
     VALIDATION
  ======================================================= */

  const validateForm = () => {

    clearErrors();

    hideMessage();

    let valid = true;


    /* ===============================================
       FULL NAME
    =============================================== */

    const fullName =
      fullNameInput.value.trim();

    if (!fullName) {

      setFieldError(
        "fullName",
        "Please enter your full name."
      );

      valid = false;

    }


    /* ===============================================
       EMAIL
    =============================================== */

    const email =
      emailInput.value.trim();

    if (!email) {

      setFieldError(
        "email",
        "Please enter your email address."
      );

      valid = false;

    } else {

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email)) {

        setFieldError(
          "email",
          "Please enter a valid email address."
        );

        valid = false;

      }

    }


    /* ===============================================
       PHONE
    =============================================== */

    const phone =
      phoneInput.value.trim();

    if (!phone) {

      setFieldError(
        "phone",
        "Please enter your phone number."
      );

      valid = false;

    } else {

      const digitsOnly =
        phone.replace(/\D/g, "");

      if (digitsOnly.length < 7) {

        setFieldError(
          "phone",
          "Please enter a valid phone number."
        );

        valid = false;

      }

    }

    /* ===============================================
   SOCIAL MEDIA PLATFORM
=============================================== */

const socialPlatform =
  socialPlatformInput.value.trim();

if (!socialPlatform) {

  setFieldError(
    "socialPlatform",
    "Please select a social media platform."
  );

  valid = false;

}


/* ===============================================
   SOCIAL MEDIA HANDLE
=============================================== */

const socialHandle =
  socialHandleInput.value.trim();

if (!socialHandle) {

  setFieldError(
    "socialHandle",
    "Please enter your social media handle."
  );

  valid = false;

}


    /* ===============================================
       PASSWORD
    =============================================== */

    const password =
      passwordInput.value;

    if (!password) {

      setFieldError(
        "password",
        "Please create a password."
      );

      valid = false;

    } else if (password.length < 8) {

      setFieldError(
        "password",
        "Password must be at least 8 characters."
      );

      valid = false;

    }


    /* ===============================================
       CONFIRM PASSWORD
    =============================================== */

    const confirmPassword =
      confirmPasswordInput.value;

    if (!confirmPassword) {

      setFieldError(
        "confirmPassword",
        "Please confirm your password."
      );

      valid = false;

    } else if (
      password !== confirmPassword
    ) {

      setFieldError(
        "confirmPassword",
        "Passwords do not match."
      );

      valid = false;

    }


    /* ===============================================
       TERMS
    =============================================== */

    if (!termsInput.checked) {

      const termsError =
        document.getElementById("termsError");

      if (termsError) {

        termsError.textContent =
          "Please agree to the affiliate program terms.";

      }

      valid = false;

    }


    return valid;

  };


  /* =======================================================
     LOADING STATE
  ======================================================= */

  const setLoading = (loading) => {

    submitButton.disabled =
      loading;

    submitButton.classList.toggle(
      "is-loading",
      loading
    );

  };


  /* =======================================================
     PASSWORD VISIBILITY
  ======================================================= */

  const passwordToggles =
    document.querySelectorAll(
      ".password-toggle"
    );


  passwordToggles.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const targetId =
          button.dataset.target;

        const input =
          document.getElementById(targetId);

        if (!input) return;


        const showing =
          input.type === "text";


        input.type =
          showing
            ? "password"
            : "text";


        button.setAttribute(
          "aria-label",
          showing
            ? "Show password"
            : "Hide password"
        );

      }
    );

  });


  /* =======================================================
     LIVE ERROR CLEARING
  ======================================================= */

[
  fullNameInput,
  emailInput,
  phoneInput,
  socialPlatformInput,
  socialHandleInput,
  passwordInput,
  confirmPasswordInput
].forEach(input => {

    input.addEventListener(
      "input",
      () => {

        const fieldName =
          input.id;

        setFieldError(
          fieldName,
          ""
        );

        if (formMessage.classList.contains("is-visible")) {
          hideMessage();
        }

      }
    );

  });


  termsInput.addEventListener(
    "change",
    () => {

      const termsError =
        document.getElementById("termsError");

      if (termsError) {
        termsError.textContent = "";
      }

    }
  );


  /* =======================================================
     SUBMIT
  ======================================================= */

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      /* =============================================
         VALIDATE
      ============================================= */

      if (!validateForm()) {

        const firstError =
          form.querySelector(
            ".input-wrap.has-error input"
          );

        if (firstError) {
          firstError.focus();
        }

        return;

      }


      /* =============================================
         VALUES
      ============================================= */

      const fullName =
        fullNameInput.value.trim();

      const email =
        emailInput.value.trim().toLowerCase();

      const phone =
        phoneInput.value.trim();

const socialPlatform =
  socialPlatformInput.value.trim();

const socialHandle =
  socialHandleInput.value.trim();

      const password =
        passwordInput.value;


      /* =============================================
         LOADING
      ============================================= */

      setLoading(true);

      hideMessage();


      try {

        /* =========================================
           API REQUEST
        ========================================= */

        const response =
          await fetch(
            `${API_BASE_URL}/api/affiliate/register`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

body: JSON.stringify({

  fullName,

  email,

  phone,

  socialPlatform,

  socialHandle,

  password

})

            }
          );


        /* =========================================
           RESPONSE
        ========================================= */

        let data = null;

        try {

          data =
            await response.json();

        } catch {

          data = null;

        }


        /* =========================================
           SERVER ERROR
        ========================================= */

        if (!response.ok || !data?.success) {

          const serverMessage =
            data?.message ||
            "We couldn't submit your application. Please try again.";

          showMessage(
            serverMessage,
            "error"
          );

          return;

        }


        /* =========================================
           SUCCESS
        ========================================= */

        const generatedReferralCode =
          data?.affiliate?.referralCode ||
          "Pending";


        referralCode.textContent =
          generatedReferralCode;


        /* =========================================
           HIDE FORM
        ========================================= */

        form.hidden = true;


        /* =========================================
           HIDE FORM HEADER
        ========================================= */

        const formHeader =
          document.querySelector(".form-header");

        if (formHeader) {
          formHeader.hidden = true;
        }


        /* =========================================
           SHOW SUCCESS
        ========================================= */

        successState.hidden = false;


        /* =========================================
           SCROLL
        ========================================= */

        successState.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });


      } catch (error) {

        console.error(
          "Affiliate registration request failed:",
          error
        );


        showMessage(
          "We couldn't connect to Remify. Please check your connection and try again.",
          "error"
        );

      } finally {

        setLoading(false);

      }

    }
  );

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