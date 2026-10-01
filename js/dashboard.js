document.addEventListener("prideAuthReady", (e) => {
  const user = e.detail;
  renderBalance(user);
  renderRecentTransactions(user);
  maybeShowWelcome();
  setupEyeToggle(user);
});

let BALANCE_VISIBLE = true;

function renderBalance(user) {
  document.getElementById("balanceAmount").textContent = PrideDB.formatCurrency(user.balance);
  document.getElementById("acctName").textContent = user.fullName;
  document.getElementById("acctNumber").textContent = user.accountNumber;
}

function setupEyeToggle(user) {
  const btn = document.getElementById("eyeToggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    BALANCE_VISIBLE = !BALANCE_VISIBLE;
    const amountEl = document.getElementById("balanceAmount");
    amountEl.textContent = BALANCE_VISIBLE
      ? PrideDB.formatCurrency(user.balance)
      : "₦ •••••••";
  });
}

function renderRecentTransactions(user) {
  const txns = PrideDB.getTransactions(user.id).slice(0, 6);
  const body = document.getElementById("recentTxnBody");
  if (!body) return;

  if (txns.length === 0) {
    body.innerHTML = `<tr><td colspan="4"><div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h10" stroke-width="2" stroke-linecap="round"/></svg>
      No transactions yet.</div></td></tr>`;
    return;
  }

  body.innerHTML = txns
    .map(
      (t) => `
    <tr>
      <td data-label="Description"><div class="txn-desc"><strong>${escapeHtml(t.description)}</strong></div></td>
      <td data-label="Date">${PrideDB.formatDate(t.date)}</td>
      <td data-label="Type"><span class="badge ${t.type === "credit" ? "badge-credit" : "badge-debit"}">${t.type === "credit" ? "Credit" : "Debit"}</span></td>
      <td data-label="Amount" class="${t.type === "credit" ? "amount-credit" : "amount-debit"}">${t.type === "credit" ? "+" : "-"}${PrideDB.formatCurrency(t.amount)}</td>
    </tr>`
    )
    .join("");
}

function maybeShowWelcome() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("welcome") === "1") {
    setTimeout(() => showToast("Account created! Welcome to Pride Bank.", "success"), 300);
    // Clean the URL so a refresh doesn't repeat the toast
    window.history.replaceState({}, "", "dashboard.html");
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
