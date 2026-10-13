# 10 — Menuwala platform (multi-restaurant)

Since 2026-10-14 this codebase is **Menuwala**: one app, one database, many restaurants. Brew Bari is restaurant #1. Every new restaurant is **data + a theme**, never a copy of the code.

Restore point before the platform refactor: git tag `brew-bari-v1`.

## URLs
| What | URL |
|---|---|
| Platform home (lists `is_listed` restaurants, staff login link) | `/` |
| Guest menu (shop QR) | `/<slug>` e.g. `/brew-bari` |
| Table QR | `/<slug>/t/<token>` |
| Staff (counter, admin) | `/staff/...` — the restaurant comes from the logged-in staff member, never from the URL |
| Old `/m/<slug>` | 308 → `/<slug>` (`next.config.ts` redirects) |
| Old `/t/<token>` | 308 → `/<slug>/t/<token>` (`src/proxy.ts`, via RPC `resolve_table_slug`) |

Build URLs only with `src/lib/site-urls.ts` (`menuPath`, `tablePath`, `menuUrl`, `tableUrl`, `qrBaseUrl`). Never write `/t/` or a slug literal in components.

**Reserved slugs** (DB check constraint `restaurants_slug_not_reserved`): `staff, api, m, t, admin, login, logout, auth, platform, demo, dev, static, public, images, fonts, sounds, new, signup, pricing, about, contact, help, support, terms, privacy`. Static routes always win over `/<slug>`, so a new top-level route must also be added to that list (new migration).

## Database (migration `20261014000005_multi_restaurant.sql`)
New `restaurants` columns:
| Column | Meaning |
|---|---|
| `theme_key` | key of a theme in `src/themes` (default `brew-bari`) |
| `package_locked` | `true` = package fixed by the platform; admin can't change it, package picker hidden, `?pkg=` preview ignored |
| `is_listed` | show on the platform home |
| `custom_domain` | reserved for later (own domain → restaurant); not wired yet |

**Platform-managed fields** (`slug, theme_key, package_locked, is_listed, custom_domain`, and `package` when locked) can only be changed with the service role / SQL editor / Supabase MCP. A restaurant admin who tries gets `PLATFORM_MANAGED_FIELD` (trigger `guard_restaurant_admin_update`).

**Isolation** is enforced by RLS on `restaurant_id` (unchanged from Brew Bari). Verified by `supabase/tests/09_multi_restaurant.sql`: an admin of restaurant A sees 0 rows and updates 0 rows of restaurant B. Run it after any RLS change.

Staff: one user = one restaurant (`staff.user_id` is the primary key). A person who works for two restaurants needs two logins.

## Themes (`src/themes/`)
| File | Purpose |
|---|---|
| `types.ts` | `Theme` type: `tokens`, `fonts`, `layout`, `icons`, `copy`, `assets` |
| `brew-bari.ts` | Brew Bari (tokens = the defaults in `globals.css`) |
| `menuwala.ts` | the platform's own look (home, login, 404) |
| `index.ts` | `THEMES` registry, `getTheme(key)`, `themeCss(theme)` |
| `fonts.ts` | the **curated font list** (next/font needs fonts at build time) |
| `ThemeStyle.tsx` | `<style>` that applies a theme to the whole document |
| `ThemeContext.tsx` | `ThemeProvider`, `useTheme()`, `VenueIcon` for client components |

How a theme is applied:
- Guest pages (`/[slug]`, `/[slug]/t/[token]`) render `<ThemeStyle theme={getTheme(restaurant.theme_key)} />`; `MenuClient`/`TableClient` wrap their tree in `ThemeProvider`.
- Staff pages: `StaffRestaurantProvider` (in `src/app/staff/(protected)/layout.tsx`) loads staff → restaurant, renders `ThemeStyle` + `ThemeProvider`, and exposes `useStaffRestaurant()` → `{ restaurant, role, theme, logo }`.

Rules for components:
- Colours only through tokens (`bg-brand`, `text-ink`, `shadow-[0_6px_20px_rgb(var(--shadow-rgb)/0.08)]`, `bg-[var(--offer-from)]`). **No hex values in components.** Canvas/QR code colours come from `readThemeColors()` (`src/lib/theme-colors.ts`), so colour tokens must be **hex**.
- Restaurant name, logo, Wi-Fi, links come from the `restaurants` row; logo = `restaurant.logo_url || theme.assets.logo`.
- Restaurant-type wording (search placeholder, "Café info") comes from `theme.copy`. Placeholder icons use `<VenueIcon />`.
- A visual difference between restaurants = a new **option** in `Theme['layout']` implemented once in the component (e.g. `offerDecoration: 'liquid-splash' | 'none'`). Never fork a component per restaurant.

## How to add a restaurant (checklist)
1. **Theme**: create `src/themes/<key>.ts` (copy `brew-bari.ts`), set tokens (hex), fonts from `fonts.ts`, layout options, icons, copy, fallback logo in `public/images/brand/`. Register it in `THEMES` in `src/themes/index.ts`. Add new layout options to `types.ts` + the component if needed.
2. **Fonts**: if the theme needs a font that isn't in `fonts.ts`, add it there (with `preload: false`) and to the font key types + `FONT_VARIABLES`.
3. **Data** (Supabase MCP, as a seed SQL file in `supabase/seed-<slug>.sql`): `restaurants` row (`slug`, names EN/BN, `theme_key`, `package`, `package_locked`, `is_listed`, info, Wi-Fi, links, VAT), categories, menu items (EN/BN, prices, `prep_minutes`, options), offers, tables 1–N + test table 99.
4. **Staff**: create admin + counter users in Supabase Auth, insert `staff` rows. Put credentials only in `.env.local` / a password manager — **never in code or docs**.
5. **Images**: upload to Storage `menu-images/<restaurant_id>/…` and set `image_url`/`logo_url`.
6. **Verify**: `/<slug>` renders with the new theme; `/brew-bari` is unchanged; run `supabase/tests/09_multi_restaurant.sql`; e2e suite green.

## Not done yet (on purpose)
- `custom_domain` mapping (column exists; proxy doesn't route by host yet).
- Per-restaurant e2e suites: the existing suite covers Brew Bari; add a spec per new restaurant for its theme + flows.
- Layout options beyond `offerDecoration` — add them when the next restaurant's design needs them (e.g. category nav `pills | icons`, item card `standard | deal`).
