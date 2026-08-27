/* =========================================================
   REMIFY — AFFILIATE LOGIN
   ========================================================= */

const API_BASE_URL = "http://localhost:5000";

const loginForm =
  document.getElementById("affiliateLoginForm");

const loginButton =
  document.getElementById("affiliateLoginButton");

const loginMessage =
  document.getElementById("affiliateLoginMessage");

const emailInput =
  document.getElementById("affiliateEmail");

const passwordInput =
  document.getElementById("affiliatePassword");


/* =========================================================
   MESSAGE
   ========================================================= */

const showLoginMessage = (message, type = "error") => {

  loginMessage.textContent = message;

  loginMessage.className =
    `affiliate-auth-message ${type}`;

};


/* =========================================================
   LOADING STATE
   ========================================================= */

const setLoginLoading = (loading) => {

  loginButton.disabled = loading;

  loginButton.classList.toggle(
    "is-loading",
    loading
  );

  const buttonText =
    loginButton.querySelector(".button-text");

  if (loading) {

    buttonText.textContent =
      "Signing in...";

  } else {

    buttonText.textContent =
      "Sign in";

  }

};


/* =========================================================
   LOGIN
   ========================================================= */

loginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    showLoginMessage("");

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;


    if (!email || !password) {

      showLoginMessage(
        "Please enter your email and password."
      );

      return;

    }


    setLoginLoading(true);


    try {

      const response =
        await fetch(
          `${API_BASE_URL}/api/affiliate/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              email,
              password
            })
          }
        );


      const data =
        await response.json();


      /* =====================================================
         LOGIN FAILED
         ===================================================== */

      if (!response.ok || !data.success) {

        showLoginMessage(
          data.message ||
          "We couldn't sign you in. Please try again."
        );

        return;

      }


      /* =====================================================
         STORE SESSION
         ===================================================== */

      localStorage.setItem(
        "remifyAffiliateToken",
        data.token
      );


      localStorage.setItem(
        "remifyAffiliateId",
        data.affiliate.affiliateId
      );


      /* =====================================================
         REDIRECT
         ===================================================== */

      window.location.href =
        "affiliate-dashboard.html";


    } catch (error) {

      console.error(
        "Affiliate login error:",
        error
      );

      showLoginMessage(
        "Unable to connect to Remify. Please try again."
      );

    } finally {

      setLoginLoading(false);

    }

  }
);