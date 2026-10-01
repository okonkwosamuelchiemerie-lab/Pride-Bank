let FUND_USER = null;
let SELECTED_METHOD = "card";

document.addEventListener("prideAuthReady", (e) => {
  FUND_USER = e.detail;
  renderSummary();
  setupMethodPicker();
  setupCardInputFormatting();
  setupFundButton();
});

function renderSummary() {
  document.getElementById("currentBalance").textContent = PrideDB.formatCurrency(FUND_USER.balance);
  document.getElementById("acctNumberSide").textContent = FUND_USER.accountNumber;
  document.getElementById("virtualAcctNumber").textContent = PrideDB.getVirtualFundingAccount(FUND_USER);
  document.getElementById("virtualAcctName").textContent = FUND_USER.fullName;

  const amountInput = document.getElementById("amount");
  amountInput.addEventListener("input", updateUssdCode);
  updateUssdCode();
}

function updateUssdCode() {
  const amount = parseFloat(document.getElementById("amount").value) || 0;
  document.getElementById("ussdCode").textContent = `*919*000*${amount || 0}#`;
}

function setupMethodPicker() {
  const buttons = document.querySelectorAll(".method-option");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      SELECTED_METHOD = btn.dataset.method;

      document.getElementById("panel-card").style.display = SELECTED_METHOD === "card" ? "block" : "none";
      document.getElementById("panel-transfer").style.display = SELECTED_METHOD === "transfer" ? "block" : "none";
      document.getElementById("panel-ussd").style.display = SELECTED_METHOD === "ussd" ? "block" : "none";

      const fundBtn = document.getElementById("fundBtn");
      fundBtn.textContent =
        SELECTED_METHOD === "card" ? "Add money" : SELECTED_METHOD === "transfer" ? "I've made the transfer" : "I've dialled the code";
    });
  });
}

function setupCardInputFormatting() {
  const cardNumber = document.getElementById("cardNumber");
  cardNumber.addEventListener("input", () => {
    let digits = cardNumber.value.replace(/\D/g, "").slice(0, 16);
    cardNumber.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  });

  const expiry = document.getElementById("cardExpiry");
  expiry.addEventListener("input", () => {
    let digits = expiry.value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) digits = digits.slice(0, 2) + "/" + digits.slice(2);
    expiry.value = digits;
  });

  const cvv = document.getElementById("cardCvv");
  cvv.addEventListener("input", () => {
    cvv.value = cvv.value.replace(/\D/g, "").slice(0, 3);
  });
}

function setFieldError(fieldId, hasError) {
  const field = document.getElementById(fieldId);
  if (field) field.classList.toggle("has-error", hasError);
}

function showFormAlert(message, type = "error") {
  const alertId = type === "error" ? "formAlert" : "formSuccess";
  const otherId = type === "error" ? "formSuccess" : "formAlert";
  document.getElementById(otherId).classList.remove("show");
  const box = document.getElementById(alertId);
  box.textContent = message;
  box.classList.add("show");
}

function clearAlerts() {
  document.getElementById("formAlert").classList.remove("show");
  document.getElementById("formSuccess").classList.remove("show");
}

function validateAmount() {
  const amount = parseFloat(document.getElementById("amount").value);
  const valid = amount && amount >= 100;
  const field = document.getElementById("amount").closest(".field");
  if (field) field.classList.toggle("has-error", !valid);
  return valid ? amount : null;
}

function validateCardFields() {
  const number = document.getElementById("cardNumber").value.replace(/\s/g, "");
  const expiry = document.getElementById("cardExpiry").value;
  const cvv = document.getElementById("cardCvv").value;

  let valid = true;
  if (!/^\d{16}$/.test(number)) {
    setFieldError("cardNumberField", true);
    valid = false;
  } else setFieldError("cardNumberField", false);

  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    setFieldError("cardExpiryField", true);
    valid = false;
  } else setFieldError("cardExpiryField", false);

  if (!/^\d{3}$/.test(cvv)) {
    setFieldError("cardCvvField", true);
    valid = false;
  } else setFieldError("cardCvvField", false);

  return valid;
}

function setupFundButton() {
  const btn = document.getElementById("fundBtn");
  btn.addEventListener("click", () => {
    clearAlerts();

    const amount = validateAmount();
    if (!amount) {
      showFormAlert("Enter a valid amount of at least ₦100.");
      return;
    }

    if (SELECTED_METHOD === "card" && !validateCardFields()) {
      showFormAlert("Please fix the highlighted card details.");
      return;
    }

    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = "Processing...";

    setTimeout(() => {
      const result = PrideDB.fundAccount({
        userId: FUND_USER.id,
        amount,
        method: SELECTED_METHOD,
      });

      btn.disabled = false;
      btn.textContent = originalText;

      if (!result.ok) {
        showFormAlert(result.error);
        return;
      }

      FUND_USER = result.user;
      renderSummary();
      showFormAlert(`₦${amount.toLocaleString()} added to your balance successfully.`, "success");
      showToast(`Account funded with ${PrideDB.formatCurrency(amount)}.`, "success");
      document.getElementById("amount").value = "";
    }, 1200);
  });
}
