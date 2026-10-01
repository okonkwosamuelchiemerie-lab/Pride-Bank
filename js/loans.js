let LOANS_USER = null;

document.addEventListener("prideAuthReady", (e) => {
  LOANS_USER = e.detail;
  renderTiles();
  renderLoans();
  setupLoanForm();

  // Poll every couple seconds so a "pending" loan visibly updates to
  // approved/under-review without needing a page refresh.
  setInterval(() => {
    renderLoans();
    renderTiles();
  }, 2500);
});

function setFieldError(fieldId, hasError) {
  const field = document.getElementById(fieldId);
  if (field) field.classList.toggle("has-error", hasError);
}

function renderTiles() {
  const loans = PrideDB.getLoans(LOANS_USER.id);
  const active = loans.filter((l) => l.status !== "rejected");
  const totalBorrowed = loans
    .filter((l) => l.status === "approved")
    .reduce((sum, l) => sum + l.amount, 0);

  document.getElementById("availableCredit").textContent = PrideDB.formatCurrency(2000000 - totalBorrowed > 0 ? 2000000 - totalBorrowed : 0);
  document.getElementById("activeLoansCount").textContent = active.length;
  document.getElementById("totalBorrowed").textContent = PrideDB.formatCurrency(totalBorrowed);
}

function setupLoanForm() {
  const form = document.getElementById("loanForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const alertBox = document.getElementById("formAlert");
    alertBox.classList.remove("show");

    const amount = parseFloat(document.getElementById("loanAmount").value);
    const tenure = document.getElementById("tenure").value;
    const purpose = document.getElementById("purpose").value.trim();

    let valid = true;
    if (!amount || amount < 5000 || amount > 2000000) {
      setFieldError("amountField", true);
      valid = false;
    } else setFieldError("amountField", false);

    if (!tenure) {
      setFieldError("tenureField", true);
      valid = false;
    } else setFieldError("tenureField", false);

    if (!purpose || purpose.length < 5) {
      setFieldError("purposeField", true);
      valid = false;
    } else setFieldError("purposeField", false);

    if (!valid) {
      alertBox.textContent = "Please fix the highlighted fields before submitting.";
      alertBox.classList.add("show");
      return;
    }

    const btn = document.getElementById("loanBtn");
    btn.disabled = true;
    btn.textContent = "Submitting...";

    setTimeout(() => {
      PrideDB.applyForLoan({ userId: LOANS_USER.id, amount, tenure: `${tenure} months`, purpose });
      showToast("Loan application submitted — we'll update the status shortly.", "success");
      form.reset();
      btn.disabled = false;
      btn.textContent = "Submit application";
      renderLoans();
      renderTiles();
    }, 500);
  });
}

function statusBadge(status) {
  const map = {
    pending: ["badge-pending", "Pending"],
    approved: ["badge-approved", "Approved"],
    "under-review": ["badge-review", "Under review"],
    rejected: ["badge-debit", "Rejected"],
  };
  const [cls, label] = map[status] || ["badge-pending", status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function renderLoans() {
  const loans = PrideDB.getLoans(LOANS_USER.id);
  const body = document.getElementById("loansBody");

  if (loans.length === 0) {
    body.innerHTML = `<tr><td colspan="5"><div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke-width="2" stroke-linecap="round"/></svg>
      No loan applications yet.</div></td></tr>`;
    return;
  }

  body.innerHTML = loans
    .map(
      (l) => `
    <tr>
      <td data-label="Amount">${PrideDB.formatCurrency(l.amount)}</td>
      <td data-label="Tenure">${l.tenure}</td>
      <td data-label="Purpose">${escapeHtml(l.purpose)}</td>
      <td data-label="Applied">${PrideDB.formatDate(l.appliedAt)}</td>
      <td data-label="Status">${statusBadge(l.status)}</td>
    </tr>`
    )
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
