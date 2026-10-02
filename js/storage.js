/* =========================================================
   Pride Bank — Storage Layer
   All "database" operations live here. Everything is kept in
   localStorage so the whole app runs with zero backend.
   ========================================================= */

const DB_KEYS = {
  USERS: "pridebank_users",
  SESSION: "pridebank_session",
  TXNS: "pridebank_transactions",
  CARDS: "pridebank_cards",
  LOANS: "pridebank_loans",
  SEEDED: "pridebank_seeded",
  VERSION: "pridebank_demo_version",
};

const PrideDB = (() => {
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error("PrideDB read error:", key, e);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("PrideDB write error:", key, e);
      return false;
    }
  }

  function uid(prefix = "id") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function generateAccountNumber() {
    const users = getUsers();
    let acc;
    do {
      acc = String(Math.floor(1000000000 + Math.random() * 8999999999));
    } while (users.some((u) => u.accountNumber === acc));
    return acc;
  }

  function generateCardNumber() {
    // Fictional 16-digit card, grouped for display. Starts 5399 (a
    // made-up Pride Bank BIN) so it never collides with a real scheme.
    let num = "5399";
    for (let i = 0; i < 3; i++) {
      num += String(Math.floor(1000 + Math.random() * 8999));
    }
    return num;
  }

  // ---------- Users ----------
  function getUsers() {
    return read(DB_KEYS.USERS, []);
  }

  function saveUsers(users) {
    return write(DB_KEYS.USERS, users);
  }

  function findUserByEmail(email) {
    return getUsers().find(
      (u) => u.email.toLowerCase() === String(email).toLowerCase()
    );
  }

  function findUserById(id) {
    return getUsers().find((u) => u.id === id);
  }

  function createUser({ fullName, email, phone }) {
    const users = getUsers();
    const newUser = {
      id: uid("usr"),
      fullName,
      email,
      phone,
      accountNumber: generateAccountNumber(),
      balance: 25000, // welcome bonus so the dashboard isn't empty
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    saveUsers(users);

    addTransaction({
      userId: newUser.id,
      type: "credit",
      amount: 25000,
      description: "Welcome bonus — account opening credit",
    });

    createCard(newUser.id);
    return newUser;
  }

  function updateUserBalance(userId, newBalance) {
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return false;
    users[idx].balance = newBalance;
    saveUsers(users);
    return true;
  }

  // ---------- Session ----------
  function getSession() {
    return read(DB_KEYS.SESSION, null);
  }

  function setSession(userId) {
    write(DB_KEYS.SESSION, { userId, loginAt: new Date().toISOString() });
  }

  function clearSession() {
    localStorage.removeItem(DB_KEYS.SESSION);
  }

  function getCurrentUser() {
    const session = getSession();
    if (!session) return null;
    return findUserById(session.userId) || null;
  }

  function requireAuth(redirectTo = "login.html") {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = redirectTo;
      return null;
    }
    return user;
  }

  // ---------- Transactions ----------
  function getTransactions(userId) {
    const all = read(DB_KEYS.TXNS, []);
    return userId ? all.filter((t) => t.userId === userId) : all;
  }

  function addTransaction({ userId, type, amount, description, meta }) {
    const all = read(DB_KEYS.TXNS, []);
    const txn = {
      id: uid("txn"),
      userId,
      type, // "credit" | "debit"
      amount,
      description,
      meta: meta || {},
      date: new Date().toISOString(),
    };
    all.unshift(txn);
    write(DB_KEYS.TXNS, all);
    return txn;
  }

  // ---------- Cards ----------
  function getCards(userId) {
    const all = read(DB_KEYS.CARDS, []);
    return userId ? all.filter((c) => c.userId === userId) : all;
  }

  function createCard(userId, type = "Verve Classic") {
    const all = read(DB_KEYS.CARDS, []);
    const card = {
      id: uid("card"),
      userId,
      type,
      cardNumber: generateCardNumber(),
      expiry: `${String(new Date().getMonth() + 1).padStart(2, "0")}/${String(
        (new Date().getFullYear() + 4) % 100
      ).padStart(2, "0")}`,
      status: "active", // active | frozen | pending
    };
    all.push(card);
    write(DB_KEYS.CARDS, all);
    return card;
  }

  function updateCardStatus(cardId, status) {
    const all = read(DB_KEYS.CARDS, []);
    const idx = all.findIndex((c) => c.id === cardId);
    if (idx === -1) return false;
    all[idx].status = status;
    write(DB_KEYS.CARDS, all);
    return true;
  }

  // ---------- Loans ----------
  function getLoans(userId) {
    const all = read(DB_KEYS.LOANS, []);
    return userId ? all.filter((l) => l.userId === userId) : all;
  }

  function applyForLoan({ userId, amount, tenure, purpose }) {
    const all = read(DB_KEYS.LOANS, []);
    const loan = {
      id: uid("loan"),
      userId,
      amount,
      tenure,
      purpose,
      status: "pending",
      appliedAt: new Date().toISOString(),
    };
    all.unshift(loan);
    write(DB_KEYS.LOANS, all);

    // Simulate a review process — resolves shortly after so the
    // status list feels alive without needing a real backend.
    setTimeout(() => {
      const current = read(DB_KEYS.LOANS, []);
      const idx = current.findIndex((l) => l.id === loan.id);
      if (idx !== -1 && current[idx].status === "pending") {
        current[idx].status = amount <= 500000 ? "approved" : "under-review";
        write(DB_KEYS.LOANS, current);
      }
    }, 6000);

    return loan;
  }

  // ---------- Fund account (deposit simulation) ----------
  function getVirtualFundingAccount(user) {
    // A cosmetic, deterministic "pay into" account number for the bank
    // transfer method — not a real NUBAN, just consistent per user.
    const digits = user.accountNumber.split("").reverse().join("");
    return "90" + digits.slice(0, 8);
  }

  function fundAccount({ userId, amount, method, reference }) {
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return { ok: false, error: "Account not found." };
    if (!amount || amount <= 0) return { ok: false, error: "Enter a valid amount." };

    users[idx].balance += amount;
    saveUsers(users);

    const methodLabel =
      method === "card" ? "Debit card" : method === "ussd" ? "USSD" : "Bank transfer";

    const txn = addTransaction({
      userId,
      type: "credit",
      amount,
      description: `Account funding via ${methodLabel}`,
      meta: { method, reference: reference || uid("ref").toUpperCase() },
    });

    return { ok: true, user: users[idx], txn };
  }

  // ---------- Money transfer ----------
  function transfer({ fromUserId, toAccountNumber, amount, narration }) {
    const users = getUsers();
    const sender = users.find((u) => u.id === fromUserId);
    if (!sender) return { ok: false, error: "Sender account not found." };
    if (sender.accountNumber === toAccountNumber) {
      return { ok: false, error: "You can't transfer to your own account." };
    }
    if (amount <= 0) return { ok: false, error: "Enter a valid amount." };
    if (sender.balance < amount) {
      return { ok: false, error: "Insufficient balance for this transfer." };
    }

    const recipient = users.find((u) => u.accountNumber === toAccountNumber);
    if (!recipient) {
      return {
        ok: false,
        error: "No Pride Bank account found with that number.",
      };
    }

    sender.balance -= amount;
    recipient.balance += amount;
    saveUsers(users);

    addTransaction({
      userId: sender.id,
      type: "debit",
      amount,
      description: `Transfer to ${recipient.fullName} (${recipient.accountNumber})`,
      meta: { narration, counterparty: recipient.accountNumber },
    });
    addTransaction({
      userId: recipient.id,
      type: "credit",
      amount,
      description: `Transfer from ${sender.fullName} (${sender.accountNumber})`,
      meta: { narration, counterparty: sender.accountNumber },
    });

    return { ok: true, sender, recipient };
  }

  // ---------- Demo seed data ----------
  function seedIfEmpty() {
    if (read(DB_KEYS.VERSION, 0) < 2) {
      try {
        [DB_KEYS.USERS, DB_KEYS.SESSION, DB_KEYS.TXNS, DB_KEYS.CARDS, DB_KEYS.LOANS, DB_KEYS.SEEDED]
          .forEach((key) => localStorage.removeItem(key));
        localStorage.setItem(DB_KEYS.VERSION, "2");
      } catch (e) {
        console.error("PrideDB demo data reset error:", e);
      }
    }

    if (read(DB_KEYS.SEEDED, false)) return;
    const users = getUsers();
    if (users.length === 0) {
      createUser({
        fullName: "Demo Customer",
        email: "demo@pridebank.test",
        phone: "08012345678",
      });
      createUser({
        fullName: "Sample Recipient",
        email: "recipient@pridebank.test",
        phone: "00000000000",
      });
    }
    write(DB_KEYS.SEEDED, true);
  }

  function formatCurrency(amount) {
    return "₦" + Number(amount).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return {
    getUsers,
    findUserByEmail,
    findUserById,
    createUser,
    updateUserBalance,
    getSession,
    setSession,
    clearSession,
    getCurrentUser,
    requireAuth,
    getTransactions,
    addTransaction,
    getCards,
    createCard,
    updateCardStatus,
    getLoans,
    applyForLoan,
    transfer,
    getVirtualFundingAccount,
    fundAccount,
    seedIfEmpty,
    formatCurrency,
    formatDate,
  };
})();

PrideDB.seedIfEmpty();
