# 01 — Product

## Vision
Replace the thick printed menu with a QR code. A guest scans, sees a beautiful menu on their phone (no app, no login), and — depending on the package the café bought — can call a waiter, order, and ask for the bill from the table. The café needs fewer waiters, makes fewer order mistakes, can change prices or mark items sold out in seconds, and gets more reviews.

**Market:** cafés and restaurants in Chattogram, Bangladesh. Owners are not technical; staff use cheap Android phones/tablets; guests use Android phones on 4G. Bangla matters.

**This repo is the demo** that Turjo shows to owners. Since 2026-10-14 it is the multi-restaurant platform **Menuwala** ([10-PLATFORM.md](10-PLATFORM.md)). This file is the product for **every** restaurant; examples use restaurant #1, **Brew Bari — Coffee & Juice** (fictional, GEC Circle, Chattogram). What a restaurant adds or changes is in its own `restaurants/<slug>/01-BRIEF.md`.

## Packages (the core of the sales pitch)
The café's package is a single setting (`restaurants.package` = 1, 2 or 3). All code paths check it through `features(pkg)`.

| Feature | P1 Digital Menu | P2 Table Service | P3 Premium |
|---|:-:|:-:|:-:|
| Digital menu (categories, photos, prices, sold-out) | ✅ | ✅ | ✅ |
| Offers / promo banners | ✅ | ✅ | ✅ |
| EN / বাংলা toggle | ✅ | ✅ | ✅ |
| Prep-time labels ("~4 min" / "Ready now") + **Quick** filter | ✅ | ✅ | ✅ |
| Café info (hours, Wi-Fi, address, map) | ✅ | ✅ | ✅ |
| Admin panel: edit menu, prices, sold-out, offers | ✅ | ✅ | ✅ |
| One shop-wide QR (can also be shared on Facebook) | ✅ | ✅ | ✅ |
| Per-table QR codes + table sessions | – | ✅ | ✅ |
| Cart ("my list") | – | ✅ | ✅ |
| **Call Waiter** (sends table no. + cart to counter) | – | ✅ | ✅ |
| Counter board (realtime, sound) | – | ✅ | ✅ |
| **Place Order** directly from the phone | – | – | ✅ |
| Order status for the guest (Received → Preparing → Ready → Served) | – | – | ✅ |
| **Request Bill** + bill view with VAT | – | – | ✅ |
| Feedback (1–5 ★ + comment) → "Review us on Google" | – | – | ✅ |
| Social links (Facebook, Instagram) on the menu | – | – | ✅ |

`features(pkg)` contract (implement exactly):
```ts
export function features(pkg: 1 | 2 | 3) {
  return {
    tableQr:     pkg >= 2,
    cart:        pkg >= 2,
    callWaiter:  pkg >= 2,
    counter:     pkg >= 2,
    placeOrder:  pkg >= 3,
    orderStatus: pkg >= 3,
    requestBill: pkg >= 3,
    feedback:    pkg >= 3,
    socialLinks: pkg >= 3,
  } as const;
}
```

### Why P2's cart doesn't place an order
In P2 the guest builds a list and presses **Call Waiter**. The counter sees "Table 5 is calling" **with the list**, so the waiter arrives already knowing what the guest wants and only confirms. This (a) reduces waiter walking, (b) keeps a human in the loop, so fake/prank orders are harmless. P3 removes the waiter step.

### Review policy (important — do not "fix" this)
Google and Facebook do not allow third-party apps to post reviews on a user's behalf, and Google forbids "review gating" (only sending happy customers to Google). So:
1. After requesting the bill, the guest can rate 1–5 ★ and write a comment → stored privately for the owner.
2. Then **every** guest (regardless of rating) sees **"Review us on Google"**: it copies their comment to the clipboard and opens the café's Google review link (`restaurants.google_review_url`). Facebook/Instagram buttons open the café's pages.

## Personas
- **Guest** — sits at a table, phone in hand, 4G, may prefer Bangla. Wants to see what's good, what it costs, and get served without waving at staff.
- **Counter / cashier** — sits at the counter with a tablet or laptop running the Counter board all day. Needs to notice new requests instantly (sound) and act in one tap.
- **Waiter** — sees requests on the counter screen (or is told by the cashier). In the demo, waiters don't have their own device view.
- **Owner / admin** — edits the menu, prices, offers, tables, settings. Not technical; uses a phone or laptop.

## User stories & acceptance criteria
IDs are referenced by the tasks in each restaurant's `restaurants/<slug>/07-TASKS.md`.

### Guest — menu (all packages)
- **US-01 Open the menu.** Scanning the shop QR opens `/m/brew-bari`; scanning a table QR opens `/t/<token>`. *AC:* first meaningful content < 2.5 s on a mid-range phone over 4G; no login, no pop-ups, no cookie banner (no tracking).
- **US-02 Browse.** I see the café header, an offers carousel, sticky category chips, and items in a 2-column grid with photo, name, price, tags (Bestseller, New, Iced, Hot, Seasonal) and an approximate prep time. *AC:* tapping a chip scrolls to that category; the active chip follows scrolling; within every category, **available items come first and sold-out items are listed last**.
- **US-09 Quick picks.** Each item shows an approximate prep time: "~4 min", or "Ready now" when it's 1 minute or less (e.g. brownie, cold brew). A **Quick** chip (first chip, lightning icon) shows only available items ready in **5 minutes or less**, fastest first. *AC:* times are always shown as estimates ("~"), never as a promised clock time; items without a prep time show no label and are not in Quick.
- **US-03 Search.** I can type to filter items by name (EN or BN). *AC:* results update as I type; "No items found" empty state.
- **US-04 Item detail.** Tapping an item opens a bottom sheet with large photo, description, options (size, milk, sugar, extra shot) and the price updating with options. *AC:* in P1 there is no "Add" button; in P2/P3 there is.
- **US-05 Sold out.** Sold-out items are shown greyed with a "Sold out" badge and cannot be added. *AC:* when admin toggles sold-out, the public menu reflects it within 60 s (immediately after reload).
- **US-06 Language.** A toggle switches all text, item names, and numbers between English and Bangla (৳২৫০). *AC:* choice is remembered on the device.
- **US-07 Offers.** The carousel shows active offers (within their start/end time). Tapping an offer linked to an item opens that item; linked to a category scrolls there.
- **US-08 Café info.** An info sheet shows address, opening hours, Wi-Fi name & password (tap to copy), phone, map link; in P3 also Facebook/Instagram.

### Guest — table service (P2+)
- **US-10 Table context.** Opening `/t/<token>` shows "Table 5" in the header and starts/joins the table's session. *AC:* invalid token shows a friendly "This QR code isn't valid — please ask a staff member" page with a link to the plain menu.
- **US-11 Cart.** I can add items with options and quantity, edit quantities, remove items, and see the subtotal. *AC:* cart survives a page reload; cart is cleared when the table session changes (new guests).
- **US-12 Call Waiter.** Pressing Call Waiter (with or without a cart) notifies the counter with my table number and list. *AC:* I see "A waiter is on the way" and the status changes to "Waiter coming" when staff acknowledge; pressing again while a call is open does not create a duplicate but nudges the counter again.

### Guest — premium (P3)
- **US-20 Place order.** From the cart I can place the order. *AC:* server recalculates prices; if an item became sold out, I'm told which one and the cart keeps everything else.
- **US-21 Order status.** I see each order's status: Received → Preparing → Ready → Served (or Cancelled), updating without reload (≤ 10 s).
- **US-22 Request bill.** I can view my running bill (all non-cancelled orders this session, subtotal, VAT, service charge, total) and press Request Bill. *AC:* the counter is notified; duplicates are prevented.
- **US-23 Feedback & review.** After requesting the bill I'm invited to rate 1–5 ★ and comment. After submitting (or skipping), I see "Review us on Google" (copies comment + opens link) and social buttons — shown to everyone regardless of rating.

### Counter (P2+)
- **US-30 Login.** Staff log in with email/password; counter staff land on the Counter board, admins on the Admin panel (with a link to the board).
- **US-31 Live board.** I see a grid of all tables coloured by state (idle / scanned-unverified / open / calling / new order / bill requested) and a feed of active requests, newest first, with table number, type, time since, and items. *AC:* new or nudged requests appear within 2 s with a sound and a highlight; works for a full day without reload (auto-reconnects).
- **US-32 Handle requests.** One tap moves a request along: Call → *Waiter sent* → *Done*; Order → *Accept* → *Preparing* → *Ready* → *Served* (or *Cancel*); Bill → *Bill sent* → *Paid & close table*.
- **US-33 Table sessions.** I can approve a scanned (unverified) table, open a table manually, view a table's running bill, and close the table (ends session → next scan starts fresh).
- **US-34 Keep awake.** A "Start shift" button unlocks sound and keeps the screen awake.

### Admin
- **US-40 Menu editor.** Create/edit/delete/reorder categories and items (EN + BN name & description, price, "was" price, **prep time in minutes**, tags, options, photo upload). *AC:* changes appear on the public menu after save.
- **US-41 Sold-out toggle.** One switch per item, usable on a phone, takes effect immediately.
- **US-42 Offers.** Create/edit offers (title, subtitle, badge, image, link to item/category, start/end, active).
- **US-43 Tables & QR.** Add/remove tables, regenerate a table's QR token, print an A4 sheet of table QR cards, download the shop-wide QR (PNG + SVG).
- **US-44 Settings.** Edit café info, Wi-Fi, social & Google review links, VAT %, service charge %, "require approval" toggle, and **switch package (1/2/3)**.
- **US-45 Feedback.** See ratings and comments, newest first, with the average rating.

### Demo
- **US-50 Demo launcher.** `/` shows a simple page for the salesperson: open the guest menu, open sample tables (T1–T3) as a guest, open the counter, open admin, current package with a quick switch (staff-only action). *AC:* usable on a phone in front of an owner.

## Scope — OUT for the demo
Online payment (bKash/Nagad/card), kitchen display separate from counter, waiter app, printers, inventory, analytics dashboards, loyalty, customer accounts, multiple restaurants UI, delivery/takeaway, push notifications, discounts calculated automatically from offers (offers are display-only; combos are normal items).
