# 01 — Grill Ghar brief

The base product (packages, every user story US-01…US-50, review policy, scope) is in `../../platform/01-PRODUCT.md` and applies to Grill Ghar unchanged. This file lists only what Grill Ghar **adds or changes**. Every addition is built as a reusable option, so a later restaurant can switch it on too.

## Who it is for
A busy fast-food place: groups of students and families, quick turnover, bigger orders than a café, lots of combos. Guests want to see deals at once, customise a burger in a few taps and know when the food is coming. The owner wants a higher average order (meal upgrades, add-ons, "goes well with").

## Changes to existing stories
| Story | Change for Grill Ghar |
|---|---|
| US-02 Browse | Category nav = **round icons** (All + categories). Each category is a **horizontal slider** with a count badge and "View all" (2-column grid). Item cards show photo with badge + prep-time pill on the photo, a **chili row** for spice, price and a round **+**. A **Meal deals** row sits above the categories. |
| US-03 Offers | Offers render as one big **hero card** (headline in caps, photo in a circle on the right, price pill with struck-through old price). |
| US-07 Quick | The "Quick" section becomes a dark **"In a hurry?" banner**; tapping it shows the quick items (≤ 5 min), same rule as Brew Bari. |
| US-21 Order status | The `preparing` step reads **"On the grill" / "গ্রিলে চলছে"**. The tracking sheet opens with a dark status card and a progress bar. The cart CTA reads **"Send to kitchen" / "কিচেনে পাঠান"**. |
| US-44 Settings | The package picker is hidden (package locked). Already done by the platform refactor. |

## New stories
- **GG-01 Make it a meal.** On a burger or chicken item I choose between **Just the burger** and **Meal (fries + drink)** shown as two big cards; the meal card shows the extra price and the struck-through separate price ("SAVE ৳50"). *AC:* the drink choice appears **only** after I pick Meal and is then required; switching back to "Just the burger" hides it and removes the drink from the price; the server rejects a drink choice without Meal and requires a drink with Meal.
- **GG-02 Spice level.** I pick Mild / Medium / Hot / Naga as chips with 1–4 chilis. Items carry a spice level that shows as chilis on the card (Naga = 3 chilis + "Naga hot").
- **GG-03 Add-ons.** I tick any number of extras (extra cheese, extra patty, jalapeños, fried egg); each adds its price live.
- **GG-04 Meal deals.** A "Meal deals" row shows every available item that has a `compare_at_price`, with a **SAVE X%** badge (X = round((compare − price) / compare × 100)) and the struck-through old price.
- **GG-05 Goes well with.** In the cart I see up to 6 available items tagged `pairs-well` that are not already in my cart, each with a one-tap **+** (adds 1 with default options; items that have required options without a default open the item sheet instead).
- **GG-06 Meal savings.** The cart shows "You save with meals ৳N" when the cart contains meal upgrades (sum of the struck-through minus actual price of those choices × quantity). Display only: the server price is the truth.
- **GG-07 Live order pill.** While an order is active, a pill above the action bar shows "Order 1 · On the grill · ~8 min · Track". This is the existing status pill, restyled.

## Out of scope (same as Brew Bari, plus)
Pickup / order numbers, delivery, online payment, loyalty points, item ratings ("4.8 ★") — we have no real data for ratings, so we don't show them.
