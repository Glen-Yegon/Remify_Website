const API_BASE_URL = "http://localhost:5000";

document.addEventListener("DOMContentLoaded", () => {
  loadAffiliateDashboard();
  setupDashboardActions();
});


/* =========================================================
   LOAD DASHBOARD
   ========================================================= */

async function loadAffiliateDashboard() {

  try {

    const token =
      localStorage.getItem("remifyAffiliateToken");

    if (!token) {
      window.location.href = "affiliate-login.html";
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/affiliate/dashboard`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
        "Unable to load affiliate dashboard."
      );
    }

    populateAffiliateDashboard(
      data.affiliate
    );

  } catch (error) {

    console.error(
      "Affiliate dashboard error:",
      error
    );

    localStorage.removeItem(
      "remifyAffiliateToken"
    );

    window.location.href =
      "affiliate-login.html";

  }

}


/* =========================================================
   POPULATE DASHBOARD
   ========================================================= */

function populateAffiliateDashboard(affiliate) {

  /* =========================================
     USER HEADER
     ========================================= */

  setText(
    "userName",
    affiliate.fullName
  );

  const firstName =
    String(affiliate.fullName || "")
      .trim()
      .split(/\s+/)[0];

  setText(
    "welcomeName",
    firstName
      ? `, ${firstName}`
      : ""
  );


  /* =========================================
     USER AVATAR
     ========================================= */

  const initial =
    firstName
      ? firstName.charAt(0).toUpperCase()
      : "—";

  setText(
    "userInitial",
    initial
  );


  /* =========================================
     ACCOUNT INFORMATION
     ========================================= */

  setText(
    "accountName",
    affiliate.fullName
  );

  setText(
    "accountEmail",
    affiliate.email
  );

  setText(
    "accountPhone",
    affiliate.phone
  );


  /* =========================================
     SALES
     ========================================= */

  setText(
    "totalSales",
    affiliate.totalSales
  );

  setText(
    "totalSalesAmount",
    formatCurrency(
      affiliate.totalSalesAmount
    )
  );


  /* =========================================
     COMMISSIONS
     ========================================= */

  setText(
    "totalCommission",
    formatCurrency(
      affiliate.totalCommission
    )
  );

  setText(
    "unpaidCommission",
    formatCurrency(
      affiliate.unpaidCommission
    )
  );


  /* =========================================
     REFERRAL LINK
     ========================================= */

  if (affiliate.referralCode) {

    const referralLink =
      `${window.location.origin}/?ref=${encodeURIComponent(
        affiliate.referralCode
      )}`;

    setText(
      "referralLink",
      referralLink
    );

  } else {

    setText(
      "referralLink",
      "Referral link unavailable"
    );

  }


  /* =========================================
     COMMISSION RATE
     ========================================= */

  const rate =
    Number(affiliate.commissionRate || 0) * 100;

  setText(
    "commissionRate",
    `${rate}%`
  );


  /* =========================================
     STATUS
     ========================================= */

  const status =
    capitalize(
      affiliate.status
    );

  setText(
    "affiliateStatus",
    status
  );


  /* =========================================
     STATUS CLASS
     ========================================= */

  const statusElement =
    document.getElementById(
      "affiliateStatus"
    );

  if (statusElement) {

    statusElement.classList.remove(
      "status-approved",
      "status-pending",
      "status-rejected"
    );

    if (affiliate.status) {

      statusElement.classList.add(
        `status-${affiliate.status}`
      );

    }

  }

}


/* =========================================================
   DASHBOARD ACTIONS
   ========================================================= */

function setupDashboardActions() {

  /* =========================================
     COPY REFERRAL LINK
     ========================================= */

  const copyButton =
    document.getElementById(
      "copyReferralButton"
    );

  if (copyButton) {

    copyButton.addEventListener(
      "click",
      copyReferralLink
    );

  }


  /* =========================================
     LOGOUT
     ========================================= */

  const logoutButton =
    document.getElementById(
      "logoutButton"
    );

  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      logoutAffiliate
    );

  }

}


/* =========================================================
   COPY REFERRAL LINK
   ========================================================= */

async function copyReferralLink() {

  const referralElement =
    document.getElementById(
      "referralLink"
    );

  const messageElement =
    document.getElementById(
      "copyMessage"
    );

  const button =
    document.getElementById(
      "copyReferralButton"
    );

  if (!referralElement) {
    return;
  }

  const link =
    referralElement.textContent.trim();

  if (
    !link ||
    link === "Loading..." ||
    link === "Referral link unavailable"
  ) {
    return;
  }

  try {

    await navigator.clipboard.writeText(
      link
    );

    if (messageElement) {

      messageElement.textContent =
        "Referral link copied.";

    }

    if (button) {

      const originalText =
        button.textContent;

      button.textContent =
        "Copied";

      setTimeout(() => {

        button.textContent =
          originalText;

      }, 1800);

    }

    setTimeout(() => {

      if (messageElement) {
        messageElement.textContent = "";
      }

    }, 2500);

  } catch (error) {

    console.error(
      "Copy referral link error:",
      error
    );

    if (messageElement) {

      messageElement.textContent =
        "Unable to copy the link. Please copy it manually.";

    }

  }

}


/* =========================================================
   LOGOUT
   ========================================================= */

function logoutAffiliate() {

  localStorage.removeItem(
    "remifyAffiliateToken"
  );

  window.location.replace(
    "affiliate-login.html"
  );

}


/* =========================================================
   HELPERS
   ========================================================= */

function setText(id, value) {

  const element =
    document.getElementById(id);

  if (!element) {
    return;
  }

  element.textContent =
    value ?? "—";

}


function formatCurrency(amount) {

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


function capitalize(value) {

  if (!value) {
    return "—";
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );

}