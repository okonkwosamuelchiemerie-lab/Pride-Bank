// Shared shell logic for all logged-in pages (dashboard, transfer, cards, loans, transactions)
let CURRENT_USER = null;

document.addEventListener("DOMContentLoaded", () => {
  CURRENT_USER = PrideDB.requireAuth("login.html");
  if (!CURRENT_USER) return; // redirecting

  setupSidebarToggle();
  setupLogout();
  paintGreeting();
  addDemoNotice();

  document.dispatchEvent(new CustomEvent("prideAuthReady", { detail: CURRENT_USER }));
});

function addDemoNotice() {
  const main = document.querySelector(".app-main");
  if (!main) return;

  const notice = document.createElement("p");
  notice.className = "demo-notice";
  notice.setAttribute("role", "note");
  notice.textContent = "FICTIONAL PORTFOLIO DEMO. No real accounts, money, loans, or payment cards. Do not enter personal, banking, or payment information.";
  main.prepend(notice);
}

function setupSidebarToggle() {
  const toggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("appSidebar");
  const scrim = document.getElementById("sidebarScrim");
  if (!toggle || !sidebar) return;

  const open = () => {
    sidebar.classList.add("open");
    scrim && scrim.classList.add("show");
  };
  const close = () => {
    sidebar.classList.remove("open");
    scrim && scrim.classList.remove("show");
  };
  toggle.addEventListener("click", open);
  scrim && scrim.addEventListener("click", close);
  sidebar.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
}

function setupLogout() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    PrideDB.clearSession();
    window.location.href = "login.html";
  });
}

function paintGreeting() {
  const greeting = document.getElementById("greeting");
  if (greeting && CURRENT_USER) {
    const firstName = CURRENT_USER.fullName.split(" ")[0];
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    greeting.textContent = `${timeGreeting}, ${firstName}`;
  }
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const msg = document.getElementById("toastMsg");
  if (!toast || !msg) return;
  msg.textContent = message;
  toast.classList.remove("success", "error");
  toast.classList.add(type, "show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 3200);
}
