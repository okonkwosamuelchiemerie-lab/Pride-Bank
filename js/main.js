// Marketing site interactions (nav, footer year)
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const isOpen = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // If someone is already logged in and lands on the homepage, offer a
  // quick way into the dashboard without forcing a redirect.
  const user = window.PrideDB ? PrideDB.getCurrentUser() : null;
  const loginBtns = document.querySelectorAll('a[href="login.html"]');
  if (user) {
    loginBtns.forEach((btn) => {
      btn.textContent = "Go to Dashboard";
      btn.setAttribute("href", "dashboard.html");
    });
  }
});
