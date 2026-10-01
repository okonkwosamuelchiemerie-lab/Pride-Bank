// Login + signup form handling and validation
document.addEventListener("DOMContentLoaded", () => {
  // If already logged in, skip straight to the dashboard.
  if (PrideDB.getCurrentUser()) {
    window.location.href = "dashboard.html";
    return;
  }

  setupPasswordToggle();
  setupLoginForm();
  setupSignupForm();
});

function setupPasswordToggle() {
  const toggle = document.getElementById("togglePassword");
  const input = document.getElementById("password");
  if (!toggle || !input) return;
  toggle.addEventListener("click", () => {
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    toggle.setAttribute("aria-label", showing ? "Show password" : "Hide password");
  });
}

function showAlert(message) {
  const alertBox = document.getElementById("formAlert");
  if (!alertBox) return;
  alertBox.textContent = message;
  alertBox.classList.add("show");
}

function clearAlert() {
  const alertBox = document.getElementById("formAlert");
  if (alertBox) alertBox.classList.remove("show", "success", "error");
  if (alertBox) alertBox.classList.add("error");
}

function setFieldError(fieldId, hasError) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.toggle("has-error", hasError);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{10}$/;

/* ---------------- Login ---------------- */
function setupLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAlert();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    let valid = true;
    if (!EMAIL_RE.test(email)) {
      setFieldError("emailField", true);
      valid = false;
    } else {
      setFieldError("emailField", false);
    }
    if (!password) {
      setFieldError("passwordField", true);
      valid = false;
    } else {
      setFieldError("passwordField", false);
    }
    if (!valid) return;

    const user = PrideDB.findUserByEmail(email);
    if (!user || user.password !== password) {
      showAlert("That email and password combination doesn't match our records.");
      return;
    }

    const btn = document.getElementById("loginBtn");
    btn.disabled = true;
    btn.textContent = "Logging in...";

    setTimeout(() => {
      PrideDB.setSession(user.id);
      window.location.href = "dashboard.html";
    }, 500);
  });

  // Clear field error as the user types
  ["email", "password"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", () => setFieldError(id + "Field", false));
  });

  const forgot = document.getElementById("forgotLink");
  if (forgot) {
    forgot.addEventListener("click", (e) => {
      e.preventDefault();
      alert("This is a demo project — password reset isn't wired up. Use the demo credentials shown below the form.");
    });
  }
}

/* ---------------- Signup ---------------- */
function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  return score; // 0-4
}

function setupSignupForm() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  const passwordInput = document.getElementById("password");
  const meter = document.getElementById("strengthMeter");
  const strengthLabel = document.getElementById("strengthLabel");

  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      const score = passwordStrength(passwordInput.value);
      meter.classList.remove("weak", "fair", "strong");
      if (!passwordInput.value) {
        strengthLabel.textContent = "Use 8+ characters with a number and a symbol.";
        return;
      }
      if (score <= 1) {
        meter.classList.add("weak");
        strengthLabel.textContent = "Weak — add numbers, symbols or more length.";
      } else if (score <= 2) {
        meter.classList.add("fair");
        strengthLabel.textContent = "Fair — a symbol or capital letter will help.";
      } else {
        meter.classList.add("strong");
        strengthLabel.textContent = "Strong password.";
      }
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAlert();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const terms = document.getElementById("terms").checked;

    let valid = true;

    if (fullName.split(" ").filter(Boolean).length < 2) {
      setFieldError("fullNameField", true);
      valid = false;
    } else setFieldError("fullNameField", false);

    if (!EMAIL_RE.test(email)) {
      setFieldError("emailField", true);
      valid = false;
    } else setFieldError("emailField", false);

    if (!PHONE_RE.test(phone)) {
      setFieldError("phoneField", true);
      valid = false;
    } else setFieldError("phoneField", false);

    if (password.length < 8 || !/[0-9]/.test(password)) {
      setFieldError("passwordField", true);
      valid = false;
    } else setFieldError("passwordField", false);

    if (confirmPassword !== password || !confirmPassword) {
      setFieldError("confirmField", true);
      valid = false;
    } else setFieldError("confirmField", false);

    if (!terms) {
      setFieldError("termsField", true);
      valid = false;
    } else setFieldError("termsField", false);

    if (!valid) return;

    if (PrideDB.findUserByEmail(email)) {
      showAlert("An account with that email already exists. Try logging in instead.");
      return;
    }

    const btn = document.getElementById("signupBtn");
    btn.disabled = true;
    btn.textContent = "Creating your account...";

    setTimeout(() => {
      const user = PrideDB.createUser({ fullName, email, phone, password });
      PrideDB.setSession(user.id);
      window.location.href = "dashboard.html?welcome=1";
    }, 600);
  });

  ["fullName", "email", "phone", "confirmPassword"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      const fieldId = id === "confirmPassword" ? "confirmField" : id + "Field";
      el.addEventListener("input", () => setFieldError(fieldId, false));
    }
  });
  const termsEl = document.getElementById("terms");
  if (termsEl) termsEl.addEventListener("change", () => setFieldError("termsField", false));
}
