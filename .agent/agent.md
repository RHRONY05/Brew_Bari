# agent.md — Start here

You are building **Brew Bari**, a demo QR-menu & table-service web app for a (fictional) coffee & juice shop in Chattogram, Bangladesh. It is a sales demo: Turjo will show it to real restaurant owners to sell one of three packages. It must look polished, feel instant on a cheap Android phone, and never break during a pitch.

## Read in this order
0. [PROGRESS.md](PROGRESS.md) — **where the project is right now** (read first, update before you stop)
1. [00-AGENT-RULES.md](00-AGENT-RULES.md) — how you must work (non-negotiable)
2. [01-PRODUCT.md](01-PRODUCT.md) — what we build and why, the 3 packages, user stories
3. [02-ARCHITECTURE.md](02-ARCHITECTURE.md) — stack, folders, routes, data flow, realtime
4. [03-DATABASE.md](03-DATABASE.md) — full SQL schema, RLS, RPC functions, seed data
5. [04-API.md](04-API.md) — every RPC / server action contract and error code
6. [05-UI-DESIGN.md](05-UI-DESIGN.md) — design tokens, components, screen-by-screen spec
7. [06-TESTING.md](06-TESTING.md) — what to test and how
8. [07-TASKS.md](07-TASKS.md) — **the task list. Pick work only from here.**
9. [08-DEMO-SCRIPT.md](08-DEMO-SCRIPT.md) — the pitch the finished product must support
10. `design/` — **the UI mockups' source files** (one `.dc.html` per screen; see `design/README.md`). The claude.ai canvas link is private — use these files.
11. `references/` — the original inspiration images
12. `rules/`, `workflows/` — short always-on rules and the `/status` and `/next-task` workflows
13. [09-HANDOFF.md](09-HANDOFF.md) — for the human: how the build is started and run (agents may skip)

## One-paragraph summary
A customer scans a QR code → a mobile web page (no app, no login) shows the café's menu and offers in English or Bangla. Depending on the café's **package**: (P1) menu only; (P2) per-table QR, a cart, and a **Call Waiter** button that sends the table number and the cart to the counter screen; (P3) everything in P2 plus **Place Order**, **Request Bill**, and a feedback → Google review prompt. Staff use a live **Counter board** (realtime, with sound) and an **Admin panel** (menu, offers, tables & QR printing, settings). The package is a setting, so one deployment can demo all three tiers.

## Key decisions (already made — do not re-open)
| Topic | Decision |
|---|---|
| Scope | ONE coffee shop ("Brew Bari"). Data is still scoped by `restaurant_id` so a second shop is a data change, not a code change. No multi-brand UI. |
| Stack | Next.js (App Router, TypeScript, React Server Components) + Tailwind CSS + shadcn/ui + Supabase (Postgres, Auth, Realtime, Storage). Hosted on Vercel. |
| Supabase | Cloud project, created & managed by the agent through the **Supabase MCP**. No local Docker. Every schema change is also saved as a file in `supabase/migrations/`. |
| Customers | Anonymous. No accounts. Identified only by the table QR token + a random device id. |
| Staff | Supabase Auth email/password. Roles: `admin`, `counter`. No public sign-up. |
| Language | English + Bangla toggle (customer side). Staff side English only. Prices in ৳ (whole taka). |
| Reviews | We **cannot** auto-post reviews to Google/Facebook (no API, against policy). We collect a private rating, then show a "Review us on Google" button to **everyone** (no review gating). |
| Payments | Not in the demo. Bill is requested in-app, paid at the counter. |
| Repo | Git + GitHub, one branch per task. |

## Current status
- [x] Product & technical planning (this folder)
- [x] UI mockups (Claude Design) — https://claude.ai/artifact/QdYT3Ufcx86yhnXdGr41JM (linked in 05-UI-DESIGN.md)
- [x] Supabase project created: ref `vaxjsaknytquzcfxsukv` (region `ap-southeast-1`, `brew-bari-demo`)
- [ ] Implementation — see 07-TASKS.md and live status in PROGRESS.md

## Open questions for the humans (do not block on these; use the defaults)
| Question | Default used until answered |
|---|---|
| Brand name "Brew Bari" OK? | Yes |
| VAT shown on bill? | 5 % VAT, 0 % service charge (configurable in Settings) |
| Do tables need staff approval before first request? | Yes (`require_session_approval = true`), requests still go through but are marked "unverified" |
| Real food photos? | Royalty-free photos (Unsplash/Pexels), credits listed in `.agent/IMAGE-CREDITS.md` |
