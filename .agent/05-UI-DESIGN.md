# 05 — UI design

> **Mockups:** source files are in **`.agent/design/`** (one `.dc.html` per screen — read `design/README.md`). The live canvas https://claude.ai/artifact/QdYT3Ufcx86yhnXdGr41JM is private to the owner; agents use the local files.
> Artboards:
> - **Guest (phone):** G1 Menu home · G2 Item detail · G3 Cart · G4 Table status · G5 Bill · G6 Feedback & review · G7 Café info
> - **Staff (desktop/tablet):** S2 Counter board · S4 Admin — Menu · S5 Admin — Tables & QR (incl. printed card) · S6 Admin — Settings (incl. package picker)
> - **Staff (phone):** M1 Menu list · M2 Edit item · M3 Offers · M4 Tables & QR · M5 Settings · M6 Feedback · M7 Counter on a phone
> The mockups win on visuals; this doc wins on behaviour and states. Screens without a mockup (login, desktop Offers/Feedback, demo launcher, invalid QR, table drawer, guest menu on tablet/desktop) follow this spec using the same components.
> Item photos in the mockups are placeholders (line icons on `--surface-2`); the real app uses photos (T6.6).

## Direction
Based on `references/ref-3-coffee-app-screens.webp` (primary) and `ref-1-coffee-moodboard.webp` (mood), borrowing *layout ideas* from `ref-2-fastfood-menu-home.webp` (offer hero, round category icons, card with "+" button, sticky bottom bar).

**Feel:** warm, creamy, calm, premium-but-friendly. Lots of cream space, big food photos, soft rounded cards, pill buttons, one caramel accent. Not an "app": no splash screen, no login, no profile, no favourites, no bottom tab bar with fake tabs.

## Design tokens
Define as CSS variables in `src/app/globals.css` and map to Tailwind theme (`@theme`) + shadcn variables. Light theme only for the guest side (cafés are bright; simpler). Staff side uses the same tokens.

### Color
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#FFF7EE` | page background (cream) |
| `--surface` | `#FFFFFF` | cards, sheets |
| `--surface-2` | `#FBEBD7` | tinted cards, chips (inactive), image backdrops |
| `--line` | `#F0DFCB` | borders, dividers |
| `--ink` | `#24170F` | primary text (espresso) |
| `--ink-2` | `#6F5A4B` | secondary text |
| `--ink-3` | `#A08D7E` | placeholder, disabled text |
| `--brand` | `#6B4226` | coffee brown: active chip, headings accents, icons |
| `--brand-ink` | `#FFF7EE` | text on brand |
| `--accent` | `#F2C27D` | caramel: primary buttons, active states, price highlight |
| `--accent-ink` | `#24170F` | text on accent |
| `--accent-strong` | `#E3A651` | accent hover/pressed |
| `--success` | `#2F7D57` | ready / served / open table, "New" badge (white text) |
| `--success-soft` | `#E7F3EC` | success backgrounds (text `#1F5C3F`) |
| `--warning` | `#C77C0E` | calling waiter (border/dot) |
| `--warning-soft` | `#FDEBD2` | calling backgrounds (text `#8A4D06`) |
| `--pending-soft` | `#FFF4D1` | scanned / unverified table (text `#6E5500`) |
| `--danger` | `#B83B30` | new order, sold-out badge, errors (white text) |
| `--danger-soft` | `#FBE3E0` | new-order backgrounds (text `#9A2F25`) |
| `--info-soft` | `#E3EDFA` | bill requested (text `#22508F`) |
| `--overlay` | `rgba(36,23,15,.45)` | sheet backdrop |

Contrast: `--ink` on `--accent` ≈ 10:1, `--ink-2` on `--bg` ≈ 6:1, `--brand-ink` on `--brand` ≈ 9:1 — all AA. Status colours are always paired with an icon + text (never colour alone).

### Typography
- Latin: **Plus Jakarta Sans** (400, 500, 600, 700, 800). Bangla: **Hind Siliguri** (400, 500, 600, 700). Stack: `"Plus Jakarta Sans", "Hind Siliguri", system-ui, sans-serif`; under `:lang(bn)` put Hind Siliguri first. Bangla line-height +0.1.
| Style | Size / line | Weight | Use |
|---|---|---|---|
| display | 28 / 34 | 800 | café name on header, sheet titles on detail |
| h1 | 22 / 28 | 700 | section titles ("Hot Coffee") |
| h2 | 17 / 24 | 700 | card titles in sheets, staff panel titles |
| body | 15 / 22 | 400–500 | default |
| small | 13 / 18 | 500 | descriptions, meta |
| micro | 11 / 14 | 700, uppercase, +4% tracking | badges ("BESTSELLER") |
| price | 17 / 22 | 800 | prices (tabular numbers) |

### Shape, spacing, elevation, motion
- Radius: `--r-sm 10px` (inputs, small badges), `--r-md 16px` (item images), `--r-lg 24px` (cards, offer banner), `--r-xl 28px` (bottom sheets top corners), `--r-pill 999px` (buttons, chips).
- Spacing scale (4-based): 4, 8, 12, 16, 20, 24, 32, 40. Page side gutter **16 px**. Card padding 12 px. Section gap 28 px.
- Shadow: `--shadow-card: 0 6px 20px rgba(107,66,38,.08)`; `--shadow-sheet: 0 -8px 30px rgba(36,23,15,.12)`; `--shadow-bar: 0 -4px 16px rgba(36,23,15,.08)`.
- Motion: 180 ms ease-out for presses/chips, 260 ms cubic-bezier(.2,.8,.2,1) for sheets. "Add to cart" → small bounce on the cart button count. All disabled under `prefers-reduced-motion`.
- Tap targets ≥ 44×44 px. Icon buttons are 44 px circles on `--surface` with `--shadow-card`.

### Images
- Item photos: square 1:1, `object-cover`, `--r-md`, on a `--surface-2` backdrop; product shots on plain/cream backgrounds look best (like ref-3).
- Offer banners: 2:1 on phone, image on the right half with the text on a brown/caramel gradient on the left (like ref-3 "50% OFF" card and ref-2 hero).
- Missing image fallback: `--surface-2` square with the category emoji centred (large).

## Components (shadcn base → our variant)
| Component | Spec |
|---|---|
| `Button` primary | pill, `--accent` bg, `--accent-ink` text, 52 px tall in bars/sheets, 44 px elsewhere, 700 weight |
| `Button` secondary | pill, `--surface` bg, 1 px `--line` border, `--ink` text |
| `Button` brand | pill, `--brand` bg, `--brand-ink` text (Call Waiter) |
| `Chip` (category) | pill, 40 px tall, emoji + label; inactive `--surface` + `--line` border; active `--brand` bg + `--brand-ink` text |
| `Badge` | micro text, pill, 22 px tall: bestseller `--accent`/ink, new `--success`/white, seasonal `--brand`/brand-ink, sold out `--danger`/white, hot/iced as small icon+label on `--surface-2` |
| `ItemCard` | `--surface`, `--r-lg`, `--shadow-card`, padding 10; image 1:1 top; name (2 lines max, 15/600); 1-line description (13, `--ink-2`); **prep pill** (clock icon + "~4 min" on `--bg`, or "Ready now" on `--success-soft` when ≤ 1 min; hidden when sold out or no prep time); bottom row: price (+ struck-through `compare_at_price` in `--ink-3`) and, in P2/P3, a 36 px round `--accent` "+" button (44 px hit area) |
| `PrepPill` | 22 px tall pill, 11.5/700, clock icon 13 px. Also shown in the item detail sheet next to the price |
| `QtyStepper` | pill with − / count / +, 40 px tall |
| `BottomSheet` | shadcn `Drawer` (vaul) from bottom, `--r-xl` top corners, grab handle, max-height 92dvh, scrollable body, sticky footer for the primary action |
| `ActionBar` | fixed bottom, `--surface` with `--shadow-bar`, safe-area padding; contents per package (see screens) |
| `StatusPill` | icon + label, coloured per status |
| `Toast` | sonner, bottom-center above the action bar |

## Responsive rules (read before building any screen)
Breakpoints: **phone < 768 px** · **tablet 768–1023 px** · **desktop ≥ 1024 px**.

| Area | Primary target | Rule |
|---|---|---|
| Guest menu & sheets | **Phone** (mockups G1–G7) | Must be excellent on phones. Tablet/desktop is a **backup layout** (no mockup, does not need to be perfect — just clean and fully usable, for someone opening the URL on a laptop or tablet). |
| Admin | **Phone AND desktop** (mockups M1–M6 and S4–S6) | Owners mostly manage from their phone: phone layout must match M1–M6 exactly in quality. |
| Counter board | **Tablet/desktop** (S2) **and phone** (M7) | Many cafés will run the counter on a phone. |

### Guest menu — tablet/desktop backup layout (no mockup; build from these rules)
- Content column centred with `max-width: 1120px` and 24 px side padding; header, search and offers keep their phone design but the offers carousel shows 2 cards side by side ≥ 1024 px.
- Item grid: 2 columns < 768 px, **3 columns 768–1023 px, 4 columns ≥ 1024 px** (cards keep the same design; image stays 1:1).
- Category chips stay a sticky horizontal row (no sidebar).
- Bottom sheets (item detail, cart, status, bill, feedback, info) become **centred modal dialogs** ≥ 768 px: `max-width: 520px`, `max-height: 85vh`, radius `--r-xl` on all corners, same content and sticky footer.
- Action bar: floating, centred, `max-width: 560px`, 16 px from the bottom.
- Hover states on cards and buttons (subtle shadow lift), visible keyboard focus.
- Acceptance: at 768×1024 and 1440×900 nothing overflows horizontally, all flows (add → cart → call waiter / order → bill → review) work with mouse and keyboard.

### Admin — phone layout (mockups M1–M6)
- **Header:** logo, café name, "Admin", and a **Counter** button (→ counter board). Below it, **tabs across the top**: Menu · Offers · Tables · Settings · Feedback (horizontally scrollable; active tab is dark pill). This replaces the desktop sidebar < 1024 px.
- **Lists** (menu items, offers, tables): full-width white cards with rows ≥ 64 px tall, the availability/active **switch reachable with a thumb on the right**, and a chevron/edit button. A floating **primary pill button** bottom-right for "Add item" / "New offer".
- **Edit screens** (M2): a full-screen page (not a sheet) with back arrow + Save in the header, content in stacked cards (Availability, Basics, Prep time stepper, Description & tags, Options), and a **sticky Save bar** at the bottom. Inputs 48 px tall, numeric keyboards (`inputmode="numeric"`) for prices and percentages.
- **Settings** (M5): package picker as **stacked radio cards**, then one card per section, sticky Save bar, Log out at the end.
- **Tables** (M4): "Print cards" + "Add table" buttons on top, compact shop QR card with Share/Download (Web Share API when available), table rows with "Show QR" and a ⋮ menu (New QR, rename, seats, turn off).
- **Feedback** (M6): average + distribution bars, then the list.
- Option groups editor on phones opens as a full-screen page per group (name EN/BN, single/multi, required, choices with price delta, add/remove/reorder).

### Counter — phone layout (mockup M7)
- Header: "Counter", Live indicator, sound toggle, admin (gear) link; below it a **horizontal strip of table tiles** (58 px squares, same state colours) — tap opens the table drawer as a full-screen sheet.
- Filter tabs with counts, then stacked request cards with **full-width 52 px action buttons** (primary + one secondary).
- Same Start-shift overlay, sound and wake-lock behaviour as S2.

## Guest screens (375×812 is the design size; must work 320–430 wide)

### G1 — Menu home (`/m/[slug]` and `/t/[token]`)
Top → bottom:
1. **Header** (not sticky): logo (40 px circle) + café name (display) + tagline (small, `--ink-2`). Right: `LanguageToggle` (pill segmented "EN | বাং") and an **info** icon button (opens G7). When opened from a table: a `Table 5` chip under the name (brand colours, table icon).
2. **Search** field: pill, `--surface`, search icon, placeholder "Search coffee, juice…" / "কফি, জুস খুঁজুন…". Typing hides the offers carousel and shows a flat filtered list.
3. **Offers carousel** (only if offers exist): full-width minus gutters, 2:1 cards, auto-advance every 5 s (pause on touch), dots below. Card: badge (top-left), title (22/800, white or ink depending on bg), subtitle, and a small pill button "See item" / "Explore" when linked.
4. **Category chips**: horizontal scroll, **sticky** under the top of the viewport (with `--bg` background + bottom fade). Scroll-spy keeps the active chip in sync and scrolled into view. The **first chip is "Quick"** (lightning icon, "ঝটপট" in Bangla): tapping it replaces the sections with one section "Quick · ready in 5 min or less" (fastest first); tapping any category chip returns to the full menu at that category.
5. **Sections** per category: h1 title with item count, then a **2-column grid** of `ItemCard`s (gap 12). **Available items first, sold-out items last.** Sold-out cards: image greyscale 60 %, "Sold out" badge over image, no prep pill, no "+" button, still openable.
6. **Footer**: café address, hours, "Powered by <our product name>" (tiny, `--ink-3`).
7. **ActionBar** (P2/P3 only, from a table): left `Button brand` **"Call waiter"** (bell icon) — right `Button primary` **cart** showing `count · ৳total` (disabled look when empty: "Your list is empty" / "আপনার তালিকা খালি"). In P3, if the session has active orders, a small status pill above the bar: "Order #2 · Preparing" → tap opens G4.
   - P1 or `/m/[slug]`: no ActionBar.

### G2 — Item detail sheet
Large 1:1 image (rounded, inside sheet), name (display), badges, description, price (big). Option groups: title + "Required"/"Optional" hint; `single` = radio pills, `multi` = checkbox pills, each showing `+৳60` when it has a delta. Note field ("Any request? e.g. less ice"). Sticky footer: `QtyStepper` + **"Add · ৳310"** primary button (live total). P1: footer replaced by price only (no add). Sold-out: footer shows disabled "Sold out".

### G3 — Cart sheet ("Your list" in P2, "Your order" in P3)
Lines: thumbnail, name, chosen options (small, `--ink-2`), note, line price, `QtyStepper`, remove (swipe or trash icon). Subtotal row. Footer:
- **P2:** helper text "A waiter will come to confirm your order." + primary **"Call waiter with this list"**.
- **P3:** primary **"Place order · ৳total"** + secondary "Call waiter instead". Optional note field for the whole order.
- Empty state: illustration (coffee cup emoji large) + "Your list is empty" + "Browse menu" button.

### G4 — Table status sheet (P2/P3) — opened from the status pill or after any request
Header "Table 5". List of this session's requests (newest first):
- Call waiter: "Waiter called · 2 min ago" → "Waiter coming" (warning → success colour).
- Order #n: items summary + **stepper** Received → Preparing → Ready → Served (current step highlighted, cancelled shown in danger).
- Bill: "Bill requested" → "Bill on the way".
P3 footer: **"View bill"** (opens G5) secondary + **"Call waiter"** brand.

### G5 — Bill sheet (P3)
Lines (qty × name, options, price; orders still "Received" marked "awaiting confirmation"), subtotal, service charge (if > 0), VAT 5 %, **Total** (price style, large). Footer primary **"Request bill"** → success state: check icon, "Your bill is on the way. Pay at the counter or to your waiter." Then automatically slides to G6.

### G6 — Feedback & review (P3)
"How was your visit?" — 5 large stars (44 px each, tap to rate), optional comment textarea, **"Send"** primary, "Skip" text button. After send/skip — **for every rating**:
- "Thank you! 💛"
- Primary **"Review us on Google"** (Google "G" icon): copies the comment to clipboard (toast "Your comment is copied — paste it on Google") and opens `google_review_url` in a new tab.
- Secondary pills: Facebook, Instagram (if set).

### G7 — Café info sheet
Address + "Open in Maps", opening hours, phone (tap to call), **Wi-Fi** card (network name, password with a **Copy** button), P3: social buttons.

### G8 — States
- **Invalid QR** (`/t/<bad>`): centred card, coffee cup, message from errors table, button "View the menu" → `/m/<default slug>`.
- **Loading**: skeletons for header, carousel, chips, 4 cards (no spinners on first paint).
- **Offline / error**: toast with retry; buttons show inline spinner while pending and are disabled to prevent double taps.
- **Session reset**: toast "Welcome! / স্বাগতম!" and empty cart.
- **Closed session, no new session**: thank-you card "Thanks for visiting Brew Bari!" with the review button (P3).

## Staff screens

### S1 — Login (`/staff/login`)
Centred card on `--bg`: logo, "Staff login", email, password, primary "Log in", error message inline. No sign-up, no "forgot password" (owner resets in Supabase for the demo).

### S2 — Counter board (`/staff/counter`) — design size 1280×800 (tablet landscape); must also work on a phone (stacked)
- **Start shift overlay** (first load): dim background, card "Start shift" big primary button → unlock sound + wake lock. Small text: "Keep this screen open. You'll hear a sound for every request."
- **Top bar**: café name, live connection dot (green "Live" / amber "Reconnecting…"), sound toggle, "Sold out" quick menu button, user menu (Admin link if admin, Log out).
- **Left (≈ 40 %) — Table grid**: tiles 120×96, table number large, state label + icon, time since state began. Colours per 04-API.md priority (grey idle / yellow Scanned / green Open / orange pulsing Calling / red New order / blue Bill). Tap → S3.
- **Right (≈ 60 %) — Request feed**: filter tabs All · Calls · Orders · Bills (with counts). Cards, newest first: big **table number** badge, type icon + label, "Unverified" badge if session pending, time-ago (live updating), nudge indicator ("Called again ×2"), item list with options and notes, subtotal, then the action buttons from 04-API.md (primary large, secondary small). New/nudged cards flash (accent outline pulse 3×) and play the chime. Collapsible "Done today" list at the bottom.
- Empty state: "All calm ☕ — new requests will appear here."

### S3 — Table drawer (right side sheet)
Table number, seats, session status + time, actions: **Approve** (if pending), **Open table** (if none), **Close table** (confirm). Session's requests list, running bill (same numbers as G5), feedback if any.

### S4 — Admin (`/staff/admin/*`) — responsive: sidebar on ≥ 1024 px, top tabs below (phone design: M1–M6, see "Responsive rules")
Nav: Menu · Offers · Tables & QR · Settings · Feedback · (link) Counter board.
- **Menu**: left column categories (reorder with up/down buttons, edit, add, active toggle); right: items of selected category as rows — thumbnail, name EN/BN, price, tags, **availability switch** (big, instant, optimistic), edit button. Item rows show price and "~N min" under the name. "Add item" opens **ItemForm** in a sheet: EN/BN fields side by side, price & "was" price, **prep time (minutes)** with helper text "Guests see ~N min. 1 = Ready now. 5 or less shows under Quick.", tags multi-select, **OptionsBuilder** (add group → name EN/BN, single/multi, required; add choices with price delta), image upload with preview & crop to square, active toggle. Save / Cancel; validation messages inline.
- **Offers**: card list with preview exactly as on the guest carousel; form: titles/subtitles/badge EN/BN, image (2:1), link to item or category (select), start/end datetime, active.
- **Tables & QR**: table list (number, label, seats, active, "Regenerate QR"), "Add table", **"Print QR cards"** → `/staff/admin/tables/print` (A4, 2×3 cards per page: logo, "Table 5", big QR, "Scan to see the menu & call a waiter" EN + BN, print CSS, no app chrome). Also the **shop QR** card (P1): preview + "Download PNG" / "Download SVG".
- **Settings**: café info (EN/BN), logo & cover, hours, Wi-Fi, phone, address, maps link, Facebook, Instagram, Google review link (with "How to find this" help text), VAT %, service charge %, require-approval toggle, and **Package** picker: 3 large selectable cards (P1/P2/P3 with their feature bullets from 01-PRODUCT.md). Changing package shows a confirm and takes effect immediately.
- **Feedback**: average rating (big stars), count, list (stars, comment, table, time).

## Demo launcher (`/`)
Simple mobile-friendly page in the same style: café logo + "Brew Bari demo". Cards:
1. **Guest menu** → `/m/brew-bari`
2. **Sit at a table** → buttons Table 1 · Table 2 · Table 3 (links to `/t/<token>`; tokens fetched server-side only when the viewer is logged-in staff — otherwise show "Log in as staff to get table links")
3. **Counter board** → `/staff/counter`
4. **Admin** → `/staff/admin`
5. **Current package**: P1/P2/P3 segmented control (admin only; otherwise read-only text)
Plus a shop QR code on desktop so the owner can scan it with their own phone.
