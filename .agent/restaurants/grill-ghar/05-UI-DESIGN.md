# 05 — Grill Ghar UI design

Base spec: `../brew-bari/05-UI-DESIGN.md` (components, responsive rules, states, staff screens). This file gives Grill Ghar's **theme values**, the **new layout options**, and what changes on the 4 redrawn screens. Visual source of truth: `design/*.dc.html` (390 px wide, see `design/README.md`). Canvas (humans only): https://claude.ai/artifact/WM7cSVw4jUrtYPxQYdsG9n

## 1. Theme `src/themes/grill-ghar.ts`
### Tokens (hex only — canvas/QR code reads them through `readThemeColors()`)
| Token | Value | Use |
|---|---|---|
| `bg` | `#FFF5EA` | warm cream page |
| `surface` | `#FFFFFF` | cards, sheets' inner boxes |
| `surface-2` | `#FBE3CC` | photo placeholders, count badges, soft fills |
| `surface-subtle` | `#FFFAF4` | |
| `line` | `#F0DCC8` | borders |
| `line-soft` | `#F7E8DA` | dividers |
| `ink` | `#2B1510` | text (burnt brown), dark cards, table chip |
| `ink-2` | `#6B4A3F` | secondary text |
| `ink-3` | `#8A6A5E` | captions, struck-through prices (4.5:1 on `bg`) |
| `brand` | `#D2291C` | chili red: primary buttons, + buttons, selected states (white text 5.1:1) |
| `brand-muted` | `#E0493C` | hover |
| `brand-dark` | `#8E1A12` | maroon: hero gradient end, text on `surface-2` |
| `brand-ink` | `#FFF5EA` | text on brand |
| `accent` | `#FFB22C` | mustard: SAVE badges, "New", progress bar, current step |
| `accent-ink` | `#2B1510` | text on accent |
| `accent-strong` | `#F29A00` | |
| `shadow-rgb` / `ink-rgb` | `43 21 16` | |
| `accent-rgb` | `255 178 44` | |
| `offer-from` / `offer-via` / `offer-to` | `#D2291C` / `#B32116` / `#8E1A12` | hero card gradient |
| `offer-shadow-rgb` | `142 26 18` | |
| `offer-image-bg` | `#F7C9A8` | circle behind the hero photo |
| `r-sm` / `r-md` / `r-lg` / `r-xl` / `radius` | `10px` / `16px` / `20px` / `28px` / `16px` | cards 20, buttons 16, sheets 28 |
Status colours (`success`, `warning`, `danger`, `info` and their `-soft`) keep the defaults. Paper tokens keep the defaults.

### Fonts
| Role | Font | Notes |
|---|---|---|
| Headings (`heading`) | `cinzel` | already in `fonts.ts` (Brew Bari's heading). Weights 700–900; hero headline in caps |
| Body (`body`) | `poppins` | already in `fonts.ts` |
| Bangla (`bengali`) | **`alinur-nobin`** — **new** | Li Alinur Nobin Unicode (Lipighor). Add as a `localFont` exactly like `hasanProtilipi`: files `src/app/fonts/Li-Alinur-Nobin-Unicode.ttf` (+ `-Italic`), `unicode-range` Bengali only, `preload: false`. Add `'alinur-nobin'` to `BengaliFontKey` and `FONT_VARIABLES`. Source: `public/fonts/AlinurNobin.zip` → use only the `Unicode/` TTFs, rename without spaces, then **delete the zip from `public/`** (anything in `public/` is downloadable from the live site). |

### Icons, copy, assets
- `icons.venue`: `'utensils'`.
- `copy.searchPlaceholder`: "Search burgers, chicken, shawarma…" / "বার্গার, চিকেন, শাওয়ারমা খুঁজুন…"
- `copy.infoLabel`: "Restaurant info" / "রেস্টুরেন্টের তথ্য"
- New optional copy keys (fall back to the i18n dictionary when a theme omits them, so Brew Bari needs no change): `statusPreparing` ("On the grill" / "গ্রিলে চলছে"), `placeOrder` ("Send to kitchen" / "কিচেনে পাঠান"), `dealsTitle` ("Meal deals" / "মিল ডিলস"), `quickBannerTitle` ("In a hurry?" / "তাড়া আছে?"), `quickBannerSubtitle` ("Fries, wings & shakes — ready in 5 min" / "ফ্রাইজ, উইংস আর শেক — ৫ মিনিটে রেডি").
- `assets.logo`: `/images/brand/grill-ghar.svg` — a simple flame mark in a rounded red square (see the header in `design/Main.dc.html`), made by the agent as a small SVG. Not a copy of any real brand.

## 2. New layout options (`Theme['layout']`)
Each is implemented **once** in the shared component. Brew Bari gets the first value of each, which must equal today's behaviour (Brew Bari e2e stays green, screens look identical).

| Option | Values (Brew Bari first) | Grill Ghar | Where |
|---|---|---|---|
| `offerDecoration` | `'liquid-splash'` \| `'none'` (exists) | `'none'` | `OfferCarousel` |
| `offerStyle` | `'banner'` \| `'hero'` | `'hero'` | `OfferCarousel`: hero = 210 px card, gradient `offer-from→offer-to`, badge pill (accent), headline Cinzel 900 27 px caps with line breaks (`white-space: pre-line`, `\n` in the title), subtitle, photo in a 210 px circle bleeding off the right edge, bottom-left price pill (item price + struck-through `compare_at_price`, arrow). Dots below. |
| `categoryNav` | `'chips'` \| `'round-icons'` | `'round-icons'` | `CategoryNav`: 54 px circles in a 3 px ring, label below; active = brand fill + brand ring + bold brand label. First item "All" (scroll to top). Same scroll-spy as chips. |
| `itemCard` | `'standard'` \| `'bold'` | `'bold'` | `ItemCard`: 158 px wide in sliders; photo 1:0.82 with badge top-left and prep pill top-right on the photo; name; chili row from `spice_level`; price + 32 px round brand **+**. Sold out = 55 % opacity + "Sold out" instead of +. |
| `dealsRow` | `false` \| `true` | `true` | `MenuClient`: "Meal deals" slider (176 px cards, SAVE X% badge, struck price, 34 px +) above the categories. Hidden when there are no deals. |
| `quickPicks` | `'section'` \| `'banner'` | `'banner'` | `MenuClient`: dark `ink` banner, accent bolt icon, title + subtitle from copy, "See →". Tap = same as Brew Bari's Quick chip (shows quick items). |
| `cartUpsell` | `false` \| `true` | `true` | `CartSheet`: "Goes well with" slider of `pairs-well` items (GG-05). |
| `statusCard` | `'standard'` \| `'hero'` | `'hero'` | `TableStatusSheet`: dark `ink` card with 56 px accent icon tile, "Order N · sent 7:42 pm", big Cinzel status, accent sub-line, 8 px progress bar (accent on 15 % cream). |

Category sections are **sliders for every theme** (that is Brew Bari's existing `CategorySection` behaviour: horizontal slider + count badge + "View all"/"Slider" toggle). Do not add an option for it; reuse it with the `itemCard` option.

### Category icons
`categories.icon` holds an icon key. Add these keys to `CATEGORY_ICON_MAP` (`src/components/ui/category-icon.tsx`): `meal` → `ChefHat`, `burger` → `Hamburger`, `chicken` → `Drumstick`, `shawarma` → `Sandwich`, `fries` → a small custom `FriesIcon` (lucide-style 24×24 stroke SVG; path in `design/Main.dc.html` → `icons.fries`), `shake` → `CupSoda`. All exist in the installed `lucide-react` 1.55 except fries.

## 3. Screens
### GG1 Menu home — `design/Main.dc.html`
Header: logo tile (48 px, brand, rounded 16) · name (Cinzel 800 21 px) · `ink` "Table 7" chip + tagline · EN/বাং toggle · info button. Search (50 px, white, rounded 16). Hero offer. Round category icons. Meal deals row. "In a hurry?" banner. Category sliders (Burgers, Fried chicken, …). Bottom: live order pill (`ink`, accent flame, "Track →") + action bar (white bar, outlined "Waiter" button, brand "View cart" with accent count bubble and total). Order in the page = exactly this.

### GG2 Item detail — `design/ItemDetail.dc.html`
Sheet with photo (220 px, rounded 22, badge), Cinzel 24 px name, description, prep + "Spicy" chips, price. Then the option groups, **rendered by `display`** (see 03-DATA.md §1): `cards` → "Make it a meal?" two cards (selected = 2 px brand border + shadow; struck price + SAVE badge from `compare_delta`); `list` → radio rows (drink); `chips` → 4 chili chips (selected = brand fill); multi → checkbox tiles in a 2-column grid. Groups with `show_if` appear/disappear with a short height animation (respect reduced motion). Required badge: `surface-2` pill "Required". Sticky bottom: qty stepper + brand button "Add meal · ৳510" (label "Add to cart" when no meal choice is picked).

### GG3 Cart — `design/Cart.dc.html`
Lines with photo, name, accent **MEAL** badge when a `cards` group's non-zero choice is picked, options summary, stepper, line total. "Goes well with" slider. Kitchen note. Totals box with "You save with meals" (success colour) and "VAT 5 % is added on the bill. Pay at the counter." CTA "Send to kitchen · ৳810" with flame icon.

### GG4 Order tracking — `design/Status.dc.html`
Hero status card (above). Vertical stepper: Received → Accepted → **On the grill** → Ready → Served (done = brand dot with check, current = accent dot with soft glow, next = outlined). Order summary box. Buttons: outlined "Call waiter", brand "Order more". Text button "Request the bill". The design's `stage` tweak shows each state.

### Screens not redrawn
Bill, Review, Info, invalid-QR page, Counter (desktop + phone), Admin (all pages), Login: same layout as Brew Bari, tokens/fonts from the Grill Ghar theme. Check each one at least once with the theme applied (contrast, no Brew Bari-specific wording or icons).

### Bangla
Every new string has EN + BN (i18n dictionary or theme copy). Check GG1–GG4 in বাং at 375 px: no overflow with Alinur Nobin (it is wider than Hind Siliguri — allow 2 lines on card names).

### Tablet / desktop
Same rules as Brew Bari ("Responsive rules" in the base spec): content max-width, sliders keep working with mouse (arrow buttons on hover, as in `CategorySection`).
