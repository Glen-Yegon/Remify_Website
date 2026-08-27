const API_BASE_URL = "http://localhost:5000";

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