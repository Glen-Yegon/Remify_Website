const API_BASE_URL = "http://localhost:5000";

document.addEventListener("DOMContentLoaded", () => {
  loadAffiliateDashboard();
  loadAffiliatePayouts();
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
   LOAD PAYOUT HISTORY
   ========================================================= */

async function loadAffiliatePayouts() {

  const payoutContainer =
    document.getElementById(
      "payoutHistory"
    );

  if (!payoutContainer) {
    return;
  }

  try {

    const token =
      localStorage.getItem(
        "remifyAffiliateToken"
      );

    if (!token) {
      window.location.href =
        "affiliate-login.html";
      return;
    }


    const response =
      await fetch(
        `${API_BASE_URL}/api/affiliate/payouts`,
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


    if (
      !response.ok ||
      !data.success
    ) {

      throw new Error(
        data.message ||
        "Unable to load payout history."
      );

    }


    renderAffiliatePayouts(
      data.payouts || []
    );

  } catch (error) {

    console.error(
      "Affiliate payout history error:",
      error
    );

    payoutContainer.innerHTML = `
      <div class="payout-history-error">
        Unable to load your payout history.
      </div>
    `;

  }

}

/* =========================================================
   RENDER PAYOUT HISTORY
   ========================================================= */

function renderAffiliatePayouts(payouts) {

  const container =
    document.getElementById(
      "payoutHistory"
    );

  if (!container) {
    return;
  }


  /* =========================================
     NO PAYOUTS
     ========================================= */

  if (!Array.isArray(payouts) || payouts.length === 0) {

    container.innerHTML = `
      <div class="payout-history-empty">

        <div class="payout-empty-mark">
          —
        </div>

        <div>

          <strong>
            No payouts yet
          </strong>

          <p>
            Your payout history will appear here once a commission has been paid.
          </p>

        </div>

      </div>
    `;

    return;
  }


  /* =========================================
     PAYOUTS
     ========================================= */

  container.innerHTML =
    payouts.map(payout => {

      const amount =
        formatCurrency(
          payout.amount
        );

      const date =
        formatPayoutDate(
          payout.paidAt
        );

      const method =
        formatPayoutMethod(
          payout.method
        );


      return `
        <article class="payout-item">

          <div class="payout-item-main">

            <div class="payout-item-icon">
              ✓
            </div>

            <div class="payout-item-info">

              <strong>
                ${escapePayoutText(method)} payout
              </strong>

              <span>
                Paid ${escapePayoutText(date)}
              </span>

            </div>

          </div>


          <div class="payout-item-right">

            <strong class="payout-item-amount">
              ${escapePayoutText(amount)}
            </strong>

            <span class="payout-status">
              Paid
            </span>

          </div>


          ${
            payout.reference
              ? `
                <div class="payout-item-meta">

                  <span>
                    Reference
                  </span>

                  <strong>
                    ${escapePayoutText(
                      payout.reference
                    )}
                  </strong>

                </div>
              `
              : ""
          }


          ${
            payout.notes
              ? `
                <div class="payout-item-notes">

                  ${escapePayoutText(
                    payout.notes
                  )}

                </div>
              `
              : ""
          }

        </article>
      `;

    }).join("");

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

/* =========================================================
   PAYOUT HELPERS
   ========================================================= */

function formatPayoutDate(value) {

  if (!value) {
    return "Date unavailable";
  }

  const date =
    new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(
    "en-KE",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  ).format(date);

}


function formatPayoutMethod(method) {

  if (!method) {
    return "External";
  }

  const labels = {

    mpesa: "M-Pesa",

    bank: "Bank",

    cash: "Cash",

    external: "External",

    other: "Other"

  };

  return (
    labels[
      String(method)
        .trim()
        .toLowerCase()
    ] ||
    capitalize(
      String(method)
    )
  );

}


function escapePayoutText(value) {

  return String(
    value ?? ""
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}

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