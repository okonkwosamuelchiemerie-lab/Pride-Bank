# Pride Bank — Front-End Banking Project

A fully front-end digital banking web app built with **plain HTML, CSS and JavaScript**. There is no backend — all data (users, balances, transactions, cards, loans) is stored in the browser's **localStorage**, which acts as the app's "database" for this class project.

> This is a student/class project. Pride Bank is a fictional bank created for demonstration purposes only — it is not a real financial institution.

## Features

- **Landing page** — responsive marketing site with hero, features, products, stats and footer
- **Sign up / Log in** — real-time form validation (email format, Nigerian phone number format, password strength meter, matching password confirmation)
- **Dashboard** — balance card (with show/hide toggle), account details, quick actions, recent transactions
- **Transfers** — send money to any other Pride Bank account number, with live recipient lookup, balance checks and a PIN-confirmation modal
- **Transactions** — full history with search and type filtering
- **Cards** — a flippable virtual debit card (tap to see the CVV on the back), freeze/unfreeze toggle, request a replacement card
- **Loans** — apply for a loan with amount/tenure/purpose validation, see application status update from "Pending" to "Approved"/"Under review"
- Fully responsive down to small mobile screens, with an off-canvas sidebar on the dashboard pages and a collapsible nav on the marketing site
- Accessible focus states, `prefers-reduced-motion` support, semantic HTML

## Getting started

1. Unzip the project folder.
2. Open the folder in VS Code (or any editor).
3. Because the app uses `fetch`-free, file-based JavaScript, you can simply open `index.html` directly in a browser — but for the smoothest experience (and to avoid any browser restrictions on some setups), it's recommended to serve it with a local server:
   - VS Code: install the **Live Server** extension, right-click `index.html` → "Open with Live Server"
   - Or, with Node installed: `npx serve .`
   - Or, with Python installed: `python -m http.server 5500`
4. Visit the printed local URL in your browser.

## Demo login

A demo account is seeded automatically the first time the app runs:

- **Email:** `demo@pridebank.test`
- **Password:** `Demo@1234`

You can also create your own account from the Sign Up page — it will start with a ₦25,000 welcome credit.

**Transaction PIN for transfers (demo only):** `1234`

## Project structure

```
pride-bank/
├── index.html            Landing / marketing page
├── login.html             Login page
├── signup.html            Sign-up page
├── dashboard.html          Logged-in dashboard
├── transfer.html           Send money page
├── transactions.html       Full transaction history
├── cards.html              Virtual card management
├── loans.html               Loan application + status
├── css/
│   └── style.css           All styles (design tokens, layout, components, responsive)
├── js/
│   ├── storage.js           localStorage data layer ("database")
│   ├── main.js               Landing page interactions
│   ├── auth.js                Login/signup validation & session handling
│   ├── app-shell.js            Shared logic for logged-in pages (auth guard, sidebar, logout, toast)
│   ├── dashboard.js
│   ├── transfer.js
│   ├── cards.js
│   ├── loans.js
│   └── transactions.js
├── vercel.json              Vercel static-hosting config
└── README.md
```

## Deploying to Vercel

1. Push this folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com), click **New Project**, and import the repository.
3. Framework preset: **Other** (it's a static site — no build step is needed).
4. Deploy. Vercel will serve `index.html` and all assets as-is.

## Notes for grading / review

- All "backend" behaviour (accounts, transfers, cards, loans) is simulated entirely in the browser via `localStorage` — refreshing the page keeps your data, but clearing site data/localStorage will reset it.
- Passwords are stored in plain text in localStorage for simplicity — **this is only acceptable because it's a local demo project with no real backend or real user data**. A production system would never do this.
- No external libraries or frameworks are used — just HTML, CSS and vanilla JavaScript (Google Fonts is the only external resource, loaded for typography).
