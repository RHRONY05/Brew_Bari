# 04 — API contracts

Two kinds of API:
- **Guest RPCs**: Postgres functions called with `supabase.rpc(...)` using the anon key (from server components or the browser). Defined in 03-DATABASE.md §3.
- **Staff operations**: direct table reads/writes through RLS, from client components (counter board) or **server actions** (admin). No custom REST endpoints are needed.

Typed wrappers live in `src/lib/table/rpc.ts` (guest) and `src/app/staff/(protected)/admin/**/actions.ts` (admin). All inputs are validated with zod (`src/lib/schemas.ts`) **before** calling Supabase.

## Shared types (`src/lib/schemas.ts`)
```ts
import { z } from 'zod';

export const OptionChoice = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,30}$/),
  name_en: z.string().min(1).max(40),
  name_bn: z.string().max(40).optional(),
  price_delta: z.number().int().min(0).max(5000),
});
export const OptionGroup = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,30}$/),
  name_en: z.string().min(1).max(40),
  name_bn: z.string().max(40).optional(),
  type: z.enum(['single', 'multi']),
  required: z.boolean(),
  choices: z.array(OptionChoice).min(1).max(10),
});
export const ItemOptions = z.array(OptionGroup).max(6);

export const CartLine = z.object({
  item_id: z.string().uuid(),
  qty: z.number().int().min(1).max(20),
  choices: z.array(z.string().regex(/^[a-z0-9-]+:[a-z0-9-]+$/)).max(20),
  note: z.string().max(200).optional(),
});
export const Cart = z.array(CartLine).max(30);

export type RequestType = 'call_waiter' | 'order' | 'bill';
export type RequestStatus = 'new' | 'acknowledged' | 'preparing' | 'ready' | 'done' | 'cancelled';
export type SessionStatus = 'pending' | 'open' | 'closed';

export type SessionJson = {
  id: string;
  status: SessionStatus;
  requests: { id: string; type: RequestType; status: RequestStatus; subtotal: number; created_at: string; updated_at: string }[];
};
```

Client-side cart line (stored in localStorage) also keeps a display snapshot (`name_en`, `name_bn`, `unit_price`, `image_url`, chosen option labels) and a `key` = `item_id + sorted choices + note` so identical lines merge. **Only `item_id`, `qty`, `choices`, `note` are sent to the server.**

## Guest RPCs
| RPC | Package | Args | Returns | Errors |
|---|---|---|---|---|
| `get_table_context` | any (session only P2+) | `p_token` | `{ restaurant_slug, package, table: {id, number}, session: SessionJson \| null }` | `TABLE_NOT_FOUND` |
| `get_session_status` | P2+ | `p_token`, `p_session_id` | `{ session: SessionJson, live_session_id: uuid \| null }` | `TABLE_NOT_FOUND`, `SESSION_NOT_FOUND` |
| `call_waiter` | P2+ | `p_token`, `p_device_id`, `p_items` (Cart, may be `[]`), `p_note?` | `{ request_id, duplicate, session: SessionJson }` | `TABLE_NOT_FOUND`, `FEATURE_NOT_IN_PACKAGE`, `RATE_LIMITED`, cart errors |
| `place_order` | P3 | `p_token`, `p_device_id`, `p_items` (non-empty), `p_note?` | same as above | + `EMPTY_CART` |
| `request_bill` | P3 | `p_token`, `p_device_id` | same as above | `NO_ACTIVE_SESSION`, `FEATURE_NOT_IN_PACKAGE`, `RATE_LIMITED` |
| `get_bill` | P3 | `p_token` | `{ lines[], subtotal, service_charge_percent, service_charge, vat_percent, vat, total }` | `NO_ACTIVE_SESSION` |
| `submit_feedback` | P3 | `p_token`, `p_rating` (1–5), `p_comment?` | `{ ok: true }` | `BAD_RATING`, `NO_ACTIVE_SESSION` |

**Session change detection (client):** after any RPC, if the returned `session.id` (or `live_session_id`) differs from the stored one, the table has been closed and reopened → clear cart + local request history, show a toast "Welcome! / স্বাগতম!".

**Polling:** `get_session_status` every 5 s while any request is `new|acknowledged|preparing|ready`, else every 30 s; paused when `document.hidden`; stop entirely when `session.status = 'closed'` and `live_session_id` is null (show "Thanks for visiting").

### Error codes → user messages (`src/lib/errors.ts`)
Postgres raises the code as the message; codes with a suffix use `CODE:detail`. Parse with `/^([A-Z_]+)(?::(.+))?$/`.

| Code | EN | BN | Client behaviour |
|---|---|---|---|
| `TABLE_NOT_FOUND` | This QR code isn't valid anymore. Please ask a staff member. | এই QR কোডটি আর কাজ করছে না। অনুগ্রহ করে স্টাফকে জানান। | show invalid-QR page |
| `SESSION_NOT_FOUND` | Your table session has ended. | আপনার টেবিল সেশন শেষ হয়েছে। | reload context |
| `NO_ACTIVE_SESSION` | Your table isn't open. Please call a waiter. | আপনার টেবিলটি চালু নেই। ওয়েটার ডাকুন। | |
| `FEATURE_NOT_IN_PACKAGE` | This option isn't available here. | এই সুবিধাটি এখানে নেই। | hide the action, refetch context |
| `RATE_LIMITED` | Too many requests. Please wait a moment. | অনেক বেশি অনুরোধ। একটু অপেক্ষা করুন। | disable button 30 s |
| `EMPTY_CART` | Your cart is empty. | আপনার কার্ট খালি। | |
| `CART_TOO_LARGE` | That's a big order! Please call a waiter. | অনেক বড় অর্ডার! ওয়েটার ডাকুন। | |
| `ITEM_NOT_FOUND` | An item in your cart is no longer on the menu. | কার্টের একটি আইটেম আর মেনুতে নেই। | remove unknown items, refresh menu |
| `ITEM_SOLD_OUT:<item_id>` | Sorry, {item} just sold out. | দুঃখিত, {item} এইমাত্র শেষ হয়ে গেছে। | mark that line sold out in cart, keep others |
| `BAD_QUANTITY` / `OPTION_REQUIRED:<group>` / `OPTION_INVALID[:<group>]` | Please check your choices for {item}. | {item} এর অপশনগুলো আবার দেখুন। | open the item sheet |
| `BAD_RATING` | Please pick 1 to 5 stars. | ১ থেকে ৫ স্টার দিন। | |
| anything else / network | Something went wrong. Please try again. | কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন। | retry button |

## Staff operations

### Request status transitions (enforced in the app — `src/lib/requests.ts`)
```ts
export const NEXT: Record<RequestType, Partial<Record<RequestStatus, RequestStatus[]>>> = {
  call_waiter: { new: ['acknowledged', 'done', 'cancelled'], acknowledged: ['done'] },
  order:       { new: ['acknowledged', 'cancelled'], acknowledged: ['preparing', 'cancelled'],
                 preparing: ['ready'], ready: ['done'] },
  bill:        { new: ['acknowledged', 'done', 'cancelled'], acknowledged: ['done'] },
};
```
Button labels on the counter:
| Type | Status | Primary button → next | Secondary |
|---|---|---|---|
| call_waiter | new | **Waiter sent** → acknowledged | Done |
| call_waiter | acknowledged | **Done** → done | |
| order | new | **Accept** → acknowledged | Cancel (confirm dialog) |
| order | acknowledged | **Preparing** → preparing | Cancel |
| order | preparing | **Ready** → ready | |
| order | ready | **Served** → done | |
| bill | new | **Bill sent** → acknowledged | |
| bill | acknowledged | **Paid & close table** → done + close session | |
| any, session `pending` | new | **Approve & send** → approve session, then the type's normal first step | Dismiss (→ cancelled) |

Guest-facing status labels: `new` = Received / গ্রহণ করা হয়েছে · `acknowledged` = Confirmed / নিশ্চিত (call: "Waiter coming" / "ওয়েটার আসছেন") · `preparing` = Preparing / তৈরি হচ্ছে · `ready` = Ready / রেডি · `done` = Served / পরিবেশিত (call/bill: hidden) · `cancelled` = Cancelled / বাতিল.

### Counter board data
```ts
// initial load (and after reconnect)
supabase.from('service_requests')
  .select('*, request_items(*), tables(number, label), table_sessions(status)')
  .eq('restaurant_id', rid)
  .not('status', 'in', '(done,cancelled)')
  .order('created_at', { ascending: false });

supabase.from('tables').select('id, number, label, seats, is_active').eq('restaurant_id', rid).order('number');
supabase.from('table_sessions').select('*').eq('restaurant_id', rid).neq('status', 'closed');
```
Table tile state = highest priority of: `bill` request open (blue) > `order` new (red) > `call_waiter` open (orange, pulsing) > session `pending` (yellow, "Scanned") > session `open` (green) > none (grey, idle).

### Admin server actions (all: check `is_admin` via RLS; zod-validate; `revalidateTag('menu:<rid>')` after menu/offer/settings changes)
| Action | Input | Notes |
|---|---|---|
| `upsertCategory` | `{ id?, name_en, name_bn?, icon?, is_active }` | |
| `reorderCategories` | `{ ids: uuid[] }` | sets `sort_order` = index |
| `deleteCategory` | `{ id }` | refuse if it has items (show message) |
| `upsertItem` | `{ id?, category_id, name_en, name_bn?, description_en?, description_bn?, price, compare_at_price?, prep_minutes? (1–120), tags[], options: ItemOptions, image_url?, is_available, is_active }` | `compare_at_price > price` |
| `reorderItems` | `{ category_id, ids: uuid[] }` | |
| `toggleAvailability` | `{ id }` | also allowed for counter role (from the counter board's "Sold out" quick menu) |
| `deleteItem` | `{ id }` | soft-delete preferred: `is_active = false` |
| `upsertOffer` / `deleteOffer` | offer fields | image upload as for items |
| `upsertTable` / `deleteTable` | `{ id?, number, label?, seats?, is_active }` | delete = `is_active=false` if it has history |
| `regenerateTableToken` | `{ id }` | confirm dialog: "Printed QR for this table will stop working" |
| `updateSettings` | restaurant fields incl. `package`, `vat_percent`, `service_charge_percent`, `require_session_approval`, links | |

Image upload is done from the browser directly to Storage (`menu-images/<rid>/items/<uuid>.webp`) then the public URL is passed to the action.

### Menu query (`src/lib/menu/queries.ts`)
```ts
// one round trip; cached with tag `menu:<restaurant_id>`
const { data: restaurant } = await supabase.from('restaurants').select('*').eq('slug', slug).single();
const [{ data: categories }, { data: items }, { data: offers }] = await Promise.all([
  supabase.from('categories').select('*').eq('restaurant_id', restaurant.id).eq('is_active', true).order('sort_order'),
  supabase.from('menu_items').select('*').eq('restaurant_id', restaurant.id).eq('is_active', true).order('sort_order'),
  supabase.from('offers').select('*').eq('restaurant_id', restaurant.id).order('sort_order'),  // RLS already filters to live offers
]);
```
Empty categories (no active items) are hidden on the guest menu.

Display ordering & Quick filter (pure functions in `src/lib/menu/sort.ts`, unit-tested):
```ts
// within a category: available first (by sort_order), then sold-out (by sort_order)
export const sortForGuest = (items: Item[]) =>
  [...items].sort((a, b) => Number(!a.is_available) - Number(!b.is_available) || a.sort_order - b.sort_order);

// Quick: available, prep_minutes ≤ 5, fastest first, then menu order
export const QUICK_MAX_MINUTES = 5;
export const quickPicks = (items: Item[]) =>
  items.filter((i) => i.is_available && i.prep_minutes != null && i.prep_minutes <= QUICK_MAX_MINUTES)
       .sort((a, b) => a.prep_minutes! - b.prep_minutes! || a.sort_order - b.sort_order);

// label: null → none; ≤1 → "Ready now" / "এখনই রেডি"; else "~{n} min" / "~{n} মিনিট"
```

**Important:** `getMenu` must use a **cookie-less anon client** (plain `createClient(url, anonKey)`, not the SSR cookie client). Otherwise (a) a logged-in staff member would see hidden items/expired offers because staff RLS is broader, and (b) the result couldn't be cached across users.
