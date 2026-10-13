# Grill Ghar design source files

Source of the Claude Design canvas "Grill Ghar UI" (https://claude.ai/artifact/WM7cSVw4jUrtYPxQYdsG9n, private: agents can't open it). **Read these files instead.** Same format as `../../brew-bari/design/README.md`: reference markup, not app code. Read them for colours, sizes, radii, spacing, copy and sample data (the `<script>` at the bottom → `renderVals()`).

Only the 4 guest screens that **look or behave differently** from Brew Bari are drawn. Every other screen (bill, review, info, counter, admin) reuses the Brew Bari layout from `../../brew-bari/design/` with the Grill Ghar theme tokens.

Food photos are drawn as labelled placeholders ("Photo: …"). The app uses real royalty-free photos (see ../03-DATA.md §5).

| File | Screen | Size | What is new vs Brew Bari |
|---|---|---|---|
| Main.dc.html | GG1 Menu home (Table 7, P3) | 390 wide | Hero offer card, round category icons, "Meal deals" row with SAVE %, "In a hurry?" banner, every category a horizontal slider with "View all" (2-column grid), bold item cards (badge + prep pill on photo, chili row, round + button), live order pill above action bar |
| ItemDetail.dc.html | GG2 Item detail | 390×1240 | "Make it a meal?" as 2 cards with struck-through price, drink group shown only when Meal is picked, spice level as chili chips, add-ons as checkbox tiles, add button label "Add meal" |
| Cart.dc.html | GG3 Cart (P3) | 390×980 | MEAL badge on lines, "Goes well with" upsell row, "You save with meals" line, CTA "Send to kitchen" |
| Status.dc.html | GG4 Order tracking | 390×900 | Dark hero card with big status + progress bar, "On the grill" instead of "Preparing", "Order more" CTA. Tweak `stage` previews every step |

Sample names in the designs (e.g. "Coca-Cola") are placeholders; the real menu, prices and names are in `../03-DATA.md` and win over the designs.
