# 07 — Tasks

Rules: see 00-AGENT-RULES.md. Pick a task whose **Depends on** are all `[x]`. Mark it `— in progress: <agent>` when you start, tick `[x]` + one-line note when done.

**Lanes** (can run in parallel once M0 is done): **A** = database & API · **B** = guest UI · **C** = staff UI. Within a lane, go in order.

```
M0 Setup ──▶ M1 Database (A) ──┬──▶ M3 Table service (B) ──▶ M5 Premium (B)
         └─▶ M2 Guest menu (B) ┘                               │
                                └──▶ M4 Counter (C) ───────────┤
                                └──▶ M6 Admin (C) ─────────────┴──▶ M7 Demo polish & release
```

---

## M0 — Setup

- [x] **T0.0 Preflight** · Lane — · Depends on: — (Preflight complete; human confirmed RHRONY05's Org, freed project slot, verified repo)
  - Confirm you can: run `node -v` (≥ 20) and `npm -v`; run `git`; use the **Supabase MCP** (list projects/organizations, and confirm a free project slot exists); use the browser for UI testing; write to this folder.
  - Confirm every file listed in `.agent/agent.md` exists and `.agent/design/` contains the 18 `.dc.html` screens.
  - Ask the human for anything missing (GitHub repo URL, Supabase org, permissions). **Do not continue until answered.**
  - **AC:** a "Preflight" entry in PROGRESS.md listing each check ✅/❌.

- [x] **T0.1 Scaffold the app** · Lane — · Depends on: — (Scaffolded Next.js 16, React 19, Tailwind v4, shadcn, Vitest, Playwright, pushed to main)
  - `create-next-app` (TypeScript, App Router, Tailwind, ESLint, `src/`, import alias `@/*`), add shadcn/ui, and every dependency listed in 02-ARCHITECTURE.md. Folder skeleton from 02-ARCHITECTURE.md (empty files with TODO-free placeholders are fine).
  - Vitest (+ jsdom, Testing Library) and Playwright (projects `guest` Pixel 7, `staff` Desktop 1280×800) configured; scripts from 06-TESTING.md.
  - `.env.example`, `.gitignore` (incl. `.env*.local`, `playwright-report`, `test-results`), root `README.md` (what it is, how to run, link to `.agent/agent.md`).
  - `git init`, first commit. Push to the GitHub remote if the human has provided one.
  - **AC:** `npm run build`, `lint`, `typecheck`, `test` pass; one trivial Playwright test loads `/`.

- [x] **T0.2 Supabase project** · Lane A · Depends on: — (Created brew-bari-demo in RHRONY05's Org, ref vaxjsaknytquzcfxsukv, URL & anon key saved to .env.local)
  - Via Supabase MCP: list projects; create a **free-tier** project named `brew-bari-demo` in the region closest to Bangladesh (e.g. Singapore `ap-southeast-1`) — ask the human before anything with a cost.
  - Put URL + anon key into `.env.local` (not committed). Record project ref (not keys) in `.agent/agent.md` → "Current status".
  - **AC:** `get_project_url` works; app can create a client with env vars.

- [x] **T0.3 Design system foundation** · Lane B · Depends on: T0.1 (Tokens, Button, Chip, Badge, BottomSheet, QtyStepper, StatusPill, PrepPill, /dev/ui page, unit tests pass)
  - Tokens from 05-UI-DESIGN.md as CSS variables + Tailwind theme + shadcn theme; fonts (Plus Jakarta Sans, Hind Siliguri) with `:lang(bn)` rule.
  - Variants: Button (primary/secondary/brand), Chip, Badge set, BottomSheet (shadcn Drawer), QtyStepper, StatusPill, ItemCard skeleton.
  - A temporary `/dev/ui` page showing all components (delete in T7.4).
  - `src/lib/money.ts`, `src/lib/i18n/*` (en/bn dictionaries, `useT`, `pick`, locale cookie), `src/lib/features.ts`.
  - **Tests:** `money`, `i18n`, `features` unit tests.

## M1 — Database & API (Lane A)

- [x] **T1.1 Schema migration** · Depends on: T0.2 (Applied init_schema migration via MCP, generated src/types/database.ts, schema advisors clean)
  - Migration `init_schema` = 03-DATABASE.md §1. Apply via MCP. Generate types → `src/types/database.ts`.
  - **AC:** advisors show no errors for schema.

- [x] **T1.2 RLS + storage policies** · Depends on: T1.1 (Applied 20261012000002_rls.sql, menu-images bucket created, 01_rls_anon.sql & 08_staff_rls.sql passing)
  - Migration `rls` = §2 (+ storage bucket & policies). Run advisors; fix warnings.
  - **Tests:** `supabase/tests/01_rls_anon.sql`, `08_staff_rls.sql`.

- [x] **T1.3 Guest RPCs** · Depends on: T1.2 (Applied rpc and realtime migrations, types refreshed, tests 02-07 passing)
  - Migration `rpc` = §3 incl. grants; migration `realtime` = §4. Regenerate types.
  - **Tests:** `02_rpc_grants.sql` … `07_feedback.sql` all pass.

- [x] **T1.4 Seed + staff accounts** · Depends on: T1.3 (Applied seed.sql, created admin + counter Auth users, linked staff rows, 28 items and get_table_context verified)
  - `supabase/seed.sql` = §6 + test table 99 (06-TESTING.md). Run it.
  - Create 2 Auth users (admin + counter) — via MCP/Dashboard or a one-off local script using the secret key that is **not committed**. Link with `staff` rows. Put credentials only in `.env.local` (`TEST_STAFF_*`) and tell the human where they are.
  - **AC:** anon `select` on `menu_items` returns 28 items; `get_table_context(<table 1 token>)` returns a session.

- [x] **T1.5 Typed client layer** · Depends on: T1.3, T0.1 (Zod schemas, errors, device-id, requests state machine, typed RPC wrappers, middleware guards, unit and integration tests passing)
  - `src/lib/supabase/{server,client,middleware}.ts`, `middleware.ts` (refresh + guards per 02-ARCHITECTURE.md), `src/lib/schemas.ts`, `src/lib/errors.ts`, `src/lib/table/rpc.ts` (typed wrappers returning `{data} | {error: {code, detail}}`), `src/lib/requests.ts` (transitions + tile state), `src/lib/device-id.ts`.
  - **Tests:** `errors`, `schemas`, `requests` unit tests; integration test: anon `get_table_context` on table 99 + anon `from('tables')` returns empty.


## M2 — Guest menu, P1 (Lane B)

- [x] **T2.1 Menu data + page shell** · Depends on: T0.3, T1.4, T1.5 · Stories: US-01 (getMenu cached fetcher with tag revalidation, /m/[slug] page, metadata, 404, loading skeleton)
  - `getMenu(slug)` (cookie-less anon client, tag cache `menu:<id>`), `/m/[slug]/page.tsx`, 404 for unknown slug, loading skeleton, `<html lang>` from locale.
- [x] **T2.2 Menu home UI** · Depends on: T2.1 · Stories: US-02, US-03, US-07, US-09 (MenuClient, ItemCard, CategoryNav with scroll-spy, OfferCarousel with auto-advance, Quick section with sortForGuest, unit & e2e passing)
  - Header, search, offers carousel (auto-advance, linking to item/category), sticky category chips with scroll-spy, 2-col grid of ItemCards, sold-out styling + sold-out-last ordering, prep pill, **Quick** chip/section (`src/lib/menu/sort.ts`), empty-category hiding, footer.
  - Tablet/desktop **backup layout** per 05-UI-DESIGN.md "Responsive rules" (3–4 column grid, sheets become centred dialogs ≥ 768 px). Phone stays the priority.
  - **Tests:** `menu-sort` unit tests; component tests `ItemCard`; e2e `p1-menu.spec.ts` (partial: browse/search/sold-out/Quick) + `responsive.spec.ts` guest part.
- [x] **T2.3 Item detail sheet** · Depends on: T2.2 · Stories: US-04, US-05 (ItemDetailSheet with options builder, live price deltas, special notes, qty stepper, unit & component tests passing)
  - Options UI (single/multi, required), live price, note, qty; P1 hides Add (via `features`).
  - **Tests:** `options` unit, `ItemSheet` component test.
- [x] **T2.4 Language toggle** · Depends on: T2.2 · Stories: US-06 (LanguageToggle segmented control EN/বাং with cookie persistence and reload test passing)
  - EN | বাং segmented toggle, cookie persistence, Bangla numerals, all strings via dictionaries.
  - **Tests:** e2e `p1-menu.spec.ts` language part.
- [x] **T2.5 Café info sheet** · Depends on: T2.2 · Stories: US-08 (CafeInfoSheet with address, maps link, hours, tel link, and one-tap copy Wi-Fi password)
  - Address/maps, hours, phone, Wi-Fi copy, social (P3 only).


## M3 — Table service, P2 (Lane B)

- [x] **T3.1 Table entry + TableProvider** · Depends on: T2.2, T1.5 · Stories: US-10 (Implemented /t/[token] with get_table_context RPC, G8 invalid-token page, TableProvider with polling and visibility detection, Table N chip)
  - `/t/[token]`: server calls `get_table_context`; invalid → not-found page (G8); P1 → plain menu. `TableProvider` (client): session id storage, change detection, polling rules from 04-API.md, "Table N" chip.
- [x] **T3.2 Cart** · Depends on: T2.3, T3.1 · Stories: US-11 (Cart store with session-keyed localStorage persistence, CartSheet drawer matching Cart.dc.html, item sheet add, action bar integration, 6 unit tests passing)
  - Cart context (reducer + localStorage keyed by session), "+" on cards, Add in item sheet, ActionBar, CartSheet (G3).
  - **Tests:** `cart` unit tests.
- [x] **T3.3 Call waiter + status sheet** · Depends on: T3.2 · Stories: US-12 (Call waiter RPC with device ID, nudge count detection, TableStatusSheet matching Status.dc.html, e2e p2-call-waiter spec passing)
  - Call waiter (with or without cart), duplicate/nudge handling, G4 status sheet for calls, error handling via `errors.ts`, button debouncing.
  - **Tests:** e2e `p2-call-waiter.spec.ts` (guest half; full after T4.2).


## M4 — Counter board (Lane C)

- [ ] **T4.1 Staff auth & layout** · Depends on: T1.5, T0.3 · Stories: US-30
  - `/staff/login`, protected layout, role redirects, logout.
  - **Tests:** e2e `auth.spec.ts`.
- [ ] **T4.2 Counter board live** · Depends on: T4.1 · Stories: US-31, US-32, US-34
  - Two layouts: tablet/desktop (S2) and phone (M7: table strip + stacked cards with full-width buttons).
  - Start-shift overlay (audio unlock + wake lock), initial load + Realtime subscription + refetch on reconnect/visibility, table grid with tile states, request feed with filters, action buttons with transitions, chime on new/nudged, live time-ago, connection indicator, hide `TEST` tables unless `?showTest=1`. Sold-out quick menu (toggleAvailability).
  - Add a short chime file `public/sounds/chime.mp3` (royalty-free, < 30 KB; note source in IMAGE-CREDITS.md).
  - **Tests:** integration Realtime test; e2e `p2-call-waiter.spec.ts` complete.
- [ ] **T4.3 Table sessions drawer** · Depends on: T4.2 · Stories: US-33
  - S3 drawer: approve, open, close (also closes open calls/bills), running bill, requests list.
  - **Tests:** e2e `session-approval.spec.ts`.

## M5 — Premium, P3 (Lane B, needs counter for full e2e)

- [ ] **T5.1 Place order + order status** · Depends on: T3.3 · Stories: US-20, US-21
  - Place order from cart (P3), sold-out error handling (mark line, keep others), order stepper in G4, status pill above ActionBar.
  - **Tests:** e2e `sold-out-race.spec.ts`.
- [ ] **T5.2 Bill** · Depends on: T5.1 · Stories: US-22
  - G5 bill sheet from `get_bill`, Request bill, success state.
- [ ] **T5.3 Feedback & review** · Depends on: T5.2 · Stories: US-23
  - G6: stars, comment, submit/skip, Google review button for everyone (clipboard + open link), social buttons, thank-you state after session closes.
  - **Tests:** e2e `p3-order-bill-review.spec.ts` (needs T4.2).

## M6 — Admin (Lane C)

- [ ] **T6.1 Admin shell + Menu editor** · Depends on: T4.1 · Stories: US-40, US-41
  - Admin nav (sidebar ≥ 1024 px, top tabs below — M1), categories CRUD + reorder, items list with availability switch, ItemForm with prep time + OptionsBuilder (desktop: side panel S4; phone: full-screen edit page M2 with sticky Save bar), zod validation, server actions with `revalidateTag`.
  - **Every M6 admin task (T6.1–T6.7) ships both layouts:** phone per M1–M6, desktop per S4–S6 (Offers/Feedback desktop = same cards in a wider grid).
  - **Tests:** e2e `admin-menu.spec.ts` (without image part).
- [ ] **T6.2 Image upload** · Depends on: T6.1
  - Client-side resize/crop to square WebP ≤ 300 KB, upload to `menu-images/<rid>/items/`, preview, replace/remove; `next/image` remote pattern.
  - **Tests:** integration storage tests; e2e image part of `admin-menu.spec.ts`.
- [ ] **T6.3 Offers** · Depends on: T6.2 · Stories: US-42
  - List with live preview, form (EN/BN, 2:1 image, link, schedule, active).
- [ ] **T6.4 Tables & QR** · Depends on: T6.1 · Stories: US-43
  - Table CRUD, regenerate token (confirm), print sheet (A4, 2×3, EN+BN text), shop QR PNG/SVG download. QR URLs from `NEXT_PUBLIC_SITE_URL`.
  - **Tests:** e2e `admin-tables.spec.ts`.
- [ ] **T6.5 Settings + package switch** · Depends on: T6.1 · Stories: US-44
  - Settings form incl. package picker cards; revalidate menu.
- [ ] **T6.6 Demo photos** · Depends on: T6.2
  - Find royalty-free photos (Unsplash/Pexels licence) for all 28 items, 3 offers, logo/cover (a simple text logo is fine); upload via the admin UI or a script; list every source URL + author in `.agent/IMAGE-CREDITS.md`. Consistent style: product on cream/plain background, square crop.
- [ ] **T6.7 Feedback list** · Depends on: T6.1 · Stories: US-45

## M7 — Demo polish & release

- [ ] **T7.1 Demo launcher `/`** · Depends on: T4.1, T6.5 · Stories: US-50
- [ ] **T7.2 Full e2e green** · Depends on: all of M2–M6
  - All specs in 06-TESTING.md §4 pass on `guest` and `staff` projects.
- [ ] **T7.3 Performance & accessibility** · Depends on: T7.2
  - Lighthouse + bundle budgets (06-TESTING.md §5); fix regressions; record scores here.
- [ ] **T7.4 Deploy** · Depends on: T7.3
  - Vercel project from GitHub; env vars; Supabase Auth redirect URLs; set `NEXT_PUBLIC_SITE_URL`; remove `/dev/ui`; smoke-test on production; print 3 table QR cards as PDF into `docs/print/` for the salesperson.
- [ ] **T7.5 Demo rehearsal** · Depends on: T7.4
  - Run 08-DEMO-SCRIPT.md end-to-end on a real phone + laptop; fix anything awkward; write the results here.

---

## Traceability (story → task)
US-01 T2.1 · US-02/03/07/09 T2.2 · US-04/05 T2.3 · US-06 T2.4 · US-08 T2.5 · US-10 T3.1 · US-11 T3.2 · US-12 T3.3 · US-20/21 T5.1 · US-22 T5.2 · US-23 T5.3 · US-30 T4.1 · US-31/32/34 T4.2 · US-33 T4.3 · US-40/41 T6.1 · US-42 T6.3 · US-43 T6.4 · US-44 T6.5 · US-45 T6.7 · US-50 T7.1

## Questions (agents append here; humans answer)
- _none yet_
