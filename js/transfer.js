const DEMO_PIN = "1234";
let PENDING_TRANSFER = null;

document.addEventListener("prideAuthReady", (e) => {
  const user = e.detail;
  renderFromAccount(user);
  setupAccountLookup(user);
  setupTransferForm(user);
  setupPinModal(user);
});

function renderFromAccount(user) {
  document.getElementById("fromName").textContent = user.fullName;
  document.getElementById("fromAccount").textContent = user.accountNumber;
  document.getElementById("fromBalance").textContent = PrideDB.formatCurrency(user.balance);
}

function setupAccountLookup(user) {
  const input = document.getElementById("toAccount");
  const hint = document.getElementById("recipientHint");
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "").slice(0, 10);
    const match = PrideDB.getUsers().find((u) => u.accountNumber === input.value);
    if (input.value.length === 10 && match && match.id !== user.id) {
      hint.textContent = `Recipient: ${match.fullName}`;
      hint.style.color = "var(--success)";
    } else if (input.value.length === 10 && match && match.id === user.id) {
      hint.textContent = "That's your own account number.";
      hint.style.color = "var(--danger)";
    } else if (input.value.length === 10) {
      hint.textContent = "No Pride Bank account found with that number.";
      hint.style.color = "var(--danger)";
    } else {
      hint.textContent = "We'll show the recipient's name once it matches an account.";
      hint.style.color = "";
    }
  });
}

function setFieldError(fieldId, hasError) {
  const field = document.getElementById(fieldId);
  if (field) field.classList.toggle("has-error", hasError);
}

function setupTransferForm(user) {
  const form = document.getElementById("transferForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const alertBox = document.getElementById("formAlert");
    alertBox.classList.remove("show");

    const toAccount = document.getElementById("toAccount").value.trim();
    const amount = parseFloat(document.getElementById("amount").value);
    const narration = document.getElementById("narration").value.trim();

    let valid = true;
    if (!/^\d{10}$/.test(toAccount)) {
      setFieldError("acctField", true);
      valid = false;
    } else setFieldError("acctField", false);

    if (!amount || amount <= 0 || amount > user.balance) {
      setFieldError("amountField", true);
      valid = false;
    } else setFieldError("amountField", false);

    if (!valid) {
      alertBox.textContent = "Please fix the highlighted fields before continuing.";
      alertBox.classList.add("show");
      return;
    }

    const recipient = PrideDB.getUsers().find((u) => u.accountNumber === toAccount);
    if (!recipient || recipient.id === user.id) {
      alertBox.textContent = !recipient
        ? "No Pride Bank account found with that number."
        : "You can't transfer to your own account.";
      alertBox.classList.add("show");
      return;
    }

    PENDING_TRANSFER = { toAccount, amount, narration, recipientName: recipient.fullName };
    document.getElementById("confirmSummary").textContent =
      `Send ${PrideDB.formatCurrency(amount)} to ${recipient.fullName} (${toAccount})`;
    openPinModal();
  });
}

function openPinModal() {
  const modal = document.getElementById("pinModal");
  modal.classList.add("show");
  document.getElementById("pinError").style.display = "none";
  const digits = modal.querySelectorAll(".pin-digit");
  digits.forEach((d) => (d.value = ""));
  digits[0].focus();
}

function closePinModal() {
  document.getElementById("pinModal").classList.remove("show");
}

function setupPinModal(user) {
  const digits = document.querySelectorAll(".pin-digit");
  digits.forEach((input, idx) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 1);
      if (input.value && digits[idx + 1]) digits[idx + 1].focus();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && digits[idx - 1]) digits[idx - 1].focus();
    });
  });

  document.getElementById("cancelPinBtn").addEventListener("click", closePinModal);

  document.getElementById("confirmPinBtn").addEventListener("click", () => {
    const pin = Array.from(digits).map((d) => d.value).join("");
    if (pin.length < 4) {
      document.getElementById("pinError").textContent = "Enter all 4 digits.";
      document.getElementById("pinError").style.display = "block";
      return;
    }
    if (pin !== DEMO_PIN) {
      document.getElementById("pinError").textContent = "Incorrect PIN. Try again. (Hint: 1234)";
      document.getElementById("pinError").style.display = "block";
      digits.forEach((d) => (d.value = ""));
      digits[0].focus();
      return;
    }

    runTransferPreloader(user);
  });
}

const PRELOADER_STAGES = [
  { at: 0, text: "Confirming your PIN…" },
  { at: 4, text: "Verifying recipient account…" },
  { at: 10, text: "Contacting Pride Bank servers…" },
  { at: 17, text: "Processing transaction…" },
  { at: 24, text: "Finalizing transfer…" },
  { at: 28, text: "Almost done…" },
];
const PRELOADER_DURATION_MS = 30000;

function runTransferPreloader(user) {
  closePinModal();

  const scrim = document.getElementById("transferPreloader");
  const fill = document.getElementById("preloaderFill");
  const pctEl = document.getElementById("preloaderPct");
  const statusEl = document.getElementById("preloaderStatus");

  fill.style.width = "0%";
  pctEl.textContent = "0%";
  statusEl.textContent = PRELOADER_STAGES[0].text;
  scrim.classList.add("show");

  const start = Date.now();

  const tick = setInterval(() => {
    const elapsedMs = Date.now() - start;
    const elapsedSec = elapsedMs / 1000;
    const pct = Math.min(100, Math.round((elapsedMs / PRELOADER_DURATION_MS) * 100));

    fill.style.width = pct + "%";
    pctEl.textContent = pct + "%";

    const stage = [...PRELOADER_STAGES].reverse().find((s) => elapsedSec >= s.at);
    if (stage) statusEl.textContent = stage.text;

    if (elapsedMs >= PRELOADER_DURATION_MS) {
      clearInterval(tick);
      scrim.classList.remove("show");
      completeTransfer(user);
    }
  }, 150);
}

function completeTransfer(user) {
  const result = PrideDB.transfer({
    fromUserId: user.id,
    toAccountNumber: PENDING_TRANSFER.toAccount,
    amount: PENDING_TRANSFER.amount,
    narration: PENDING_TRANSFER.narration,
  });

  if (!result.ok) {
    showToast(result.error, "error");
    return;
  }

  showToast(`Transfer of ${PrideDB.formatCurrency(PENDING_TRANSFER.amount)} sent successfully.`, "success");
  setTimeout(() => (window.location.href = "dashboard.html"), 1400);
}
