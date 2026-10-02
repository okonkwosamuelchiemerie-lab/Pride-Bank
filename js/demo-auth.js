document.addEventListener("DOMContentLoaded", () => {
  if (PrideDB.getCurrentUser()) {
    window.location.href = "dashboard.html";
    return;
  }

  const button = document.getElementById("demoLoginBtn");
  if (!button) return;

  button.addEventListener("click", () => {
    const sampleUser = PrideDB.findUserByEmail("demo@pridebank.test");
    if (!sampleUser) {
      const alertBox = document.getElementById("formAlert");
      if (alertBox) {
        alertBox.textContent = "The sample account is unavailable. Please refresh the page.";
        alertBox.classList.add("show");
      }
      return;
    }

    PrideDB.setSession(sampleUser.id);
    window.location.href = "dashboard.html?demo=1";
  });
});