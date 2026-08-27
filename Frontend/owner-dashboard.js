/* =========================================================
   REMIFY — OWNER DASHBOARD
   ========================================================= */

const API_BASE_URL = "http://localhost:5000";


document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadOwnerDashboard();

    setupLogout();

  }
);



/* =========================================================
   LOAD DASHBOARD
   ========================================================= */

async function loadOwnerDashboard() {

  try {

    const token =
      localStorage.getItem(
        "remifyOwnerToken"
      );


    /* =========================================
       AUTHENTICATION
       ========================================= */

    if (!token) {

      window.location.href =
        "owner-login.html";

      return;

    }


    /* =========================================
       API REQUEST
       ========================================= */

    const response =
      await fetch(
        `${API_BASE_URL}/api/owner/dashboard`,
        {

          method: "GET",

          headers: {

            Authorization:
              `Bearer ${token}`

          }

        }
      );


    const data =
      await response.json();


    /* =========================================
       API ERROR
       ========================================= */

    if (
      !response.ok ||
      !data.success
    ) {

      throw new Error(
        data.message ||
        "Unable to load owner dashboard."
      );

    }


    /* =========================================
       POPULATE DASHBOARD
       ========================================= */

    populateOwnerDashboard(
      data.dashboard
    );


  } catch (error) {

    console.error(
      "Owner dashboard error:",
      error
    );


    const errorElement =
      document.getElementById(
        "ownerDashboardError"
      );


    if (errorElement) {

      errorElement.textContent =
        error.message ||
        "Unable to load dashboard.";

      errorElement.style.display =
        "block";

    }

  }

}



/* =========================================================
   POPULATE DASHBOARD
   ========================================================= */

function populateOwnerDashboard(
  dashboard
) {

  const affiliates =
    dashboard.affiliates || {};

  const sales =
    dashboard.sales || {};

  const commissions =
    dashboard.commissions || {};


  /* =========================================
     AFFILIATES
     ========================================= */

  setText(
    "totalAffiliates",
    affiliates.total
  );


  setText(
    "pendingAffiliates",
    affiliates.pending
  );


  setText(
    "approvedAffiliates",
    affiliates.approved
  );


  setText(
    "rejectedAffiliates",
    affiliates.rejected
  );


  /* =========================================
     SALES
     ========================================= */

  setText(
    "totalSales",
    sales.total
  );


  setText(
    "totalSalesAmount",
    formatCurrency(
      sales.totalAmount
    )
  );


  /* =========================================
     COMMISSIONS
     ========================================= */

  setText(
    "totalCommission",
    formatCurrency(
      commissions.total
    )
  );


  setText(
    "unpaidCommission",
    formatCurrency(
      commissions.unpaid
    )
  );

}



/* =========================================================
   SET TEXT
   ========================================================= */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(id);


  if (!element) {
    return;
  }


  element.textContent =
    value ?? "—";

}



/* =========================================================
   CURRENCY
   ========================================================= */

function formatCurrency(
  amount
) {

  const value =
    Number(amount || 0);


  return new Intl.NumberFormat(
    "en-KE",
    {

      style: "currency",

      currency: "KES",

      maximumFractionDigits: 0

    }
  ).format(value);

}



/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {

  const button =
    document.getElementById(
      "logoutButton"
    );


  if (!button) {
    return;
  }


  button.addEventListener(
    "click",
    () => {

      localStorage.removeItem(
        "remifyOwnerToken"
      );


      window.location.href =
        "owner-login.html";

    }
  );

}