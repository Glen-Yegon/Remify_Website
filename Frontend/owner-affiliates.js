/* =========================================================
   REMIFY — OWNER AFFILIATE MANAGEMENT
   ========================================================= */

const API_BASE_URL = "http://localhost:5000";

let currentAffiliateId = null;


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadAffiliateData();

    setupLogout();

    setupModal();

  }
);



/* =========================================================
   LOAD AFFILIATES
   ========================================================= */

async function loadAffiliateData() {

  try {

    const token =
      localStorage.getItem(
        "remifyOwnerToken"
      );


    if (!token) {

      window.location.href =
        "owner-login.html";

      return;

    }


    const response =
      await fetch(
        `${API_BASE_URL}/api/owner/affiliates`,
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
      response.status === 401 ||
      response.status === 403
    ) {

      localStorage.removeItem(
        "remifyOwnerToken"
      );

      window.location.href =
        "owner-login.html";

      return;

    }


    if (
      !response.ok ||
      !data.success
    ) {

      throw new Error(
        data.message ||
        "Unable to load affiliates."
      );

    }


    console.log(
      "Owner affiliates:",
      data
    );


    populateAffiliatePage(
      data.affiliates
    );


  } catch (error) {

    console.error(
      "Affiliate management error:",
      error
    );


    showError(
      error.message ||
      "Unable to load affiliates."
    );

  }

}



/* =========================================================
   POPULATE PAGE
   ========================================================= */

function populateAffiliatePage(
  affiliates
) {

  if (!Array.isArray(affiliates)) {

    showError(
      "Invalid affiliate data received from server."
    );

    return;

  }


  updateSummary(
    affiliates
  );


  renderAffiliateTable(
    affiliates
  );


  renderAffiliateCards(
    affiliates
  );


  setText(
    "affiliateCount",
    `${affiliates.length} affiliate${
      affiliates.length === 1
        ? ""
        : "s"
    }`
  );

}



/* =========================================================
   SUMMARY
   ========================================================= */

function updateSummary(
  affiliates
) {

  const total =
    affiliates.length;


  const pending =
    affiliates.filter(
      affiliate =>
        affiliate.status === "pending"
    ).length;


  const approved =
    affiliates.filter(
      affiliate =>
        affiliate.status === "approved"
    ).length;


  const rejected =
    affiliates.filter(
      affiliate =>
        affiliate.status === "rejected"
    ).length;


  setText(
    "totalAffiliates",
    total
  );


  setText(
    "pendingAffiliates",
    pending
  );


  setText(
    "approvedAffiliates",
    approved
  );


  setText(
    "rejectedAffiliates",
    rejected
  );

}



/* =========================================================
   TABLE
   ========================================================= */

function renderAffiliateTable(
  affiliates
) {

  const tbody =
    document.getElementById(
      "affiliateTableBody"
    );


  if (!tbody) {
    return;
  }


  if (!affiliates.length) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="table-loading"
        >
          No affiliates found.
        </td>
      </tr>
    `;

    return;

  }


  tbody.innerHTML =
    affiliates.map(
      affiliate =>
        createAffiliateRow(
          affiliate
        )
    ).join("");


  tbody
    .querySelectorAll(
      ".review-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const affiliateId =
            button.dataset.affiliateId;


          const affiliate =
            affiliates.find(
              item =>
                item.affiliateId ===
                affiliateId
            );


          if (affiliate) {

            openAffiliateModal(
              affiliate
            );

          }

        }
      );

    });

}



/* =========================================================
   TABLE ROW
   ========================================================= */

function createAffiliateRow(
  affiliate
) {

  const status =
    affiliate.status ||
    "pending";


  return `
    <tr>

      <td>

        <div class="affiliate-name">

          <strong>
            ${escapeHTML(
              affiliate.fullName ||
              "Unnamed affiliate"
            )}
          </strong>

          <span>
            ${escapeHTML(
              affiliate.affiliateId ||
              ""
            )}
          </span>

        </div>

      </td>


      <td>

        <div class="affiliate-contact">

          <span>
            ${escapeHTML(
              affiliate.email ||
              "—"
            )}
          </span>

          <span>
            ${escapeHTML(
              affiliate.phone ||
              "—"
            )}
          </span>

        </div>

      </td>


      <td>

        <span class="referral-code">
          ${escapeHTML(
            affiliate.referralCode ||
            "—"
          )}
        </span>

      </td>


      <td>
        ${Number(
          affiliate.totalSales || 0
        )}
      </td>


      <td>
        ${formatCurrency(
          affiliate.totalCommission
        )}
      </td>


      <td>

        <span
          class="status-badge ${escapeHTML(
            status
          )}"
        >
          ${escapeHTML(
            capitalize(status)
          )}
        </span>

      </td>


      <td>

        <button
          type="button"
          class="review-button"
          data-affiliate-id="${escapeHTML(
            affiliate.affiliateId || ""
          )}"
        >
          Review
        </button>

      </td>

    </tr>
  `;

}



/* =========================================================
   MOBILE CARDS
   ========================================================= */

function renderAffiliateCards(
  affiliates
) {

  const container =
    document.getElementById(
      "affiliateCards"
    );


  if (!container) {
    return;
  }


  if (!affiliates.length) {

    container.innerHTML = `
      <div class="affiliate-loading-card">
        No affiliates found.
      </div>
    `;

    return;

  }


  container.innerHTML =
    affiliates.map(
      affiliate =>
        createAffiliateCard(
          affiliate
        )
    ).join("");


  container
    .querySelectorAll(
      ".review-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const affiliateId =
            button.dataset.affiliateId;


          const affiliate =
            affiliates.find(
              item =>
                item.affiliateId ===
                affiliateId
            );


          if (affiliate) {

            openAffiliateModal(
              affiliate
            );

          }

        }
      );

    });

}



/* =========================================================
   MOBILE CARD
   ========================================================= */

function createAffiliateCard(
  affiliate
) {

  const status =
    affiliate.status ||
    "pending";


  return `
    <article class="mobile-affiliate-card">

      <div class="mobile-affiliate-top">

        <div class="affiliate-name">

          <strong>
            ${escapeHTML(
              affiliate.fullName ||
              "Unnamed affiliate"
            )}
          </strong>

          <span>
            ${escapeHTML(
              affiliate.email ||
              "—"
            )}
          </span>

        </div>


        <span
          class="status-badge ${escapeHTML(
            status
          )}"
        >
          ${escapeHTML(
            capitalize(status)
          )}
        </span>

      </div>


      <div class="mobile-affiliate-details">

        <div>

          <span>
            Referral
          </span>

          <strong class="referral-code">
            ${escapeHTML(
              affiliate.referralCode ||
              "—"
            )}
          </strong>

        </div>


        <div>

          <span>
            Sales
          </span>

          <strong>
            ${Number(
              affiliate.totalSales || 0
            )}
          </strong>

        </div>


        <div>

          <span>
            Commission
          </span>

          <strong>
            ${formatCurrency(
              affiliate.totalCommission
            )}
          </strong>

        </div>

      </div>


      <button
        type="button"
        class="review-button mobile-review-button"
        data-affiliate-id="${escapeHTML(
          affiliate.affiliateId || ""
        )}"
      >
        Review affiliate
      </button>

    </article>
  `;

}



/* =========================================================
   MODAL SETUP
   ========================================================= */

function setupModal() {

  const closeButton =
    document.getElementById(
      "closeAffiliateModal"
    );


  const backdrop =
    document.querySelector(
      ".affiliate-modal-backdrop"
    );


  const approveButton =
    document.getElementById(
      "approveAffiliateButton"
    );


  const rejectButton =
    document.getElementById(
      "rejectAffiliateButton"
    );


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeAffiliateModal
    );

  }


  if (backdrop) {

    backdrop.addEventListener(
      "click",
      closeAffiliateModal
    );

  }


  if (approveButton) {

    approveButton.addEventListener(
      "click",
      () => {

        if (!currentAffiliateId) {
          return;
        }

        updateAffiliateStatus(
          currentAffiliateId,
          "approve"
        );

      }
    );

  }


  if (rejectButton) {

    rejectButton.addEventListener(
      "click",
      () => {

        if (!currentAffiliateId) {
          return;
        }

        updateAffiliateStatus(
          currentAffiliateId,
          "reject"
        );

      }
    );

  }


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {

        closeAffiliateModal();

      }

    }
  );

}



/* =========================================================
   OPEN MODAL
   ========================================================= */

function openAffiliateModal(
  affiliate
) {

  const modal =
    document.getElementById(
      "affiliateModal"
    );


  const content =
    document.getElementById(
      "affiliateModalContent"
    );


  if (!modal || !content) {
    return;
  }


  currentAffiliateId =
    affiliate.affiliateId;


  content.innerHTML = `

    <div class="modal-detail">

      <span>
        Name
      </span>

      <strong>
        ${escapeHTML(
          affiliate.fullName ||
          "—"
        )}
      </strong>

    </div>


    <div class="modal-detail">

      <span>
        Email
      </span>

      <strong>
        ${escapeHTML(
          affiliate.email ||
          "—"
        )}
      </strong>

    </div>


    <div class="modal-detail">

      <span>
        Phone
      </span>

      <strong>
        ${escapeHTML(
          affiliate.phone ||
          "—"
        )}
      </strong>

    </div>


    <div class="modal-detail">

      <span>
        Referral code
      </span>

      <strong>
        ${escapeHTML(
          affiliate.referralCode ||
          "—"
        )}
      </strong>

    </div>


    <div class="modal-detail">

      <span>
        Sales
      </span>

      <strong>
        ${Number(
          affiliate.totalSales || 0
        )}
      </strong>

    </div>


    <div class="modal-detail">

      <span>
        Sales value
      </span>

      <strong>
        ${formatCurrency(
          affiliate.totalSalesAmount
        )}
      </strong>

    </div>


    <div class="modal-detail">

      <span>
        Commission
      </span>

      <strong>
        ${formatCurrency(
          affiliate.totalCommission
        )}
      </strong>

    </div>


    <div class="modal-detail">

      <span>
        Commission rate
      </span>

      <strong>
        ${
          Number(
            affiliate.commissionRate || 0
          ) * 100
        }%
      </strong>

    </div>


    <div class="modal-detail">

      <span>
        Status
      </span>

      <strong>
        ${escapeHTML(
          capitalize(
            affiliate.status
          )
        )}
      </strong>

    </div>

  `;


  const approveButton =
    document.getElementById(
      "approveAffiliateButton"
    );


  const rejectButton =
    document.getElementById(
      "rejectAffiliateButton"
    );


  if (approveButton) {

    approveButton.style.display =
      affiliate.status === "approved"
        ? "none"
        : "block";

  }


  if (rejectButton) {

    rejectButton.style.display =
      affiliate.status === "rejected"
        ? "none"
        : "block";

  }


  modal.classList.add(
    "active"
  );


  modal.setAttribute(
    "aria-hidden",
    "false"
  );

}



/* =========================================================
   UPDATE AFFILIATE STATUS
   ========================================================= */

async function updateAffiliateStatus(
  affiliateId,
  action
) {

  const token =
    localStorage.getItem(
      "remifyOwnerToken"
    );


  if (!token) {

    window.location.href =
      "owner-login.html";

    return;

  }


  const endpoint =
    `${API_BASE_URL}/api/owner/affiliates/${encodeURIComponent(
      affiliateId
    )}/${action}`;


  const buttonId =
    action === "approve"
      ? "approveAffiliateButton"
      : "rejectAffiliateButton";


  const button =
    document.getElementById(
      buttonId
    );


  const originalText =
    button
      ? button.textContent
      : "";


  try {

    if (action === "reject") {

      const confirmed =
        window.confirm(
          "Are you sure you want to reject this affiliate?"
        );


      if (!confirmed) {
        return;
      }

    }


    if (button) {

      button.disabled = true;

      button.textContent =
        action === "approve"
          ? "Approving..."
          : "Rejecting...";

    }


    const response =
      await fetch(
        endpoint,
        {

          method: "POST",

          headers: {

            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json"

          }

        }
      );


    const data =
      await response.json();


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      localStorage.removeItem(
        "remifyOwnerToken"
      );

      window.location.href =
        "owner-login.html";

      return;

    }


    if (
      !response.ok ||
      !data.success
    ) {

      throw new Error(
        data.message ||
        `Unable to ${action} affiliate.`
      );

    }


    console.log(
      `Affiliate ${action} successful:`,
      data
    );


    closeAffiliateModal();


    await loadAffiliateData();


    showSuccess(
      data.message ||
      `Affiliate ${action}d successfully.`
    );


  } catch (error) {

    console.error(
      `Affiliate ${action} error:`,
      error
    );


    showError(
      error.message ||
      `Unable to ${action} affiliate.`
    );


  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        originalText;

    }

  }

}



/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeAffiliateModal() {

  const modal =
    document.getElementById(
      "affiliateModal"
    );


  if (!modal) {
    return;
  }


  modal.classList.remove(
    "active"
  );


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  currentAffiliateId =
    null;

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
   HELPERS
   ========================================================= */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (!element) {
    return;
  }


  element.textContent =
    value ?? "—";

}



function formatCurrency(
  amount
) {

  const value =
    Number(
      amount || 0
    );


  return new Intl.NumberFormat(
    "en-KE",
    {

      style: "currency",

      currency: "KES",

      maximumFractionDigits: 0

    }
  ).format(value);

}



function capitalize(
  value
) {

  if (!value) {
    return "—";
  }


  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );

}



function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}



function showError(
  message
) {

  const errorElement =
    document.getElementById(
      "ownerAffiliateError"
    );


  if (!errorElement) {

    console.error(
      message
    );

    return;

  }


  errorElement.textContent =
    message;


  errorElement.style.display =
    "block";


  setTimeout(
    () => {

      errorElement.style.display =
        "none";

    },
    5000
  );

}



function showSuccess(
  message
) {

  const successElement =
    document.getElementById(
      "ownerAffiliateSuccess"
    );


  if (!successElement) {

    console.log(
      message
    );

    return;

  }


  successElement.textContent =
    message;


  successElement.style.display =
    "block";


  setTimeout(
    () => {

      successElement.style.display =
        "none";

    },
    5000
  );

}