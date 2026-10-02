let CARDS_USER = null;

document.addEventListener("prideAuthReady", (e) => {
  CARDS_USER = e.detail;
  renderCards();
});

function maskCardNumber(num) {
  return num.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, "$1 $2•• •••$4".replace("$4", num.slice(-4)));
}

function renderCards() {
  const cards = PrideDB.getCards(CARDS_USER.id);
  const wrap = document.getElementById("cardsWrap");

  if (cards.length === 0) {
    wrap.innerHTML = `<div class="panel"><div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" stroke-width="2"/></svg>
      No cards yet.</div></div>`;
    return;
  }

  wrap.innerHTML = cards
    .map((card, i) => {
      const isPending = card.status === "pending";
      const isFrozen = card.status === "frozen";
      return `
      <div class="panel" style="max-width:420px; margin:0 auto 24px;">
        <div class="virtual-card-wrap">
          <div class="virtual-card" data-card-id="${card.id}" tabindex="0" role="button" aria-label="Flip sample card">
            <div class="vc-face front">
              <div class="vc-row"><span>Sample card</span><span>${isPending ? "Pending" : isFrozen ? "Frozen" : "Active"}</span></div>
              <div class="chip"></div>
              <div class="vc-number">•••• •••• •••• ${card.cardNumber.slice(-4)}</div>
              <div class="vc-row"><span>${escapeHtml(CARDS_USER.fullName)}</span><span>Exp ${card.expiry}</span></div>
            </div>
            <div class="vc-face back">
              <div class="magstripe"></div>
              <div class="cvv-strip">DEMO ONLY · NO PAYMENT CARD</div>
            </div>
          </div>
        </div>
        <div class="card-status-row">
          <span class="badge ${isPending ? "badge-pending" : isFrozen ? "badge-frozen" : "badge-active"}">${isPending ? "Pending activation" : isFrozen ? "Frozen" : "Active"}</span>
        </div>
        ${
          !isPending
            ? `<div class="card-status-row">
                <label class="switch">
                  <input type="checkbox" class="freeze-toggle" data-card-id="${card.id}" ${isFrozen ? "checked" : ""} />
                  <span class="track"></span>
                </label>
                <span style="font-size:0.9rem;">${isFrozen ? "Unfreeze this card" : "Freeze this card"}</span>
              </div>`
            : `<p class="text-center" style="font-size:0.85rem; color:var(--gray-600);">Your replacement card is being processed and will be active shortly.</p>`
        }
      </div>`;
    })
    .join("") + `
    <div class="text-center">
      <button class="btn btn-outline" id="requestCardBtn">Add sample card</button>
    </div>`;

  wrap.querySelectorAll(".virtual-card").forEach((el) => {
    el.addEventListener("click", () => el.classList.toggle("flipped"));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        el.classList.toggle("flipped");
      }
    });
  });

  wrap.querySelectorAll(".freeze-toggle").forEach((toggle) => {
    toggle.addEventListener("change", () => {
      const cardId = toggle.dataset.cardId;
      const newStatus = toggle.checked ? "frozen" : "active";
      PrideDB.updateCardStatus(cardId, newStatus);
      showToast(newStatus === "frozen" ? "Card frozen." : "Card unfrozen.", "success");
      renderCards();
    });
  });

  const requestBtn = document.getElementById("requestCardBtn");
  if (requestBtn) {
    requestBtn.addEventListener("click", () => {
      PrideDB.createCard(CARDS_USER.id, "Verve Classic");
      showToast("New card requested — it'll show as pending until activated.", "success");
      renderCards();
    });
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
