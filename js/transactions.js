let ALL_TXNS = [];

document.addEventListener("prideAuthReady", (e) => {
  const user = e.detail;
  ALL_TXNS = PrideDB.getTransactions(user.id);
  renderTxns(ALL_TXNS);

  document.getElementById("searchInput").addEventListener("input", applyFilters);
  document.getElementById("typeFilter").addEventListener("change", applyFilters);
});

function applyFilters() {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  const type = document.getElementById("typeFilter").value;

  const filtered = ALL_TXNS.filter((t) => {
    const matchesQuery = !query || t.description.toLowerCase().includes(query);
    const matchesType = type === "all" || t.type === type;
    return matchesQuery && matchesType;
  });
  renderTxns(filtered);
}

function renderTxns(list) {
  const body = document.getElementById("txnBody");
  if (list.length === 0) {
    body.innerHTML = `<tr><td colspan="4"><div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h10" stroke-width="2" stroke-linecap="round"/></svg>
      No matching transactions.</div></td></tr>`;
    return;
  }
  body.innerHTML = list
    .map(
      (t) => `
    <tr>
      <td data-label="Description"><div class="txn-desc"><strong>${escapeHtml(t.description)}</strong>${t.meta && t.meta.narration ? `<span>${escapeHtml(t.meta.narration)}</span>` : ""}</div></td>
      <td data-label="Date">${PrideDB.formatDate(t.date)}</td>
      <td data-label="Type"><span class="badge ${t.type === "credit" ? "badge-credit" : "badge-debit"}">${t.type === "credit" ? "Credit" : "Debit"}</span></td>
      <td data-label="Amount" class="${t.type === "credit" ? "amount-credit" : "amount-debit"}">${t.type === "credit" ? "+" : "-"}${PrideDB.formatCurrency(t.amount)}</td>
    </tr>`
    )
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
