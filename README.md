# Menuwala (মেন্যুওয়ালা)

A high-performance, multi-tenant QR menu, table service, and ordering platform for restaurants in Bangladesh. Built with a shared-codebase, dual-theme architecture powering distinct restaurant brands under one roof.

---

## 🍽️ Live Restaurants

* **Brew Bari (ব্রু বাড়ি)** — `/brew-bari`  
  Warm espresso & café theme with specialty coffees, pastries, and table service.
* **Grill Ghar (গ্রিল ঘর)** — `/grill-ghar`  
  Flame red & fast-food theme with smash burgers, fried chicken buckets, combo deals, and live kitchen tracking.

**Production URL:** [https://menuwala.vercel.app](https://menuwala.vercel.app)

---

## 🛠️ Tech Stack

* **Framework:** Next.js 16 (App Router, React 19, TypeScript strict mode)
* **Styling & Themes:** Tailwind CSS v4 + dynamic restaurant theme tokens (`src/themes/`)
* **Backend:** Supabase (PostgreSQL, Row-Level Security, Realtime websockets, Auth)
* **Typography:** Plus Jakarta Sans & Cinzel (Latin) + Hind Siliguri & Li Alinur Nobin (Bengali)
* **Testing:** Vitest + Testing Library + Playwright E2E

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/RHRONY05/Brew_Bari.git
cd Brew_Bari
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local` and configure your Supabase credentials:
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
* **Platform Home:** [http://localhost:3000/](http://localhost:3000/)
* **Brew Bari Menu:** [http://localhost:3000/brew-bari](http://localhost:3000/brew-bari)
* **Grill Ghar Menu:** [http://localhost:3000/grill-ghar](http://localhost:3000/grill-ghar)
* **Staff Login:** [http://localhost:3000/staff/login](http://localhost:3000/staff/login)

---

## 🧪 How to Test Locally

### 1. Static Typecheck & Linting
Run TypeScript compilation check:
```bash
npm run typecheck
```
Run ESLint:
```bash
npm run lint
```

### 2. Unit & Component Tests (Vitest)
Run all 112 unit tests across schemas, money math, cart calculations, options, and UI components:
```bash
npm test
```
Run unit tests in watch mode during development:
```bash
npm run test:watch
```

### 3. End-to-End Tests (Playwright)

> **Note:** Ensure your local development server is running (`npm run dev`) before launching Playwright specs.

Run the entire end-to-end test suite:
```bash
npm run test:e2e
```

Run tests for a specific restaurant or area:
```bash
# Grill Ghar guest menu & ordering flow
npx playwright test tests/e2e/gg-menu.spec.ts

# Brew Bari guest menu & table ordering
npx playwright test tests/e2e/p1-menu.spec.ts
npx playwright test tests/e2e/p3-order-bill-review.spec.ts

# Multi-tenant platform routing & staff access
npx playwright test tests/e2e/platform.spec.ts

# Staff counter board & admin management
npx playwright test tests/e2e/counter-board.spec.ts
npx playwright test tests/e2e/admin-menu.spec.ts
```

Run Playwright in interactive UI mode (with visual debugger & DOM inspector):
```bash
npx playwright test --ui
```

---

## 📱 Table QR Testing

Each restaurant includes pre-configured active tables with QR tokens for instant mobile testing:

* **Grill Ghar Table 1:** `http://localhost:3000/grill-ghar/t/token_gg_1`  
  *(Production: `https://menuwala.vercel.app/grill-ghar/t/token_gg_1`)*
* **Brew Bari Table 1:** `http://localhost:3000/brew-bari/t/cb56e5ef05ab0759602d6481`  
  *(Production: `https://menuwala.vercel.app/brew-bari/t/cb56e5ef05ab0759602d6481`)*

To download or print physical table QR cards, log into `/staff/admin/tables/print` or run:
```bash
node scripts/generate-pdf.mjs grill-ghar
node scripts/generate-pdf.mjs brew-bari
```
PDFs will be generated in `docs/print/`.

---

## 🔐 Staff Accounts

Staff credentials for testing the Counter Board and Admin Panel are configured via `.env.local` (see `.env.example`).
* **Grill Ghar Admin:** `TEST_GG_ADMIN_EMAIL` / `TEST_GG_ADMIN_PASSWORD`
* **Grill Ghar Counter:** `TEST_GG_COUNTER_EMAIL` / `TEST_GG_COUNTER_PASSWORD`
* **Brew Bari Admin:** `TEST_STAFF_ADMIN_EMAIL` / `TEST_STAFF_ADMIN_PASSWORD`
* **Brew Bari Counter:** `TEST_STAFF_COUNTER_EMAIL` / `TEST_STAFF_COUNTER_PASSWORD`

---

## 📖 Architecture & Documentation

Comprehensive architectural guidelines and technical specifications are maintained in `.agent/`:
* [`.agent/platform/10-PLATFORM.md`](.agent/platform/10-PLATFORM.md) — Multi-tenant architecture & theme contract
* [`.agent/platform/03-DATABASE.md`](.agent/platform/03-DATABASE.md) — Database schema, RLS policies, and RPCs
* [`.agent/PROGRESS.md`](.agent/PROGRESS.md) — Platform changelog and build memory
