# Design source files

These are the source files of the Claude Design canvas "Brew Bari UI" (https://claude.ai/artifact/QdYT3Ufcx86yhnXdGr41JM — private, agents cannot open it). **Read the files here instead.**

Each `*.dc.html` file is one screen. They are **reference markup, not app code** — they run on a design runtime (`support.js`) that is not in this repo, so they won't render if opened directly. Read them for:
- exact colours, sizes, radii, spacing, font weights (inline `style="…"` and the `<style>` block at the top)
- layout structure (which element is inside which, flex/grid, gaps)
- copy text (English and Bangla) and sample data (in the `<script>` at the bottom → `renderVals()`)

Template syntax you'll see: `{{value}}` = data from `renderVals()`, `<sc-for list=… as=…>` = a loop, `<sc-if value=…>` = a condition, `onClick="{{fn}}"` = a handler. Rebuild these as React components with Tailwind + shadcn per 02-ARCHITECTURE.md / 05-UI-DESIGN.md. Do **not** copy the template syntax or `support.js` into the app.

`screenshots/` (optional) — PNG/PDF exports of the canvas, if the human adds them.

| File | Screen | Size |
|---|---|---|
| Main.dc.html | G1 Guest menu home (Table 5, P3) — includes EN/BN toggle, Quick chip, prep pills | 390 wide |
| ItemDetail.dc.html | G2 Item detail sheet | 390×844 |
| Cart.dc.html | G3 Cart (P3) | 390×844 |
| Status.dc.html | G4 Table status / order tracker | 390×844 |
| Bill.dc.html | G5 Bill | 390×844 |
| Review.dc.html | G6 Feedback → Google review | 390×844 |
| Info.dc.html | G7 Café info | 390×844 |
| Counter.dc.html | S2 Counter board (tablet/desktop) | 1280 wide |
| AdminMenu.dc.html | S4 Admin menu (desktop) | 1280 wide |
| AdminTables.dc.html | S5 Admin tables & QR (desktop) | 1280 wide |
| AdminSettings.dc.html | S6 Admin settings (desktop) | 1280 wide |
| AdminMobile.dc.html | M1 Admin menu list (phone) | 390×844 |
| AdminMobileEdit.dc.html | M2 Edit item (phone) | 390 wide |
| AdminMobileOffers.dc.html | M3 Offers (phone) | 390×844 |
| AdminMobileTables.dc.html | M4 Tables & QR (phone) | 390 wide |
| AdminMobileSettings.dc.html | M5 Settings (phone) | 390 wide |
| AdminMobileFeedback.dc.html | M6 Feedback (phone) | 390×844 |
| CounterMobile.dc.html | M7 Counter (phone) | 390 wide |
| canvas.json | canvas layout index (ignore) | |
