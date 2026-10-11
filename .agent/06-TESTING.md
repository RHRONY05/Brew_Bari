# 06 — Testing

Three layers. Each task in 07-TASKS.md names the tests it must add or pass.

| Layer | Tool | Runs against | Command |
|---|---|---|---|
| Unit / component | Vitest + Testing Library + jsdom | nothing external | `npm run test` |
| Database (RLS + RPC) | SQL files in `supabase/tests/` | Supabase project via MCP `execute_sql` (each file in `begin … rollback`) | agent runs via MCP |
| Integration | Vitest (`tests/integration`, separate config) | Supabase project via anon key + test staff logins | `npm run test:int` |
| End-to-end | Playwright | `next dev` (or preview URL) + Supabase project | `npm run test:e2e` |

## Test data rules
- Integration/E2E tests never touch Brew Bari's real tables 1–8. The seed adds a **test-only table 99** for Brew Bari (`number = 99, label = 'TEST'`). Tests read its token through a staff login (anon cannot read tokens).
- Tests clean up after themselves: close table 99's session in `afterEach` (staff client).
- Package switching tests restore `package = 3` in `afterAll`.
- Credentials come from env (`TEST_STAFF_*`), never hard-coded.

Add to `seed.sql`:
```sql
insert into public.tables (restaurant_id, number, label, seats, is_active)
select id, 99, 'TEST', 2, true from public.restaurants where slug = 'brew-bari';
```
The counter board and print sheet **hide tables labelled `TEST`** unless `?showTest=1`.

## 1. Unit tests (minimum list)
| File | Covers |
|---|---|
| `tests/unit/features.test.ts` | `features(1|2|3)` matrix exactly as 01-PRODUCT.md |
| `tests/unit/money.test.ts` | `formatTaka(250,'en') === '৳250'`, `formatTaka(250,'bn') === '৳২৫০'`, thousands `৳1,250` / `৳১,২৫০` |
| `tests/unit/cart.test.ts` | add/merge identical lines (same item+choices+note), qty limits 1–20, remove, subtotal with option deltas, clear on session change, persistence round-trip |
| `tests/unit/options.test.ts` | client price preview = base + deltas; required single group must be chosen; multi allows 0..n |
| `tests/unit/errors.test.ts` | parse `ITEM_SOLD_OUT:<uuid>`, unknown → generic, EN/BN messages exist for every code |
| `tests/unit/i18n.test.ts` | `bn` has every key of `en` (type-level + runtime), `pick()` falls back to EN |
| `tests/unit/requests.test.ts` | allowed transitions table; table tile state priority function |
| `tests/unit/menu-sort.test.ts` | `sortForGuest` puts sold-out last keeping sort_order; `quickPicks` excludes sold-out / null / > 5 min, sorts fastest first; prep label: null → none, 1 → "Ready now"/"এখনই রেডি", 4 → "~4 min"/"~৪ মিনিট" |
| `tests/unit/schemas.test.ts` | `ItemOptions`, `CartLine` accept valid / reject invalid |
| component tests | `ItemCard` (sold-out hides +, P1 hides +), `ItemSheet` (required option blocks Add), `ActionBar` per package, `LanguageToggle` |

## 2. Database tests (`supabase/tests/*.sql`)
Pattern:
```sql
begin;
  -- arrange as postgres (owner)
  ...
  set local role anon;
  -- act / assert: use DO blocks that raise on failure
  do $$ begin
    perform 1 from public.service_requests limit 1;
    raise exception 'FAIL: anon could read service_requests';
  exception when insufficient_privilege then null;  -- expected
  end $$;
rollback;
```
Note: with RLS, an anon `select` may return **0 rows** rather than raising — assert "0 rows visible" where that is the behaviour (tables without anon policies return nothing; tables with no GRANT raise). Accept either, but never > 0 rows.

| File | Asserts |
|---|---|
| `01_rls_anon.sql` | anon sees 0 rows of tables/sessions/requests/items/feedback/staff; anon cannot insert/update/delete any table; anon sees only active items & live offers |
| `02_rpc_grants.sql` | anon cannot execute `price_cart`, `_ensure_session`, `_create_request`, `_table_ctx`; can execute the 7 guest RPCs |
| `03_call_waiter.sql` | creates session (pending when approval on); 1st call creates request; 2nd returns `duplicate=true`, `nudge_count=1`; items attached with DB prices |
| `04_place_order.sql` | tampered payload (extra `price` field) ignored; sold-out → `ITEM_SOLD_OUT:`; missing required option → `OPTION_REQUIRED:size`; unknown choice → `OPTION_INVALID`; package 2 → `FEATURE_NOT_IN_PACKAGE` |
| `05_bill.sql` | two orders (one cancelled) → subtotal excludes cancelled; VAT 5 % rounding (e.g. 250 → 13 → total 263) |
| `06_rate_limit.sql` | 16th request within 10 min → `RATE_LIMITED` |
| `07_feedback.sql` | rating 0/6 → `BAD_RATING`; second submit updates instead of inserting |
| `08_staff_rls.sql` | (set `request.jwt.claims` to a counter user) counter can update request status, cannot update restaurants/categories; admin can |

## 3. Integration tests (`tests/integration`)
Real Supabase over HTTP with supabase-js — catches grant/RLS/Realtime issues SQL tests can't:
- anon client: `rpc('get_table_context', {p_token: test99})` → session returned; `from('tables').select()` → empty.
- counter client: receives a Realtime INSERT within 3 s after anon `call_waiter`.
- counter client: can move `order` request through statuses; guest `get_session_status` reflects it.
- admin client: `toggleAvailability` → anon menu query shows `is_available=false`.
- storage: anon upload to `menu-images` fails; admin upload into own folder succeeds; into another folder fails.

## 4. End-to-end (`tests/e2e`, Playwright)
Projects: `guest` (device: Pixel 7 — 412×915, touch), `staff` (Desktop Chrome 1280×800) and `staff-phone` (Pixel 7, used by admin/counter specs tagged `@phone` — run `admin-menu`, `admin-tables` and `p2-call-waiter` staff half on it too). Multi-actor tests use two browser contexts in one test.

| Spec | Flow |
|---|---|
| `p1-menu.spec.ts` | set package 1 → `/m/brew-bari`: header, offers, chips scroll-spy, search "latte" finds Café Latte & Iced Latte, item sheet has no Add, sold-out cheesecake visible & disabled and **last** in Bites & Desserts; tap **Quick** → only items ≤ 5 min, Cold Brew/Brownie ("Ready now") first, no cheesecake; switch to বাং → names + `৳২৫০`; reload keeps বাং |
| `p2-call-waiter.spec.ts` | package 2 → guest opens table 99, adds Cappuccino (Large, Oat) ×2, Call waiter → "Waiter called"; staff counter sees card "Table 99" with items & `৳780` within 3 s, sound flag set (stub `HTMLMediaElement.play`/AudioContext and assert called); staff "Waiter sent" → guest sees "Waiter coming"; guest taps again → staff card shows "Called again ×1"; no Place order button visible |
| `p3-order-bill-review.spec.ts` | package 3 → guest orders; staff Accept → Preparing → Ready → Served while guest stepper updates; guest View bill shows VAT; Request bill → staff sees Bill card; guest rates 2★ + comment → **Review on Google button still shown** (no gating) and clipboard contains the comment; staff "Paid & close table" → guest sees thank-you; re-open table URL → fresh session, empty cart |
| `sold-out-race.spec.ts` | guest has Mocha in cart; admin marks Mocha sold out; guest places order → error names Mocha, other lines kept |
| `admin-menu.spec.ts` | admin edits Americano price 200 → 210 and adds BN name; guest menu shows ৳210 after reload; create item with an options group; upload image (fixture file) |
| `admin-tables.spec.ts` | regenerate table 99 token → old URL shows invalid-QR page, new one works; print page renders 9 cards for 8+1 tables with `showTest=1` |
| `session-approval.spec.ts` | approval on: guest calls → card shows "Unverified"; staff Approve → badge gone |
| `responsive.spec.ts` | guest menu at 768×1024 and 1440×900: no horizontal overflow (`scrollWidth <= innerWidth`), 3/4-column grid, item sheet opens as a centred dialog, add → cart works; admin at 390×844: top tabs visible (no sidebar), toggle availability, open edit page and save; counter at 390×844: table strip + cards, "Waiter sent" works |
| `auth.spec.ts` | `/staff/counter` redirects to login when logged out; counter role cannot open `/staff/admin` |

## 5. Non-functional checks (task T7.3)
- **Lighthouse (mobile)** on `/m/brew-bari`: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95. Record scores in 07-TASKS.md.
- **Bundle**: `next build` output — `/m/[slug]` first-load JS ≤ 150 KB gz.
- **Long-running counter**: leave the board open 30 min with a request every 2 min (script) — no missed events, memory stable, reconnect after toggling Wi-Fi off/on.
- **Manual device check**: one real Android phone (Chrome) + one iPhone (Safari) scanning a printed QR; Bangla renders correctly; sheets don't fight the browser's bottom bar (use `dvh` + safe-area insets).

## Scripts (`package.json`)
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:int": "vitest run --config vitest.integration.config.ts",
  "test:e2e": "playwright test"
}
```
(If the installed Next.js version removed `next lint`, use `eslint .` instead.)
