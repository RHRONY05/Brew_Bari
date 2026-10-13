# agent.md — Start here

This repo is **Menuwala**, a multi-restaurant QR-menu & table-service platform for restaurants in Chattogram, Bangladesh. It is a sales demo: Turjo shows it to real restaurant owners to sell one of three packages. It must look polished, feel instant on a cheap Android phone, and never break during a pitch.

One codebase, one database, many restaurants. **A restaurant = data + a theme**, never a copy of the code.

## Active build
| | |
|---|---|
| **Restaurant** | **Grill Ghar** (`grill-ghar`), restaurant #2, fast food, P3 locked |
| **Its folder** | [restaurants/grill-ghar/](restaurants/grill-ghar/README.md) — start with its `README.md` |
| **Task list** | [restaurants/grill-ghar/07-TASKS.md](restaurants/grill-ghar/07-TASKS.md) |

When a later restaurant starts, change this table; nothing else in the shared docs needs to move.

## How the docs are organised
```
.agent/
  agent.md          ← you are here
  PROGRESS.md       ← where the project is right now (one file, a section per restaurant)
  platform/         ← the SHARED code's docs: true for every restaurant
  restaurants/
    brew-bari/      ← restaurant #1 (finished; its UI spec + designs are reused by others)
    grill-ghar/     ← restaurant #2 (active)
  rules/, workflows/  ← always-on rules and the /status and /next-task workflows
```
Rule of thumb: a change to **shared code** (schema, RPCs, components, theme types) → update the `platform/` doc. A change that concerns **one restaurant** (its menu, theme values, copy, designs, images) → that restaurant's folder.

## Read in this order
0. [PROGRESS.md](PROGRESS.md) — **where the project is right now** (read first, update before you stop)
1. [platform/00-AGENT-RULES.md](platform/00-AGENT-RULES.md) — how you must work (non-negotiable)
2. The active restaurant's `README.md` and every file it lists
3. [platform/10-PLATFORM.md](platform/10-PLATFORM.md) — URLs, themes, platform-managed fields, how to add a restaurant
4. [platform/01-PRODUCT.md](platform/01-PRODUCT.md) — the product for every restaurant: the 3 packages, user stories
5. [platform/02-ARCHITECTURE.md](platform/02-ARCHITECTURE.md) — stack, folders, routes, data flow, realtime
6. [platform/03-DATABASE.md](platform/03-DATABASE.md) — schema, RLS, RPC functions (Brew Bari's seed as the example)
7. [platform/04-API.md](platform/04-API.md) — every RPC / server action contract and error code
8. [platform/06-TESTING.md](platform/06-TESTING.md) — what to test and how
9. [restaurants/brew-bari/05-UI-DESIGN.md](restaurants/brew-bari/05-UI-DESIGN.md) + [design/](restaurants/brew-bari/design/README.md) — the base UI every restaurant reuses for screens it did not redraw
10. `rules/`, `workflows/` — short always-on rules and the `/status` and `/next-task` workflows

## One-paragraph summary
A customer scans a QR code → a mobile web page (no app, no login) shows the restaurant's menu and offers in English or Bangla. Depending on the restaurant's **package**: (P1) menu only; (P2) per-table QR, a cart, and a **Call Waiter** button that sends the table number and the cart to the counter screen; (P3) everything in P2 plus **Place Order**, **Request Bill**, and a feedback → Google review prompt. Staff use a live **Counter board** (realtime, with sound) and an **Admin panel** (menu, offers, tables & QR printing, settings). Each restaurant has its own URL (`/<slug>`), theme and staff logins.

## Key decisions (already made — do not re-open)
| Topic | Decision |
|---|---|
| Scope | **Platform (Menuwala), many restaurants** in one codebase and one database. Each restaurant = data + a theme (`restaurants.theme_key` → `src/themes`). Never copy code per restaurant. |
| URLs | Guest menu `/<slug>`, table `/<slug>/t/<token>`, staff `/staff/*` (restaurant from login). Production domain `menuwala.vercel.app`; `brew-bari.vercel.app` redirects there. |
| Packages | Per restaurant. `package_locked = true` fixes it (e.g. Grill Ghar = P3 only). |
| Stack | Next.js (App Router, TypeScript, React Server Components) + Tailwind CSS + shadcn/ui + Supabase (Postgres, Auth, Realtime, Storage). Hosted on Vercel. |
| Supabase | Cloud project `vaxjsaknytquzcfxsukv` (`ap-southeast-1`), managed through the **Supabase MCP**. No local Docker. Every schema change is also saved as a file in `supabase/migrations/`. |
| Customers | Anonymous. No accounts. Identified only by the table QR token + a random device id. |
| Staff | Supabase Auth email/password. Roles: `admin`, `counter`. One login = one restaurant. No public sign-up. |
| Language | English + Bangla toggle (customer side). Staff side English only. Prices in ৳ (whole taka). |
| Reviews | We **cannot** auto-post reviews to Google/Facebook (no API, against policy). We collect a private rating, then show a "Review us on Google" button to **everyone** (no review gating). |
| Payments | Not in the demo. Bill is requested in-app, paid at the counter. |
| Images | Royalty-free photos (Unsplash/Pexels), optimised to WebP, credits in each restaurant's `IMAGE-CREDITS.md`. |
| Repo | Git + GitHub (**public** repo: never commit secrets or passwords), one branch per task. |

## Status
- [x] Brew Bari (restaurant #1) — tag `brew-bari-v1`
- [x] Multi-restaurant platform refactor (2026-10-14)
- [x] Docs reorganised into `platform/` + `restaurants/` (2026-10-14)
- [ ] Grill Ghar (restaurant #2) — planned, ready to build
