# 03 — Grill Ghar data

§1–§2 change **shared code** (every restaurant gets them): after building them, copy the final spec into `../../platform/03-DATABASE.md` (new §8 "Options model v2") and `../../platform/04-API.md`. §3–§5 are Grill Ghar's own data.

## 1. Options model v2 (shared)
Today an item's `options` is an array of groups `{id, name_en, name_bn, type: single|multi, required, choices[{id, name_en, name_bn, price_delta}]}` (`src/lib/schemas.ts`). Add these **optional** fields; existing Brew Bari data stays valid unchanged.

| Field | On | Type | Meaning |
|---|---|---|---|
| `display` | group | `'list' \| 'cards' \| 'chips'` (default `'list'`) | How the item sheet draws the group (05-UI-DESIGN.md GG2). `cards` only for `single` groups with ≤ 3 choices. |
| `show_if` | group | `{ group: string, choice: string }` | The group is **active** only when that choice of an **earlier** group is selected. Inactive groups are hidden, not required, and must have no selection. |
| `description_en` / `description_bn` | choice | string ≤ 60 | Second line on a `cards` choice ("Fries + drink"). |
| `compare_delta` | choice | int > `price_delta` | Display only: the struck-through price of the upgrade ("+৳150 ~~৳200~~", "SAVE ৳50"). The server ignores it. |
| `heat` | choice | int 0–4 | Number of chilis drawn on a `chips` choice. |

Zod (`OptionGroup` / `OptionChoice`): add the fields; refine that `show_if.group` is the id of an earlier group and `show_if.choice` exists in it, and that `compare_delta > price_delta`.
Client (`src/lib/menu/options.ts`): add `activeGroups(groups, selected)`; `calculateItemPrice`, `validateOptionRequirements` and `formatSelectedChoicesForCart` use only active groups; deselecting a parent clears the child's selection. The sheet's auto-select of the first choice for required single groups (`ItemDetailSheet.tsx`) applies only to active groups.

**New column** `menu_items.spice_level smallint null check (spice_level between 0 and 4)` — drawn as chilis on the bold item card (0 = none shown, 4 = "Naga hot", 3 chilis).

## 2. Server pricing (shared) — migration `20261015000006_option_rules.sql`
Change `public.price_cart` (in `20261012000003_rpc.sql`) with `create or replace`:
- Walk groups in order, remembering the selected choice ids so far.
- A group with `show_if` whose `(group:choice)` is **not** selected is inactive: skip its required check; if any of its choices is in the cart line → `raise exception 'OPTION_INVALID:%'`.
- Everything else unchanged (prices still only from the DB; `compare_delta`, `description_*`, `heat`, `display` are ignored).
Also: `alter table menu_items add column spice_level …`. Regenerate types, run advisors.
**SQL test** `supabase/tests/10_option_rules.sql` (begin … rollback, on a temporary item of restaurant `grill-ghar`): meal + drink → priced with both deltas; meal without drink → `OPTION_REQUIRED`; drink without meal → `OPTION_INVALID`; solo → base price; tampered `price_delta` in the request is ignored. Re-run `04_place_order.sql` and `09_multi_restaurant.sql`.

## 3. Seed — `supabase/seed-grill-ghar.sql`
Idempotent (`on conflict do nothing` / look up ids by slug). Applied once via MCP `execute_sql`, committed as a file.

### Restaurant
| Column | Value |
|---|---|
| slug / theme_key | `grill-ghar` / `grill-ghar` |
| name_en / name_bn | Grill Ghar / গ্রিল ঘর |
| tagline_en / tagline_bn | Grilled hot, served fast / গরম গরম গ্রিল, ঝটপট পরিবেশন |
| package / package_locked / is_listed | 3 / true / true |
| vat_percent / service_charge_percent / require_session_approval | 5 / 0 / true |
| address | Agrabad Access Road, Chattogram (fictional demo address) |
| opening_hours_en / bn | Every day 12 pm – 11 pm / প্রতিদিন দুপুর ১২টা – রাত ১১টা |
| phone, facebook_url, instagram_url, google_maps_url, google_review_url | `null` (the info sheet hides empty rows; Turjo fills them per pitch) |
| wifi_name / wifi_password | GrillGhar_Guest / grillghar2026 (demo values, shown to guests anyway) |
| logo_url | `null` (theme fallback `/images/brand/grill-ghar.svg`) |

### Categories (sort, icon key)
1 Set meals / সেট মিল (`meal`) · 2 Burgers / বার্গার (`burger`) · 3 Fried chicken / ফ্রাইড চিকেন (`chicken`) · 4 Shawarma & wraps / শাওয়ারমা ও র‍্যাপ (`shawarma`) · 5 Fries & sides / ফ্রাইজ ও সাইড (`fries`) · 6 Shakes & drinks / শেক ও ড্রিংকস (`shake`)

### Shared option groups (copy into each item that uses them)
- **MEAL** `{id:'meal', name_en:'Make it a meal?', name_bn:'মিল করবেন?', type:'single', required:true, display:'cards', choices:[{id:'solo', name_en:'Just the item', name_bn:'শুধু আইটেম', description_en:'No sides', description_bn:'সাইড ছাড়া', price_delta:0}, {id:'meal', name_en:'Meal', name_bn:'মিল', description_en:'Fries + drink', description_bn:'ফ্রাইজ + ড্রিংক', price_delta:150, compare_delta:200}]}` (burgers: "Just the burger" / "শুধু বার্গার")
- **DRINK** `{id:'drink', name_en:'Your meal drink', name_bn:'মিলের ড্রিংক', type:'single', required:true, display:'list', show_if:{group:'meal', choice:'meal'}, choices:[cola 0, lemon (Lemon-lime soda) 0, orange (Orange soda) 0, lassi (Mango lassi) 30, water (Mineral water) 0]}`
- **SPICE** `{id:'spice', name_en:'Spice level', name_bn:'ঝাল', type:'single', required:true, display:'chips', choices:[mild heat 1, medium heat 2, hot heat 3, naga heat 4 — all price 0]}` (Mild / মাইল্ড, Medium / মিডিয়াম, Hot / হট, Naga / নাগা)
- **EXTRAS** `{id:'extras', name_en:'Add extra', name_bn:'এক্সট্রা যোগ করুন', type:'multi', required:false, choices:[cheese Extra cheese 40, patty Extra patty 120, jalapeno Jalapeños 30, egg Fried egg 30]}`
- **DIP** `{id:'dip', name_en:'Dip', name_bn:'ডিপ', type:'single', required:true, choices:[garlic Garlic mayo 0, bbq BBQ 0, naga Naga mayo 20]}`

Drink names are **generic** (no trademarks). The design's "Coca-Cola" is sample text only.

### Menu items
Columns: name EN / BN · price · compare_at_price · prep_minutes · spice_level · tags · option groups. Write a short appetising `description_en/bn` for each (≤ 90 chars, no invented claims like "award-winning").

| # | Category | Name EN / BN | ৳ | Was | Min | Spice | Tags | Options |
|---|---|---|---|---|---|---|---|---|
| 1 | Set meals | Solo Combo / সোলো কম্বো | 390 | 470 | 12 | 1 | bestseller | burger choice (single req: Classic beef 0, Crispy chicken 0, Naga smash +40), DRINK without `show_if` |
| 2 | Set meals | Duo Feast / ডুও ফিস্ট | 750 | 890 | 15 | 1 | | SPICE |
| 3 | Set meals | Family Bucket / ফ্যামিলি বাকেট | 1290 | 1550 | 18 | 1 | | SPICE |
| 4 | Set meals | Shawarma Duo / শাওয়ারমা ডুও | 420 | 500 | 10 | 1 | new | SPICE |
| 5 | Burgers | Classic Beef Burger / ক্লাসিক বিফ বার্গার | 280 | | 10 | 0 | bestseller | MEAL, DRINK, EXTRAS |
| 6 | Burgers | Naga Smash Burger / নাগা স্ম্যাশ বার্গার | 320 | | 12 | 4 | new | MEAL, DRINK, SPICE, EXTRAS |
| 7 | Burgers | Crispy Chicken Burger / ক্রিস্পি চিকেন বার্গার | 260 | | 9 | 2 | | MEAL, DRINK, SPICE, EXTRAS |
| 8 | Burgers | Double Smash / ডাবল স্ম্যাশ | 420 | | 14 | 1 | | MEAL, DRINK, EXTRAS |
| 9 | Burgers | Mushroom Swiss Burger / মাশরুম সুইস বার্গার | 340 | | 12 | 0 | | MEAL, DRINK, EXTRAS |
| 10 | Burgers | BBQ Beef Burger / বারবিকিউ বিফ বার্গার | 360 | | 12 | 1 | | MEAL, DRINK, EXTRAS |
| 11 | Fried chicken | Crispy Chicken · 2 pc / ক্রিস্পি চিকেন · ২ পিস | 240 | | 8 | 1 | bestseller | MEAL (meal +130, compare 180), DRINK, SPICE |
| 12 | Fried chicken | Hot Wings · 6 pc / হট উইংস · ৬ পিস | 300 | | 6 | 3 | | DIP |
| 13 | Fried chicken | Chicken Strips · 5 pc / চিকেন স্ট্রিপস · ৫ পিস | 280 | | 7 | 1 | | DIP |
| 14 | Fried chicken | Popcorn Chicken / পপকর্ন চিকেন | 220 | | 5 | 2 | | DIP |
| 15 | Fried chicken | Chicken Bucket · 8 pc / চিকেন বাকেট · ৮ পিস | 950 | | 12 | 1 | | SPICE |
| 16 | Shawarma | Chicken Shawarma / চিকেন শাওয়ারমা | 180 | | 6 | 1 | bestseller | SPICE |
| 17 | Shawarma | Beef Shawarma / বিফ শাওয়ারমা | 220 | | 7 | 2 | | SPICE |
| 18 | Shawarma | Naga Shawarma / নাগা শাওয়ারমা | 200 | | 6 | 4 | new | — |
| 19 | Shawarma | Shawarma Platter / শাওয়ারমা প্ল্যাটার | 320 | | 10 | 1 | | SPICE |
| 20 | Fries & sides | Regular Fries / রেগুলার ফ্রাইজ | 120 | | 4 | 0 | pairs-well | — |
| 21 | Fries & sides | Masala Fries / মসলা ফ্রাইজ | 150 | | 4 | 2 | pairs-well | — |
| 22 | Fries & sides | Loaded Cheese Fries / লোডেড চিজ ফ্রাইজ | 220 | | 6 | 0 | | — |
| 23 | Fries & sides | Onion Rings / অনিয়ন রিংস | 160 | | 5 | 0 | pairs-well | — |
| 24 | Shakes & drinks | Oreo Shake / ওরিও শেক | 220 | | 4 | | pairs-well | — |
| 25 | Shakes & drinks | Chocolate Shake / চকলেট শেক | 200 | | 4 | | | — |
| 26 | Shakes & drinks | Mango Lassi / ম্যাংগো লাচ্ছি | 150 | | 3 | | pairs-well | — |
| 27 | Shakes & drinks | Soft Drink · 250 ml / সফট ড্রিংক · ২৫০ মি.লি. | 80 | | 1 | | | flavour (single req: Cola, Lemon-lime, Orange) |
| 28 | Shakes & drinks | Mineral Water / মিনারেল ওয়াটার | 30 | | 1 | | | — |

Mark **#8 Double Smash sold out** (`is_available = false`) so the demo can show the sold-out state, like Brew Bari's cheesecake. Sort order = the table order inside each category. "Oreo" is a trademark; if you prefer, rename #24 to "Cookies & Cream Shake / কুকিজ অ্যান্ড ক্রিম শেক" (agent's choice, note it in PROGRESS).

### Offers (hero cards)
| # | title_en (use `\n` for line breaks) / title_bn | subtitle_en / bn | badge | links to |
|---|---|---|---|---|
| 1 | SMOKY.\nJUICY.\nNAGA HOT. / ধোঁয়া।\nরসালো।\nনাগা ঝাল। | Solo Combo — any burger, fries & drink / সোলো কম্বো — যেকোনো বার্গার, ফ্রাইজ ও ড্রিংক | This week only / শুধু এই সপ্তাহে | item #1 |
| 2 | FAMILY\nBUCKET\nNIGHT / ফ্যামিলি\nবাকেট\nনাইট | 8 pc chicken, 2 fries, 1.25 L drink / ৮ পিস চিকেন, ২ ফ্রাইজ, ১.২৫ লি. ড্রিংক | Fri & Sat / শুক্র ও শনি | item #3 |
| 3 | TWO'S\nCOMPANY / দুজনের\nজন্য | Duo Feast: 2 burgers, 2 fries, 2 drinks / ডুও ফিস্ট: ২ বার্গার, ২ ফ্রাইজ, ২ ড্রিংক | Save 16% / ১৬% সাশ্রয় | item #2 |

### Tables
Tables 1–12 (`seats` 4, table 12 label "Family", seats 8) + test table **99** (`label 'TEST'`), same as Brew Bari's test-table rule in `../../platform/06-TESTING.md`.

## 4. Staff (Supabase Auth)
Create 2 users: Grill Ghar **admin** and **counter** (emails on a domain you choose, e.g. `admin@grillghar.test`), strong random passwords, `staff` rows linked to the Grill Ghar restaurant. Store them **only** in `.env.local` as `TEST_GG_ADMIN_EMAIL`, `TEST_GG_ADMIN_PASSWORD`, `TEST_GG_COUNTER_EMAIL`, `TEST_GG_COUNTER_PASSWORD` (names, not values, in `.env.example`). Never in code, docs, seed files or commit messages — the repo is public.

## 5. Images
**Where to get them:** only **Unsplash** (unsplash.com, Unsplash License) or **Pexels** (pexels.com, Pexels License). Both allow free use in apps without permission. Never Google Images, other restaurants' sites or social media, stock sites with watermarks, or AI-generated images.

**The photo must show that exact dish.** For each of the 28 items, 3 offers:
1. Search the dish by name (e.g. "chicken shawarma wrap", "onion rings", "mango lassi", "smash burger").
2. **Open and look at the photo before using it.** It must clearly show the named food (shawarma = a shawarma wrap, not a burrito or a generic sandwich; wings = chicken wings; lassi = a yellow lassi in a glass). If you are not sure what the photo shows, pick another.
3. Reject photos with visible brand logos, printed text, watermarks, people's faces, or non-halal items (no pork/bacon — Bangladeshi market).
4. Prefer warm light and a plain or dark background so the menu looks consistent. Several items of the same type (e.g. 6 burgers) must still look different from each other.
5. If no good photo of a dish exists, use the closest real photo of the same dish type and write "closest match" in the credits.

**Optimise** with a script `scripts/optimize-menu-images.mjs` using `sharp` (add `sharp` as a devDependency — approved): items → **500×500 WebP**, cover crop centred on the food, quality 82, target ≤ 40 KB; offers → **800×800 WebP**, quality 80 (the hero shows them in a circle). Keep the downloaded originals out of git (download to a git-ignored folder, e.g. `.cache/images/`).

**Store** at `public/images/menu/grill-ghar/<kebab-name>.webp` (offers: `public/images/offers/grill-ghar/…`) and set `image_url` to the path starting with `/images/…` (same as Brew Bari).

**Credit** every photo in `IMAGE-CREDITS.md` (this folder): item, file, photographer, source URL, licence.
