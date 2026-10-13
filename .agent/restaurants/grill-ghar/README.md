# Grill Ghar (গ্রিল ঘর) — start here

Restaurant #2 on Menuwala. A fictional fast-food place in Chattogram: burgers, fried chicken, shawarma, fries, shakes and set meals. Built on the **same codebase and database** as Brew Bari: Grill Ghar = **data + a theme + a few new reusable options**, never a copy of the code.

## GOAL (for the build agent)
> Build Grill Ghar end to end, following this folder's tasks G0 → G9 in order, until `/grill-ghar` and `/grill-ghar/t/<token>` look and behave like the designs in `design/`, Grill Ghar's staff can run the counter and admin with the Grill Ghar theme, every Grill Ghar test passes, **and Brew Bari is unchanged and its full test suite is still green.** Then rehearse `08-DEMO-SCRIPT.md` and stop.

## Decisions (agreed with the humans — do not re-open)
| Topic | Decision |
|---|---|
| Name / slug | **Grill Ghar** / **গ্রিল ঘর**, slug `grill-ghar`, `theme_key = 'grill-ghar'` |
| Package | **P3 only**: `package = 3`, `package_locked = true` (no package picker, `?pkg=` preview ignored) |
| Flow | **Table service**, same as Brew Bari: QR on the table → order from the phone → staff bring the food → bill requested in the app, paid at the counter. No pickup / order-number mode. |
| Look | Flame red + mustard on warm cream. Headings **Cinzel** (same as Brew Bari), body **Poppins**, Bangla **Li Alinur Nobin**. Full tokens in [05-UI-DESIGN.md](05-UI-DESIGN.md). |
| New features | "Make it a meal" upgrade, add-ons, spice level, meal-deal cards with "SAVE X%", round category icons, hero offer card, "In a hurry?" banner, "Goes well with" upsell in the cart, "On the grill" order tracking. See [01-BRIEF.md](01-BRIEF.md). |
| Category lists | Every category is a **horizontal slider** with a count badge and a "View all" toggle (2-column grid), like Brew Bari's `CategorySection`. No long vertical list. |
| Redrawn screens | Only 4 guest screens (menu home, item detail, cart, order tracking). Everything else (bill, review, info, counter, admin, login) **reuses the Brew Bari layout** with the Grill Ghar theme. |
| How differences are built | As theme tokens and new `Theme['layout']` options, implemented once in the shared component. Brew Bari keeps its current look by setting the old value of each option. |
| Images | Real royalty-free photos (Unsplash / Pexels), checked by eye to match each dish, converted to WebP. Rules in [03-DATA.md §5](03-DATA.md). |

## Read in this order
1. [01-BRIEF.md](01-BRIEF.md) — what Grill Ghar adds to the product (features + user stories)
2. [05-UI-DESIGN.md](05-UI-DESIGN.md) — theme tokens, fonts, new layout options, screen-by-screen spec
3. [design/](design/README.md) — the 4 redrawn screens (`.dc.html` source). Screens not here → `../brew-bari/design/`
4. [03-DATA.md](03-DATA.md) — options model v2 (shared code change), the full seed (restaurant, menu, offers, tables, staff), images
5. [07-TASKS.md](07-TASKS.md) — **the task list. Pick work only from here.**
6. [08-DEMO-SCRIPT.md](08-DEMO-SCRIPT.md) — the pitch the finished product must support
7. [09-HANDOFF.md](09-HANDOFF.md) — for the human: the prompt that starts the build
8. `references/` — the inspiration image (layout inspiration only; never copy a real brand's name, logo or photos)

And from the shared docs: `../../platform/00-AGENT-RULES.md` (rules), `../../platform/10-PLATFORM.md` (themes, URLs, how to add a restaurant).

## URLs (after the build)
| What | URL |
|---|---|
| Guest menu (shop QR) | https://menuwala.vercel.app/grill-ghar |
| Table QR (per table) | https://menuwala.vercel.app/grill-ghar/t/<token> (tokens are random; print them from Admin → Tables & QR) |
| Staff login (shared by all restaurants) | https://menuwala.vercel.app/staff/login |
| Counter / Admin (after a Grill Ghar staff login) | https://menuwala.vercel.app/staff/counter · https://menuwala.vercel.app/staff/admin |
| Local dev | http://localhost:3000/grill-ghar |

Staff pages pick the restaurant from **who logs in**, not from the URL: a Grill Ghar login shows Grill Ghar's counter and admin, in the Grill Ghar theme. The login page itself is shared, so it uses the Menuwala platform look.
