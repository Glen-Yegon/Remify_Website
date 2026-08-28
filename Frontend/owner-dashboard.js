/* =========================================================
   REMIFY — OWNER DASHBOARD
   ========================================================= */

const API_BASE_URL = "http://localhost:5000";


document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadOwnerDashboard();


    loadAffiliatePayments();

    setupLogout();

    setupPaymentsRefresh();
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

/* =========================================================
   LOAD AFFILIATE PAYMENTS
   ========================================================= */

async function loadAffiliatePayments() {

  const listElement =
    document.getElementById(
      "affiliatePaymentsList"
    );

  const errorElement =
    document.getElementById(
      "affiliatePaymentsError"
    );

  try {

    const token =
      localStorage.getItem(
        "remifyOwnerToken"
      );

    if (!token) {
      return;
    }

    const response =
      await fetch(
        `${API_BASE_URL}/api/owner/affiliates/payments`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
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
        "Unable to load affiliate payments."
      );
    }

    renderAffiliatePayments(
      data.affiliates || []
    );

    if (errorElement) {
      errorElement.style.display = "none";
    }

  } catch (error) {

    console.error(
      "Affiliate payments error:",
      error
    );

    if (listElement) {
      listElement.innerHTML =
        `<p class="owner-payments-empty">Unable to load affiliate payments.</p>`;
    }

    if (errorElement) {
      errorElement.textContent =
        error.message ||
        "Unable to load affiliate payments.";
      errorElement.style.display = "block";
    }

  }

}


/* =========================================================
   RENDER AFFILIATE PAYMENTS
   ========================================================= */

function renderAffiliatePayments(affiliates) {

  const listElement =
    document.getElementById(
      "affiliatePaymentsList"
    );

  if (!listElement) {
    return;
  }

  if (!affiliates.length) {
    listElement.innerHTML =
      `<p class="owner-payments-empty">No approved affiliates yet.</p>`;
    return;
  }

  listElement.innerHTML =
    affiliates.map(affiliate => {

      const hasUnpaid =
        affiliate.unpaidCommission > 0;

      const lastPayout =
        affiliate.lastPayoutAt
          ? new Date(affiliate.lastPayoutAt).toLocaleDateString("en-KE")
          : "Never";

      return `
        <article class="owner-payment-card" data-affiliate-id="${affiliate.affiliateId}">

          <div>
            <div class="owner-payment-name">${escapeText(affiliate.fullName)}</div>
            <div class="owner-payment-phone">${escapeText(affiliate.phone || "No phone on file")}</div>
            <div class="owner-payment-meta">Last paid: ${lastPayout}</div>
          </div>

          <div class="owner-payment-grid">

            <div>
              <div class="owner-payment-metric-label">SALES THIS MONTH</div>
              <div class="owner-payment-metric-value">${affiliate.monthlySalesCount}</div>
            </div>

            <div>
              <div class="owner-payment-metric-label">MONTH VALUE</div>
              <div class="owner-payment-metric-value">${formatCurrency(affiliate.monthlySalesAmount)}</div>
            </div>

            <div>
              <div class="owner-payment-metric-label">TOTAL SALES MADE</div>
              <div class="owner-payment-metric-value">${formatCurrency(affiliate.totalSalesAmount)}</div>
            </div>

            <div>
              <div class="owner-payment-metric-label">TOTAL PAYABLE</div>
              <div class="owner-payment-metric-value">${formatCurrency(affiliate.totalCommission)}</div>
            </div>

          </div>

          <div class="owner-payment-unpaid">
            <div class="owner-payment-metric-label">UNPAID COMMISSION</div>
            <div class="owner-payment-metric-value">${formatCurrency(affiliate.unpaidCommission)}</div>
          </div>

          <button
            type="button"
            class="owner-payment-mark-button"
            data-affiliate-id="${affiliate.affiliateId}"
            ${hasUnpaid ? "" : "disabled"}
          >
            ${hasUnpaid ? "Mark as Paid" : "No unpaid commission"}
          </button>

        </article>
      `;

    }).join("");

  listElement
    .querySelectorAll(".owner-payment-mark-button")
    .forEach(button => {
      button.addEventListener("click", () => {
        markAffiliateAsPaid(
          button.dataset.affiliateId,
          button
        );
      });
    });

}


/* =========================================================
   MARK AFFILIATE AS PAID
   ========================================================= */

async function markAffiliateAsPaid(affiliateId, button) {

  const confirmed =
    window.confirm(
      "Confirm that you've sent this affiliate's payment externally. This will reset their unpaid commission to zero."
    );

  if (!confirmed) {
    return;
  }

  try {

    button.disabled = true;
    button.textContent = "Processing…";

    const token =
      localStorage.getItem(
        "remifyOwnerToken"
      );

    const response =
      await fetch(
        `${API_BASE_URL}/api/owner/affiliates/${affiliateId}/payout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            method: "external"
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
        "Unable to record payout."
      );
    }

    await loadAffiliatePayments();
    await loadOwnerDashboard();

  } catch (error) {

    console.error(
      "Mark as paid error:",
      error
    );

    alert(
      error.message ||
      "Unable to mark affiliate as paid."
    );

    button.disabled = false;
    button.textContent = "Mark as Paid";

  }

}


/* =========================================================
   PAYMENTS REFRESH BUTTON
   ========================================================= */

function setupPaymentsRefresh() {

  const button =
    document.getElementById(
      "refreshPaymentsButton"
    );

  if (!button) {
    return;
  }

  button.addEventListener(
    "click",
    () => {
      loadAffiliatePayments();
    }
  );

}


/* =========================================================
   ESCAPE TEXT
   ========================================================= */

function escapeText(value) {

  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;

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