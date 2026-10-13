# 07 — Grill Ghar tasks

Rules: `../../platform/00-AGENT-RULES.md`. Work **in order G0 → G9** (one agent, one go; each task's dependencies are the tasks before it unless stated). Mark a task `— in progress: <agent>` when you start, tick `[x]` + one-line note when done, and add a session-log entry in `.agent/PROGRESS.md` after **every** task.

**Hard rule for every task:** Brew Bari must not change. After any change to shared code, run the Brew Bari e2e suite (or at least the specs that touch the files you changed) and keep it green. A Brew Bari regression blocks the task.

```
G0 Preflight ─▶ G1 Options v2 (DB) ─▶ G2 Theme & options scaffold ─▶ G3 Seed, staff, images
                                                                      │
        G9 Docs, deploy, rehearsal ◀─ G8 Tests ◀─ G7 Staff side ◀─ G6 Cart & tracking ◀─ G5 Item detail ◀─ G4 Menu home
```

---

- [x] **G0 Preflight & baseline** — typecheck passed, lint 50 pre-existing errors, 83/83 unit tests passed, 87/87 e2e tests passed. Alinur Nobin Unicode fonts unpacked to src/app/fonts/.
  - Read `.agent/agent.md`, this folder's `README.md` and every file it lists, `platform/00-AGENT-RULES.md`, `platform/10-PLATFORM.md`.
  - Check: Supabase MCP works (project `vaxjsaknytquzcfxsukv`), git clean on `main`, `.env.local` has the Brew Bari test logins, browser testing works.
  - Run the full suite on `main` **before any change**: `typecheck`, `lint`, `test`, `test:e2e`. Record the results in PROGRESS.md as the baseline (if anything already fails, list it — don't fix unrelated failures silently).
  - Check "Questions for the human" at the bottom of this file. Ask the human anything unanswered that blocks you, then continue with the rest.
  - **AC:** baseline entry in PROGRESS.md.

- [x] **G1 Options model v2 + spice level (shared, DB)** — migration applied, types regenerated, 10_option_rules.sql, 04_place_order.sql, 09_multi_restaurant.sql green; 93 unit tests passed; Brew Bari ordering e2e green.
  - Migration `supabase/migrations/20261015000006_option_rules.sql`: `menu_items.spice_level`, new `price_cart` with `show_if` rules. Apply via MCP, regenerate `src/types/database.ts`, run advisors.
  - `src/lib/schemas.ts`: new optional fields + refinements. `src/lib/menu/options.ts`: `activeGroups`, active-only pricing/validation/formatting, clear child on parent change.
  - **Tests:** `supabase/tests/10_option_rules.sql` (cases in 03-DATA §2); re-run `04_place_order.sql`, `09_multi_restaurant.sql`. Unit tests in `tests/unit/options.test.ts` + `schemas.test.ts` for: inactive group not required, child cleared when parent changes, price with/without meal, invalid `show_if` rejected by zod, Brew Bari's existing options still parse.
  - **AC:** all SQL + unit tests pass; Brew Bari ordering e2e (`p3-order-bill-review`, `sold-out-race`) green.

- [x] **G2 Theme, font, logo, layout-option scaffold** — Alinur Nobin localFont configured, types & FONT_VARIABLES updated, layout options added to types, brew-bari.ts & menuwala.ts defaults set, grill-ghar.ts created and registered in THEMES, brand SVG created, 94 unit tests passing, full 87/87 Brew Bari E2E suite green.
  - Font: unzip `public/fonts/AlinurNobin.zip`, copy the two `Unicode/` TTFs to `src/app/fonts/Li-Alinur-Nobin-Unicode.ttf` and `…-Italic.ttf`, add `alinurNobin` localFont in `src/themes/fonts.ts`, key `'alinur-nobin'` in `types.ts` + `FONT_VARIABLES`. **Delete `public/fonts/AlinurNobin.zip`** (never commit it).
  - `src/themes/types.ts`: add the new `layout` options and optional `copy` keys. `brew-bari.ts` and `menuwala.ts`: set every new option to its **first** value (= today's behaviour).
  - `src/themes/grill-ghar.ts` with all tokens, fonts, icons, copy, assets; register in `THEMES`.
  - Logo `public/images/brand/grill-ghar.svg` (flame mark in a rounded red square; own simple artwork).
  - **AC:** typecheck green; `/brew-bari` pixel-identical to before at 375 px (compare screenshots); full Brew Bari e2e green.

- [x] **G3 Seed, staff, images** · completed: Antigravity · spec: `03-DATA.md` §3–§5
  - `supabase/seed-grill-ghar.sql` (restaurant, categories, 28 items with BN, offers, tables 1–12 + 99). Apply via MCP `execute_sql`.
  - Staff users (admin + counter) → `.env.local` only (`TEST_GG_*`), names in `.env.example`.
  - Images: find, **look at**, download, optimise (`scripts/optimize-menu-images.mjs`, `sharp`), store, set `image_url`, credit in `IMAGE-CREDITS.md`. All 28 items + 3 offers.
  - Category icon keys in `CATEGORY_ICON_MAP` (+ `FriesIcon`).
  - **AC:** `/grill-ghar` renders (still in the old layouts) with the Grill Ghar colours and fonts, all photos shown, every photo matches its dish (check each by eye at 375 px), anon `get_table_context(<GG table 99 token>)` returns package 3; logging in as the GG admin shows Grill Ghar's admin in the GG theme; `09_multi_restaurant.sql` passes; `/brew-bari` unchanged.

- [x] **G4 Menu home (GG1)** · completed: Antigravity · design: `design/Main.dc.html` · spec: `05-UI-DESIGN.md` §2, GG1
  - Implement `offerStyle: 'hero'`, `categoryNav: 'round-icons'`, `itemCard: 'bold'` (incl. chili row from `spice_level`), `dealsRow`, `quickPicks: 'banner'`, header/search/action-bar/live-pill styling via tokens. Category sections stay sliders (`CategorySection`) with the bold card.
  - All new strings EN + BN.
  - **Tests:** component tests for `ItemCard` bold variant (chilis, sold-out), deals row (SAVE % maths, hidden when no deals), round nav (active state).
  - **AC:** matches `Main.dc.html` at 375×812 in EN and বাং; no horizontal page overflow at 320, 375, 768, 1440; Brew Bari menu unchanged.

- [x] **G5 Item detail (GG2)** · completed: Antigravity · design: `design/ItemDetail.dc.html`
  - Render groups by `display` (`cards` / `list` / `chips` / multi tiles), `show_if` show/hide with reduced-motion-safe animation, `compare_delta` struck price + SAVE badge, `heat` chilis, add button label "Add meal" when the meal choice is picked.
  - **Tests:** `item-sheet.test.tsx`: picking Meal shows drink + raises price by 150; back to solo hides drink and drops its price; Add disabled until required active groups are chosen; Brew Bari item sheet unchanged.
  - **AC:** matches design; order placed from this sheet is priced correctly by the server.

- [x] **G6 Cart & order tracking (GG3, GG4)** · completed: Antigravity · design: `design/Cart.dc.html`, `design/Status.dc.html`
  - Cart: MEAL badge, "Goes well with" (`cartUpsell`, GG-05), meal savings (GG-06), CTA copy from `theme.copy.placeOrder`.
  - Tracking: `statusCard: 'hero'`, "On the grill" via `theme.copy.statusPreparing`, progress bar, "Order more", live pill restyle (GG-07).
  - **Tests:** unit tests for savings maths and upsell filtering (excludes in-cart and sold-out items, max 6).
  - **AC:** matches both designs; the full P3 flow (order → staff accepts → preparing → ready → served → bill → review) works for Grill Ghar table 99.

- [ ] **G7 Staff side**
  - Admin item form: `spice_level` select (None, 1–4), `pairs-well` tag in the tag picker, OptionsBuilder supports `display`, `show_if` (pick an earlier group + choice), choice `description_*`, `compare_delta`, `heat`. Validate with the zod schema.
  - Check counter (desktop + phone), all admin pages, login, bill, review, info and the invalid-QR page with the GG theme: AA contrast, no Brew Bari wording/icons, Alinur Nobin renders where Bangla appears.
  - Table QR print sheet works for Grill Ghar (colours from `readThemeColors()`).
  - **AC:** a GG admin can create the Naga Smash Burger's options from scratch in the UI and the guest sheet behaves like the design; e2e `admin-menu` still green for Brew Bari.

- [ ] **G8 Tests**
  - New e2e specs (use GG table 99 + `TEST_GG_*` logins): `gg-menu.spec.ts` (theme applied: brand colour on the cart button, hero offer, round nav scroll-spy, deals SAVE %, sliders + View all, sold-out Double Smash last, বাং toggle), `gg-order.spec.ts` (Naga Smash meal with drink + Naga + extra cheese = ৳510, wings ৳300, Send to kitchen → counter sees it → statuses → "On the grill" shown to guest → bill total with 5 % VAT), `gg-staff.spec.ts` (GG admin sees only GG data; package picker hidden; counter in GG theme).
  - Full suite green: all Brew Bari specs + GG specs, on `guest`, `staff`, `staff-phone`.
  - Lighthouse mobile on `/grill-ghar`: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95. Record scores here.
  - **AC:** everything green; results in PROGRESS.md.

- [ ] **G9 Docs, deploy, rehearsal**
  - Shared docs: `platform/03-DATABASE.md` §8 Options model v2 + `spice_level`; `platform/04-API.md` (new option fields, `OPTION_INVALID` for inactive groups); `platform/10-PLATFORM.md` (list of layout options and copy keys, new font, "how to add a restaurant" mentions them).
  - Merge to `main`, push (Vercel deploys `menuwala`). Check https://menuwala.vercel.app/grill-ghar and that `/brew-bari` is unchanged in production.
  - Generate Grill Ghar's printable table QR cards PDF → `docs/print/grill-ghar-table-qr-cards.pdf`.
  - Walk through `08-DEMO-SCRIPT.md` on a 375 px viewport. Update PROGRESS.md ("Now", Grill Ghar section, session log). Tag `grill-ghar-v1`.
  - **AC:** production URLs work; demo script passes end to end.

---

## Questions for the human
- **Font licence (blocks shipping, not building).** The Li Alinur Nobin `Readme.txt` says the font may not be uploaded to a website without Lipighor's consent, and a web font is downloaded by every visitor. Has the licence for web embedding been confirmed (same question applies to the already-used Li Hasan Protilipi)? Until answered: build with Alinur Nobin, but keep `hind-siliguri` ready as a one-line fallback in `grill-ghar.ts`.
- _Agents append further questions here._
