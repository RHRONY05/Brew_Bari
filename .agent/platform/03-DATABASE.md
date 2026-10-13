# 03 — Database (Supabase Postgres)

Apply as migrations via the Supabase MCP (see 00-AGENT-RULES.md). Suggested split:
1. `..._init_schema.sql` — extensions, enums, tables, indexes, triggers
2. `..._rls.sql` — helper functions + RLS policies + storage policies
3. `..._rpc.sql` — customer RPC functions + grants
4. `..._realtime.sql` — publication
Then run `supabase/seed.sql` (via `execute_sql`) once.

The SQL below is the **intended design**. Agents may fix syntax/bugs found while applying it, but must not change behaviour or names without updating this file and 04-API.md.

**Later migrations** change parts of this design. Read them in `supabase/migrations/` (newest wins): `20261014000005_multi_restaurant.sql` (see [10-PLATFORM.md](10-PLATFORM.md)); `20261015000006_option_rules.sql` (Grill Ghar, see §8 below once added).

## Entity overview
```
restaurants 1─* categories 1─* menu_items
restaurants 1─* offers            (optionally → menu_item / category)
restaurants 1─* tables 1─* table_sessions 1─* service_requests 1─* request_items
restaurants 1─* staff  (→ auth.users)
table_sessions 1─0..1 feedback
```

## 1. Schema
```sql
create extension if not exists pgcrypto;

create type public.staff_role     as enum ('admin', 'counter');
create type public.session_status as enum ('pending', 'open', 'closed');
create type public.request_type   as enum ('call_waiter', 'order', 'bill');
create type public.request_status as enum ('new', 'acknowledged', 'preparing', 'ready', 'done', 'cancelled');

-- generic updated_at trigger
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end $$;

create table public.restaurants (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name_en                 text not null,
  name_bn                 text,
  tagline_en              text,
  tagline_bn              text,
  logo_url                text,
  cover_url               text,
  package                 smallint not null default 3 check (package between 1 and 3),
  vat_percent             numeric(5,2) not null default 0 check (vat_percent between 0 and 30),
  service_charge_percent  numeric(5,2) not null default 0 check (service_charge_percent between 0 and 30),
  require_session_approval boolean not null default true,
  address                 text,
  phone                   text,
  opening_hours_en        text,
  opening_hours_bn        text,
  wifi_name               text,
  wifi_password           text,
  facebook_url            text,
  instagram_url           text,
  google_maps_url         text,
  google_review_url       text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create table public.staff (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  restaurant_id  uuid not null references public.restaurants(id) on delete cascade,
  role           public.staff_role not null default 'counter',
  display_name   text,
  created_at     timestamptz not null default now()
);

create table public.categories (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants(id) on delete cascade,
  name_en        text not null,
  name_bn        text,
  icon           text,                 -- emoji or short icon name, optional
  sort_order     int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on public.categories (restaurant_id, sort_order);

-- options jsonb format (validated by zod in the app AND by price_cart in SQL):
-- [{"id":"size","name_en":"Size","name_bn":"সাইজ","type":"single"|"multi","required":true,
--   "choices":[{"id":"regular","name_en":"Regular","name_bn":"রেগুলার","price_delta":0}, ...]}]
-- A cart line selects choices as "groupId:choiceId" strings, e.g. ["size:large","extras:shot"].
create table public.menu_items (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid not null references public.restaurants(id) on delete cascade,
  category_id       uuid not null references public.categories(id) on delete cascade,
  name_en           text not null,
  name_bn           text,
  description_en    text,
  description_bn    text,
  price             int not null check (price >= 0),          -- whole taka
  compare_at_price  int check (compare_at_price is null or compare_at_price > price),
  image_url         text,
  prep_minutes      smallint check (prep_minutes between 1 and 120),  -- approx. prep time; null = no label. ≤1 → "Ready now", ≤5 → in "Quick"
  tags              text[] not null default '{}',            -- bestseller | new | hot | iced | seasonal | veg | spicy
  options           jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  is_available      boolean not null default true,           -- false = "Sold out" (still visible)
  is_active         boolean not null default true,           -- false = hidden from menu
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on public.menu_items (restaurant_id, category_id, sort_order);

create table public.offers (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants(id) on delete cascade,
  title_en       text not null,
  title_bn       text,
  subtitle_en    text,
  subtitle_bn    text,
  badge_en       text,                -- e.g. "Today only"
  badge_bn       text,
  image_url      text,
  menu_item_id   uuid references public.menu_items(id) on delete set null,
  category_id    uuid references public.categories(id) on delete set null,
  starts_at      timestamptz,
  ends_at        timestamptz,
  is_active      boolean not null default true,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.tables (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants(id) on delete cascade,
  number         int not null check (number > 0),
  label          text,                 -- optional display name, e.g. "Window 2"
  seats          int,
  qr_token       text not null unique default encode(gen_random_bytes(12), 'hex'),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (restaurant_id, number)
);

create table public.table_sessions (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants(id) on delete cascade,
  table_id       uuid not null references public.tables(id) on delete cascade,
  status         public.session_status not null default 'pending',
  opened_at      timestamptz not null default now(),
  approved_at    timestamptz,
  approved_by    uuid references auth.users(id),
  closed_at      timestamptz,
  closed_by      uuid references auth.users(id),
  updated_at     timestamptz not null default now()
);
-- at most one live session per table
create unique index table_sessions_one_live_per_table on public.table_sessions (table_id) where status <> 'closed';
create index on public.table_sessions (restaurant_id, status);

create table public.service_requests (
  id               uuid primary key default gen_random_uuid(),
  restaurant_id    uuid not null references public.restaurants(id) on delete cascade,
  table_id         uuid not null references public.tables(id) on delete cascade,
  session_id       uuid not null references public.table_sessions(id) on delete cascade,
  type             public.request_type not null,
  status           public.request_status not null default 'new',
  note             text check (char_length(note) <= 300),
  device_id        text check (char_length(device_id) <= 64),
  subtotal         int not null default 0,
  nudge_count      int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  acknowledged_at  timestamptz,
  done_at          timestamptz,
  handled_by       uuid references auth.users(id)
);
create index on public.service_requests (restaurant_id, status, created_at desc);
create index on public.service_requests (session_id);

create table public.request_items (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid not null references public.service_requests(id) on delete cascade,
  menu_item_id  uuid references public.menu_items(id) on delete set null,
  name_en       text not null,          -- snapshot at time of request
  name_bn       text,
  quantity      int not null check (quantity between 1 and 20),
  unit_price    int not null check (unit_price >= 0),
  options       jsonb not null default '[]'::jsonb,   -- snapshot of chosen options
  line_total    int not null check (line_total >= 0),
  note          text check (char_length(note) <= 200)
);
create index on public.request_items (request_id);

create table public.feedback (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants(id) on delete cascade,
  table_id       uuid references public.tables(id) on delete set null,
  session_id     uuid unique references public.table_sessions(id) on delete set null,
  rating         smallint not null check (rating between 1 and 5),
  comment        text check (char_length(comment) <= 1000),
  created_at     timestamptz not null default now()
);
create index on public.feedback (restaurant_id, created_at desc);

-- updated_at triggers
create trigger trg_restaurants_updated   before update on public.restaurants      for each row execute function public.set_updated_at();
create trigger trg_categories_updated    before update on public.categories       for each row execute function public.set_updated_at();
create trigger trg_menu_items_updated    before update on public.menu_items       for each row execute function public.set_updated_at();
create trigger trg_offers_updated        before update on public.offers           for each row execute function public.set_updated_at();
create trigger trg_tables_updated        before update on public.tables           for each row execute function public.set_updated_at();
create trigger trg_sessions_updated      before update on public.table_sessions   for each row execute function public.set_updated_at();
create trigger trg_requests_updated      before update on public.service_requests for each row execute function public.set_updated_at();

-- status timestamps for requests
create or replace function public.stamp_request_status() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if new.status in ('acknowledged','preparing','ready') and old.acknowledged_at is null then
      new.acknowledged_at = now();
    end if;
    if new.status in ('done','cancelled') then
      new.done_at = now();
    end if;
    new.handled_by = coalesce(auth.uid(), old.handled_by);
  end if;
  return new;
end $$;
create trigger trg_requests_status before update on public.service_requests
  for each row execute function public.stamp_request_status();

-- session timestamps
create or replace function public.stamp_session_status() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'open' and old.status = 'pending' then
      new.approved_at = now(); new.approved_by = auth.uid();
    end if;
    if new.status = 'closed' then
      new.closed_at = now(); new.closed_by = auth.uid();
    end if;
  end if;
  return new;
end $$;
create trigger trg_sessions_status before update on public.table_sessions
  for each row execute function public.stamp_session_status();
```

## 2. RLS
```sql
-- helpers (SECURITY DEFINER so policies don't recurse into staff RLS)
create or replace function public.is_staff(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and restaurant_id = rid)
$$;
create or replace function public.is_admin(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and restaurant_id = rid and role = 'admin')
$$;
create or replace function public.my_restaurant_id() returns uuid
language sql stable security definer set search_path = public as $$
  select restaurant_id from public.staff where user_id = auth.uid()
$$;

alter table public.restaurants      enable row level security;
alter table public.staff            enable row level security;
alter table public.categories       enable row level security;
alter table public.menu_items       enable row level security;
alter table public.offers           enable row level security;
alter table public.tables           enable row level security;
alter table public.table_sessions   enable row level security;
alter table public.service_requests enable row level security;
alter table public.request_items    enable row level security;
alter table public.feedback         enable row level security;

-- restaurants: public read, admin update
create policy restaurants_public_read on public.restaurants for select to anon, authenticated using (true);
create policy restaurants_admin_update on public.restaurants for update to authenticated
  using (public.is_admin(id)) with check (public.is_admin(id));

-- staff: see own row; admins see their restaurant's staff
create policy staff_self_read on public.staff for select to authenticated
  using (user_id = auth.uid() or public.is_admin(restaurant_id));

-- menu (categories, menu_items, offers): public reads active rows; staff read all; admin writes
create policy categories_public_read on public.categories for select to anon, authenticated
  using (is_active or public.is_staff(restaurant_id));
create policy categories_admin_write on public.categories for all to authenticated
  using (public.is_admin(restaurant_id)) with check (public.is_admin(restaurant_id));

create policy items_public_read on public.menu_items for select to anon, authenticated
  using (is_active or public.is_staff(restaurant_id));
create policy items_admin_write on public.menu_items for all to authenticated
  using (public.is_admin(restaurant_id)) with check (public.is_admin(restaurant_id));
-- counter staff may toggle sold-out too (column restricted in the app; acceptable for demo)
create policy items_staff_availability on public.menu_items for update to authenticated
  using (public.is_staff(restaurant_id)) with check (public.is_staff(restaurant_id));

create policy offers_public_read on public.offers for select to anon, authenticated
  using ((is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()))
         or public.is_staff(restaurant_id));
create policy offers_admin_write on public.offers for all to authenticated
  using (public.is_admin(restaurant_id)) with check (public.is_admin(restaurant_id));

-- tables: NOT public (qr_token is secret)
create policy tables_staff_read on public.tables for select to authenticated using (public.is_staff(restaurant_id));
create policy tables_admin_write on public.tables for all to authenticated
  using (public.is_admin(restaurant_id)) with check (public.is_admin(restaurant_id));

-- sessions, requests, items, feedback: staff only (guests go through RPCs)
create policy sessions_staff_read   on public.table_sessions for select to authenticated using (public.is_staff(restaurant_id));
create policy sessions_staff_insert on public.table_sessions for insert to authenticated with check (public.is_staff(restaurant_id));
create policy sessions_staff_update on public.table_sessions for update to authenticated
  using (public.is_staff(restaurant_id)) with check (public.is_staff(restaurant_id));

create policy requests_staff_read   on public.service_requests for select to authenticated using (public.is_staff(restaurant_id));
create policy requests_staff_update on public.service_requests for update to authenticated
  using (public.is_staff(restaurant_id)) with check (public.is_staff(restaurant_id));

create policy request_items_staff_read on public.request_items for select to authenticated
  using (exists (select 1 from public.service_requests r where r.id = request_id and public.is_staff(r.restaurant_id)));

create policy feedback_staff_read on public.feedback for select to authenticated using (public.is_staff(restaurant_id));
```

### Storage
```sql
insert into storage.buckets (id, name, public) values ('menu-images', 'menu-images', true)
  on conflict (id) do nothing;

create policy menu_images_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'menu-images');
create policy menu_images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-images'
              and (storage.foldername(name))[1] = public.my_restaurant_id()::text
              and public.is_admin(public.my_restaurant_id()));
create policy menu_images_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'menu-images'
         and (storage.foldername(name))[1] = public.my_restaurant_id()::text
         and public.is_admin(public.my_restaurant_id()));
create policy menu_images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'menu-images'
         and (storage.foldername(name))[1] = public.my_restaurant_id()::text
         and public.is_admin(public.my_restaurant_id()));
```

## 3. Customer RPC functions
All are `SECURITY DEFINER`, `set search_path = public`, and raise **error codes** as the exception message (`raise exception 'TABLE_NOT_FOUND'`). Error codes are listed in 04-API.md. Internal helpers start with `_` and are **not** executable by anon/authenticated.

```sql
-- ---------- internal helpers ----------

-- Look up a table by QR token. Does not create anything.
create or replace function public._table_ctx(p_token text)
returns table (table_id uuid, restaurant_id uuid, table_number int, package smallint,
               session_id uuid, session_status public.session_status)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  return query
    select t.id, t.restaurant_id, t.number, r.package, s.id, s.status
    from public.tables t
    join public.restaurants r on r.id = t.restaurant_id
    left join public.table_sessions s on s.table_id = t.id and s.status <> 'closed'
    where t.qr_token = p_token and t.is_active;
  if not found then
    raise exception 'TABLE_NOT_FOUND';
  end if;
end $$;

-- Return the live session for a table, creating one if needed.
create or replace function public._ensure_session(p_table_id uuid)
returns public.table_sessions
language plpgsql security definer set search_path = public as $$
declare
  v_s public.table_sessions;
  v_rest public.restaurants;
begin
  select * into v_s from public.table_sessions where table_id = p_table_id and status <> 'closed';
  if found then return v_s; end if;

  select r.* into v_rest from public.restaurants r join public.tables t on t.restaurant_id = r.id where t.id = p_table_id;

  insert into public.table_sessions (restaurant_id, table_id, status)
  values (v_rest.id, p_table_id, case when v_rest.require_session_approval then 'pending' else 'open' end::public.session_status)
  on conflict do nothing
  returning * into v_s;

  if v_s.id is null then  -- lost a race with a concurrent scan
    select * into v_s from public.table_sessions where table_id = p_table_id and status <> 'closed';
  end if;
  return v_s;
end $$;

create or replace function public._check_rate(p_session_id uuid)
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if (select count(*) from public.service_requests
      where session_id = p_session_id and created_at > now() - interval '10 minutes') >= 15 then
    raise exception 'RATE_LIMITED';
  end if;
end $$;

-- Validate a cart and compute prices server-side.
-- p_items: [{"item_id": uuid, "qty": int, "choices": ["group:choice", ...], "note": text}]
create or replace function public.price_cart(p_restaurant_id uuid, p_items jsonb)
returns table (menu_item_id uuid, name_en text, name_bn text, quantity int,
               unit_price int, options jsonb, line_total int, note text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_variable
declare
  v_line     jsonb;
  v_item     public.menu_items;
  v_qty      int;
  v_selected text[];
  v_group    jsonb;
  v_choice   jsonb;
  v_count    int;
  v_delta    int;
  v_opts     jsonb;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;
  if jsonb_array_length(p_items) > 30 then
    raise exception 'CART_TOO_LARGE';
  end if;

  for v_line in select value from jsonb_array_elements(p_items) loop
    select m.* into v_item from public.menu_items m
      where m.id = (v_line->>'item_id')::uuid and m.restaurant_id = p_restaurant_id and m.is_active;
    if not found then raise exception 'ITEM_NOT_FOUND'; end if;
    if not v_item.is_available then raise exception 'ITEM_SOLD_OUT:%', v_item.id; end if;

    v_qty := coalesce((v_line->>'qty')::int, 1);
    if v_qty < 1 or v_qty > 20 then raise exception 'BAD_QUANTITY'; end if;

    v_selected := coalesce(array(select jsonb_array_elements_text(coalesce(v_line->'choices', '[]'::jsonb))), '{}');
    v_delta := 0;
    v_opts  := '[]'::jsonb;

    for v_group in select value from jsonb_array_elements(v_item.options) loop
      v_count := 0;
      for v_choice in select value from jsonb_array_elements(v_group->'choices') loop
        if (v_group->>'id') || ':' || (v_choice->>'id') = any (v_selected) then
          v_count := v_count + 1;
          v_delta := v_delta + coalesce((v_choice->>'price_delta')::int, 0);
          v_opts  := v_opts || jsonb_build_array(jsonb_build_object(
            'group_en',  v_group->>'name_en',  'group_bn',  v_group->>'name_bn',
            'choice_en', v_choice->>'name_en', 'choice_bn', v_choice->>'name_bn',
            'price_delta', coalesce((v_choice->>'price_delta')::int, 0)));
        end if;
      end loop;
      if coalesce((v_group->>'required')::boolean, false) and v_count = 0 then
        raise exception 'OPTION_REQUIRED:%', v_group->>'id';
      end if;
      if v_group->>'type' = 'single' and v_count > 1 then
        raise exception 'OPTION_INVALID:%', v_group->>'id';
      end if;
    end loop;

    -- every selected choice must have matched exactly once (catches unknown or duplicate ids)
    if jsonb_array_length(v_opts) <> cardinality(v_selected) then
      raise exception 'OPTION_INVALID';
    end if;

    menu_item_id := v_item.id;
    name_en      := v_item.name_en;
    name_bn      := v_item.name_bn;
    quantity     := v_qty;
    unit_price   := v_item.price + v_delta;
    options      := v_opts;
    line_total   := (v_item.price + v_delta) * v_qty;
    note         := left(v_line->>'note', 200);
    return next;
  end loop;
end $$;

-- Insert a request with its priced items. Internal.
create or replace function public._create_request(
  p_ctx_restaurant uuid, p_table uuid, p_session uuid, p_type public.request_type,
  p_device text, p_items jsonb, p_note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.service_requests (restaurant_id, table_id, session_id, type, device_id, note)
  values (p_ctx_restaurant, p_table, p_session, p_type, left(p_device, 64), left(p_note, 300))
  returning id into v_id;

  if p_items is not null and jsonb_array_length(p_items) > 0 then
    insert into public.request_items (request_id, menu_item_id, name_en, name_bn, quantity, unit_price, options, line_total, note)
    select v_id, c.menu_item_id, c.name_en, c.name_bn, c.quantity, c.unit_price, c.options, c.line_total, c.note
    from public.price_cart(p_ctx_restaurant, p_items) c;

    update public.service_requests
      set subtotal = (select coalesce(sum(line_total), 0) from public.request_items where request_id = v_id)
      where id = v_id;
  end if;
  return v_id;
end $$;

-- Shared JSON for the guest: session + its requests
create or replace function public._session_json(p_session_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', s.id,
    'status', s.status,
    'requests', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', r.id, 'type', r.type, 'status', r.status, 'subtotal', r.subtotal,
               'created_at', r.created_at, 'updated_at', r.updated_at)
             order by r.created_at desc)
      from public.service_requests r where r.session_id = s.id), '[]'::jsonb))
  from public.table_sessions s where s.id = p_session_id
$$;

-- ---------- public (guest) RPCs ----------

-- Called when a table QR page loads. Creates/joins the session for P2+.
create or replace function public.get_table_context(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ctx record; v_s public.table_sessions; v_slug text;
begin
  select * into v_ctx from public._table_ctx(p_token);
  select slug into v_slug from public.restaurants where id = v_ctx.restaurant_id;

  if v_ctx.package >= 2 then
    v_s := public._ensure_session(v_ctx.table_id);
  end if;

  return jsonb_build_object(
    'restaurant_slug', v_slug,
    'package', v_ctx.package,
    'table', jsonb_build_object('id', v_ctx.table_id, 'number', v_ctx.table_number),
    'session', case when v_s.id is null then null else public._session_json(v_s.id) end);
end $$;

-- Polling. Read-only: never creates a session.
create or replace function public.get_session_status(p_token text, p_session_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_ctx record;
begin
  select * into v_ctx from public._table_ctx(p_token);
  if not exists (select 1 from public.table_sessions where id = p_session_id and table_id = v_ctx.table_id) then
    raise exception 'SESSION_NOT_FOUND';
  end if;
  -- if the guest's session was closed, tell them which session is live now (may be null)
  return jsonb_build_object(
    'session', public._session_json(p_session_id),
    'live_session_id', v_ctx.session_id);
end $$;

create or replace function public.call_waiter(p_token text, p_device_id text, p_items jsonb default '[]'::jsonb, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ctx record; v_s public.table_sessions; v_existing uuid; v_id uuid;
begin
  select * into v_ctx from public._table_ctx(p_token);
  if v_ctx.package < 2 then raise exception 'FEATURE_NOT_IN_PACKAGE'; end if;
  v_s := public._ensure_session(v_ctx.table_id);

  select id into v_existing from public.service_requests
    where session_id = v_s.id and type = 'call_waiter' and status in ('new', 'acknowledged')
    order by created_at desc limit 1;

  if v_existing is not null then
    -- nudge: replace the attached list with the latest cart and re-alert the counter
    delete from public.request_items where request_id = v_existing;
    if p_items is not null and jsonb_array_length(p_items) > 0 then
      insert into public.request_items (request_id, menu_item_id, name_en, name_bn, quantity, unit_price, options, line_total, note)
      select v_existing, c.menu_item_id, c.name_en, c.name_bn, c.quantity, c.unit_price, c.options, c.line_total, c.note
      from public.price_cart(v_ctx.restaurant_id, p_items) c;
    end if;
    update public.service_requests
      set nudge_count = nudge_count + 1,
          note = coalesce(left(p_note, 300), note),
          subtotal = (select coalesce(sum(line_total), 0) from public.request_items where request_id = v_existing)
      where id = v_existing;
    return jsonb_build_object('request_id', v_existing, 'duplicate', true, 'session', public._session_json(v_s.id));
  end if;

  perform public._check_rate(v_s.id);
  v_id := public._create_request(v_ctx.restaurant_id, v_ctx.table_id, v_s.id, 'call_waiter', p_device_id, p_items, p_note);
  return jsonb_build_object('request_id', v_id, 'duplicate', false, 'session', public._session_json(v_s.id));
end $$;

create or replace function public.place_order(p_token text, p_device_id text, p_items jsonb, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ctx record; v_s public.table_sessions; v_id uuid;
begin
  select * into v_ctx from public._table_ctx(p_token);
  if v_ctx.package < 3 then raise exception 'FEATURE_NOT_IN_PACKAGE'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'EMPTY_CART'; end if;
  v_s := public._ensure_session(v_ctx.table_id);
  perform public._check_rate(v_s.id);
  v_id := public._create_request(v_ctx.restaurant_id, v_ctx.table_id, v_s.id, 'order', p_device_id, p_items, p_note);
  return jsonb_build_object('request_id', v_id, 'duplicate', false, 'session', public._session_json(v_s.id));
end $$;

create or replace function public.request_bill(p_token text, p_device_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ctx record; v_s public.table_sessions; v_existing uuid; v_id uuid;
begin
  select * into v_ctx from public._table_ctx(p_token);
  if v_ctx.package < 3 then raise exception 'FEATURE_NOT_IN_PACKAGE'; end if;
  if v_ctx.session_id is null then raise exception 'NO_ACTIVE_SESSION'; end if;
  select * into v_s from public.table_sessions where id = v_ctx.session_id;

  select id into v_existing from public.service_requests
    where session_id = v_s.id and type = 'bill' and status in ('new', 'acknowledged') limit 1;
  if v_existing is not null then
    update public.service_requests set nudge_count = nudge_count + 1 where id = v_existing;
    return jsonb_build_object('request_id', v_existing, 'duplicate', true, 'session', public._session_json(v_s.id));
  end if;

  perform public._check_rate(v_s.id);
  v_id := public._create_request(v_ctx.restaurant_id, v_ctx.table_id, v_s.id, 'bill', p_device_id, null, null);
  return jsonb_build_object('request_id', v_id, 'duplicate', false, 'session', public._session_json(v_s.id));
end $$;

-- Running bill for the live session (orders that are not new/cancelled... see note)
-- Note: 'new' orders ARE included (shown as "awaiting confirmation") so the guest sees everything;
-- only 'cancelled' orders are excluded.
create or replace function public.get_bill(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_ctx record; v_r public.restaurants; v_sub int; v_vat int; v_svc int;
begin
  select * into v_ctx from public._table_ctx(p_token);
  if v_ctx.package < 3 then raise exception 'FEATURE_NOT_IN_PACKAGE'; end if;
  if v_ctx.session_id is null then raise exception 'NO_ACTIVE_SESSION'; end if;
  select * into v_r from public.restaurants where id = v_ctx.restaurant_id;

  select coalesce(sum(i.line_total), 0) into v_sub
    from public.request_items i join public.service_requests r on r.id = i.request_id
    where r.session_id = v_ctx.session_id and r.type = 'order' and r.status <> 'cancelled';

  v_svc := round(v_sub * v_r.service_charge_percent / 100.0);
  v_vat := round((v_sub + v_svc) * v_r.vat_percent / 100.0);

  return jsonb_build_object(
    'lines', coalesce((
      select jsonb_agg(jsonb_build_object(
               'name_en', i.name_en, 'name_bn', i.name_bn, 'quantity', i.quantity,
               'unit_price', i.unit_price, 'options', i.options, 'line_total', i.line_total,
               'order_status', r.status) order by r.created_at, i.id)
      from public.request_items i join public.service_requests r on r.id = i.request_id
      where r.session_id = v_ctx.session_id and r.type = 'order' and r.status <> 'cancelled'), '[]'::jsonb),
    'subtotal', v_sub,
    'service_charge_percent', v_r.service_charge_percent, 'service_charge', v_svc,
    'vat_percent', v_r.vat_percent, 'vat', v_vat,
    'total', v_sub + v_svc + v_vat);
end $$;

-- One feedback per session. Allowed on the live session or the most recent session closed < 3 h ago.
create or replace function public.submit_feedback(p_token text, p_rating int, p_comment text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ctx record; v_session uuid;
begin
  select * into v_ctx from public._table_ctx(p_token);
  if v_ctx.package < 3 then raise exception 'FEATURE_NOT_IN_PACKAGE'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'BAD_RATING'; end if;

  v_session := coalesce(v_ctx.session_id, (
    select id from public.table_sessions
    where table_id = v_ctx.table_id and status = 'closed' and closed_at > now() - interval '3 hours'
    order by closed_at desc limit 1));
  if v_session is null then raise exception 'NO_ACTIVE_SESSION'; end if;

  insert into public.feedback (restaurant_id, table_id, session_id, rating, comment)
  values (v_ctx.restaurant_id, v_ctx.table_id, v_session, p_rating, left(p_comment, 1000))
  on conflict (session_id) do update set rating = excluded.rating, comment = excluded.comment;

  return jsonb_build_object('ok', true);
end $$;

-- ---------- grants ----------
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.get_table_context(text)                    to anon, authenticated;
grant execute on function public.get_session_status(text, uuid)             to anon, authenticated;
grant execute on function public.call_waiter(text, text, jsonb, text)       to anon, authenticated;
grant execute on function public.place_order(text, text, jsonb, text)       to anon, authenticated;
grant execute on function public.request_bill(text, text)                   to anon, authenticated;
grant execute on function public.get_bill(text)                             to anon, authenticated;
grant execute on function public.submit_feedback(text, int, text)           to anon, authenticated;
-- used inside RLS policies, must stay callable
grant execute on function public.is_staff(uuid), public.is_admin(uuid), public.my_restaurant_id() to anon, authenticated;
-- trigger functions don't need EXECUTE grants
```

> Supabase grants EXECUTE on new functions to `anon`/`authenticated` by default. The blanket `revoke` above must run **after** all functions are created; if functions are added later, repeat the revoke/grant in that migration.

## 4. Realtime
```sql
alter publication supabase_realtime add table public.service_requests, public.table_sessions;
```

## 5. Staff-side operations (no RPC needed — direct updates through RLS)
| Action | SQL equivalent (via supabase-js) |
|---|---|
| Approve table | `update table_sessions set status='open' where id=$1 and status='pending'` |
| Open table manually | `insert into table_sessions (restaurant_id, table_id, status) values ($r, $t, 'open')` (unique index prevents duplicates → show "already open") |
| Close table | `update table_sessions set status='closed' where id=$1`, then `update service_requests set status='done' where session_id=$1 and type in ('call_waiter','bill') and status not in ('done','cancelled')` |
| Move request | `update service_requests set status=$2 where id=$1` (allowed transitions enforced in the app, see 04-API.md) |
| Toggle sold-out | `update menu_items set is_available = not is_available where id=$1` |
| Regenerate QR | `update tables set qr_token = encode(gen_random_bytes(12),'hex') where id=$1` (do this through a tiny admin RPC or `execute` in a server action; `gen_random_bytes` is fine in SQL — from JS generate 24 hex chars with `crypto.getRandomValues`) |

## 6. Seed data — `supabase/seed.sql`
> This is **Brew Bari's** seed (restaurant #1). Every other restaurant has its own `supabase/seed-<slug>.sql`, specified in its `restaurants/<slug>/` docs.

Images are `null` in the seed; task T6.6 uploads photos and updates `image_url`. Staff users are created in Supabase Auth by the agent (MCP/Dashboard), then linked with the `insert into staff` at the bottom. **Never put passwords in the repo.**

```sql
-- Restaurant
insert into public.restaurants (slug, name_en, name_bn, tagline_en, tagline_bn, package,
  vat_percent, service_charge_percent, require_session_approval,
  address, phone, opening_hours_en, opening_hours_bn, wifi_name, wifi_password,
  facebook_url, instagram_url, google_maps_url, google_review_url)
values ('brew-bari', 'Brew Bari', 'ব্রু বাড়ি',
  'Coffee & fresh juice, made with love', 'ভালোবাসায় বানানো কফি আর ফ্রেশ জুস', 3,
  5, 0, true,
  'GEC Circle, Chattogram', '+880 1XXX-XXXXXX',
  'Every day 9 AM – 11 PM', 'প্রতিদিন সকাল ৯টা – রাত ১১টা', 'BrewBari_Guest', 'coffee2026',
  'https://facebook.com/', 'https://instagram.com/', 'https://maps.google.com/', 'https://g.page/r/REPLACE_ME/review');

-- Categories
insert into public.categories (restaurant_id, name_en, name_bn, icon, sort_order)
select r.id, v.name_en, v.name_bn, v.icon, v.sort_order
from public.restaurants r,
(values
  ('Hot Coffee',         'হট কফি',            '☕', 1),
  ('Cold Coffee',        'কোল্ড কফি',          '🧊', 2),
  ('Fresh Juice',        'ফ্রেশ জুস',           '🍹', 3),
  ('Shakes & Smoothies', 'শেক ও স্মুদি',         '🥤', 4),
  ('Tea',                'চা',                 '🍵', 5),
  ('Bites & Desserts',   'স্ন্যাকস ও ডেজার্ট',     '🥐', 6),
  ('Combos',             'কম্বো',               '🎁', 7)
) as v(name_en, name_bn, icon, sort_order)
where r.slug = 'brew-bari';

-- Menu items
with r as (select id from public.restaurants where slug = 'brew-bari'),
c as (select id, name_en from public.categories where restaurant_id = (select id from r)),
o(set_name, opts) as (values
  ('coffee', '[
    {"id":"size","name_en":"Size","name_bn":"সাইজ","type":"single","required":true,"choices":[
      {"id":"regular","name_en":"Regular","name_bn":"রেগুলার","price_delta":0},
      {"id":"large","name_en":"Large","name_bn":"লার্জ","price_delta":60}]},
    {"id":"milk","name_en":"Milk","name_bn":"দুধ","type":"single","required":false,"choices":[
      {"id":"regular","name_en":"Regular milk","name_bn":"সাধারণ দুধ","price_delta":0},
      {"id":"oat","name_en":"Oat milk","name_bn":"ওট মিল্ক","price_delta":80}]},
    {"id":"sugar","name_en":"Sugar","name_bn":"চিনি","type":"single","required":false,"choices":[
      {"id":"none","name_en":"No sugar","name_bn":"চিনি ছাড়া","price_delta":0},
      {"id":"less","name_en":"Less sugar","name_bn":"কম চিনি","price_delta":0},
      {"id":"normal","name_en":"Normal","name_bn":"স্বাভাবিক","price_delta":0}]},
    {"id":"extras","name_en":"Extras","name_bn":"এক্সট্রা","type":"multi","required":false,"choices":[
      {"id":"shot","name_en":"Extra shot","name_bn":"এক্সট্রা শট","price_delta":50},
      {"id":"caramel","name_en":"Caramel syrup","name_bn":"ক্যারামেল সিরাপ","price_delta":40},
      {"id":"cream","name_en":"Whipped cream","name_bn":"হুইপড ক্রিম","price_delta":40}]}]'::jsonb),
  ('espresso', '[
    {"id":"extras","name_en":"Extras","name_bn":"এক্সট্রা","type":"multi","required":false,"choices":[
      {"id":"shot","name_en":"Extra shot","name_bn":"এক্সট্রা শট","price_delta":50}]}]'::jsonb),
  ('juice', '[
    {"id":"sugar","name_en":"Sugar","name_bn":"চিনি","type":"single","required":false,"choices":[
      {"id":"none","name_en":"No sugar","name_bn":"চিনি ছাড়া","price_delta":0},
      {"id":"less","name_en":"Less sugar","name_bn":"কম চিনি","price_delta":0},
      {"id":"normal","name_en":"Normal","name_bn":"স্বাভাবিক","price_delta":0}]},
    {"id":"ice","name_en":"Ice","name_bn":"বরফ","type":"single","required":false,"choices":[
      {"id":"no","name_en":"No ice","name_bn":"বরফ ছাড়া","price_delta":0},
      {"id":"normal","name_en":"Normal ice","name_bn":"স্বাভাবিক বরফ","price_delta":0}]}]'::jsonb),
  ('tea', '[
    {"id":"sugar","name_en":"Sugar","name_bn":"চিনি","type":"single","required":false,"choices":[
      {"id":"none","name_en":"No sugar","name_bn":"চিনি ছাড়া","price_delta":0},
      {"id":"less","name_en":"Less sugar","name_bn":"কম চিনি","price_delta":0},
      {"id":"normal","name_en":"Normal","name_bn":"স্বাভাবিক","price_delta":0}]}]'::jsonb),
  ('none', '[]'::jsonb)
)
insert into public.menu_items (restaurant_id, category_id, name_en, name_bn, description_en, description_bn,
  price, compare_at_price, tags, options, sort_order)
select (select id from r), c.id, v.name_en, v.name_bn, v.desc_en, v.desc_bn,
       v.price, v.compare_at, v.tags::text[], o.opts, v.sort_order
from (values
  -- category,            name_en,             name_bn,                desc_en,                                         desc_bn,                                      price, compare, tags,                         options,   sort
  ('Hot Coffee',  'Espresso',           'এসপ্রেসো',             'A bold double shot of our house blend.',         'আমাদের হাউস ব্লেন্ডের কড়া ডাবল শট।',             180, null, '{hot}',                     'espresso', 1),
  ('Hot Coffee',  'Americano',          'আমেরিকানো',            'Espresso with hot water. Clean and strong.',      'গরম পানিতে এসপ্রেসো। হালকা কিন্তু কড়া।',           200, null, '{hot}',                     'coffee',   2),
  ('Hot Coffee',  'Cappuccino',         'ক্যাপুচিনো',             'Espresso, steamed milk and a thick foam cap.',    'এসপ্রেসো, স্টিমড দুধ আর ঘন ফোম।',                250, null, '{hot,bestseller}',          'coffee',   3),
  ('Hot Coffee',  'Café Latte',         'ক্যাফে লাতে',            'Smooth espresso with lots of silky milk.',        'প্রচুর মসৃণ দুধে নরম এসপ্রেসো।',                  260, null, '{hot}',                     'coffee',   4),
  ('Hot Coffee',  'Caramel Macchiato',  'ক্যারামেল ম্যাকিয়াতো',      'Vanilla milk, espresso and a caramel drizzle.',   'ভ্যানিলা দুধ, এসপ্রেসো আর ক্যারামেল।',              300, null, '{hot,bestseller}',          'coffee',   5),
  ('Hot Coffee',  'Mocha',              'মোকা',                 'Espresso meets rich chocolate.',                 'এসপ্রেসো আর ঘন চকলেটের মিলন।',                  290, null, '{hot}',                     'coffee',   6),
  ('Cold Coffee', 'Iced Americano',     'আইসড আমেরিকানো',         'Chilled espresso over ice.',                      'বরফের উপর ঠান্ডা এসপ্রেসো।',                       230, null, '{iced}',                    'coffee',   1),
  ('Cold Coffee', 'Iced Latte',         'আইসড লাতে',             'Espresso, cold milk, lots of ice.',               'এসপ্রেসো, ঠান্ডা দুধ আর প্রচুর বরফ।',               280, null, '{iced,bestseller}',         'coffee',   2),
  ('Cold Coffee', 'Cold Brew',          'কোল্ড ব্রু',              'Steeped 18 hours for a smooth, sweet finish.',    '১৮ ঘণ্টা ভিজিয়ে বানানো, মসৃণ স্বাদ।',                 300, null, '{iced,new}',                'coffee',   3),
  ('Cold Coffee', 'Caramel Frappé',     'ক্যারামেল ফ্রাপে',          'Blended iced coffee with caramel and cream.',     'ক্যারামেল আর ক্রিমসহ ব্লেন্ডেড আইসড কফি।',          340, null, '{iced,bestseller}',         'coffee',   4),
  ('Cold Coffee', 'Mocha Frappé',       'মোকা ফ্রাপে',             'Chocolate, coffee and ice, blended thick.',       'চকলেট, কফি আর বরফ — ঘন করে ব্লেন্ড।',              350, null, '{iced}',                    'coffee',   5),
  ('Fresh Juice', 'Mango Juice',        'আমের জুস',              'Fresh seasonal mangoes, nothing else.',           'মৌসুমি তাজা আম, আর কিছু না।',                       220, null, '{seasonal,veg}',            'juice',    1),
  ('Fresh Juice', 'Watermelon Juice',   'তরমুজের জুস',            'Cool, fresh and hydrating.',                      'ঠান্ডা, তাজা আর প্রাণ জুড়ানো।',                      180, null, '{veg}',                     'juice',    2),
  ('Fresh Juice', 'Malta Juice',        'মাল্টার জুস',             'Freshly squeezed local malta.',                   'সদ্য চিপে বানানো দেশি মাল্টা।',                       200, null, '{veg}',                     'juice',    3),
  ('Fresh Juice', 'Lemon Mint Cooler',  'লেমন মিন্ট কুলার',          'Lemon, mint and a little fizz.',                  'লেবু, পুদিনা আর হালকা ঝাঁঝ।',                        180, null, '{veg,bestseller}',          'juice',    4),
  ('Fresh Juice', 'Green Detox',        'গ্রিন ডিটক্স',             'Cucumber, green apple, mint and ginger.',         'শসা, সবুজ আপেল, পুদিনা আর আদা।',                   250, null, '{veg,new}',                 'juice',    5),
  ('Shakes & Smoothies', 'Oreo Shake',          'ওরিও শেক',             'Thick vanilla shake with crushed Oreo.',          'গুঁড়া ওরিওসহ ঘন ভ্যানিলা শেক।',                       320, null, '{bestseller}',              'none',     1),
  ('Shakes & Smoothies', 'Chocolate Shake',     'চকলেট শেক',            'Rich chocolate ice-cream shake.',                 'ঘন চকলেট আইসক্রিম শেক।',                         300, null, '{}',                        'none',     2),
  ('Shakes & Smoothies', 'Strawberry Smoothie', 'স্ট্রবেরি স্মুদি',          'Strawberry, banana and yogurt.',                  'স্ট্রবেরি, কলা আর দই।',                              330, null, '{veg}',                     'none',     3),
  ('Shakes & Smoothies', 'Banana Date Smoothie','কলা-খেজুর স্মুদি',         'Banana, dates and milk. Naturally sweet.',        'কলা, খেজুর আর দুধ। প্রাকৃতিক মিষ্টি।',                 280, null, '{veg}',                     'none',     4),
  ('Tea',         'Masala Chai',        'মশলা চা',               'Milk tea brewed with ginger, cardamom and clove.', 'আদা, এলাচ আর লবঙ্গে বানানো দুধ চা।',                120, null, '{hot}',                     'tea',      1),
  ('Tea',         'Lemon Honey Tea',    'লেবু-মধু চা',             'Light tea with lemon and honey.',                 'লেবু আর মধুর হালকা চা।',                              130, null, '{hot}',                     'tea',      2),
  ('Bites & Desserts', 'Chicken Sandwich',  'চিকেন স্যান্ডউইচ',        'Grilled chicken, cheese and greens on toast.',    'টোস্টে গ্রিলড চিকেন, চিজ আর সবজি।',                  280, null, '{}',                        'none',     1),
  ('Bites & Desserts', 'Butter Croissant',  'বাটার ক্রোয়াসাঁ',          'Flaky, buttery, baked every morning.',            'প্রতিদিন সকালে বেক করা মচমচে ক্রোয়াসাঁ।',             180, null, '{}',                        'none',     2),
  ('Bites & Desserts', 'Chocolate Brownie', 'চকলেট ব্রাউনি',           'Fudgy brownie, served warm.',                     'গরম গরম নরম ব্রাউনি।',                               190, null, '{bestseller}',              'none',     3),
  ('Bites & Desserts', 'Baked Cheesecake',  'বেকড চিজকেক',            'Creamy New York style cheesecake.',               'ক্রিমি নিউইয়র্ক স্টাইল চিজকেক।',                     350, null, '{}',                        'none',     4),
  ('Combos',      'Morning Combo',      'মর্নিং কম্বো',             'Cappuccino + Butter Croissant.',                  'ক্যাপুচিনো + বাটার ক্রোয়াসাঁ।',                          380,  430, '{}',                        'none',     1),
  ('Combos',      'Chill Combo',        'চিল কম্বো',               'Iced Latte + Chocolate Brownie.',                 'আইসড লাতে + চকলেট ব্রাউনি।',                         420,  470, '{new}',                     'none',     2)
) as v(cat, name_en, name_bn, desc_en, desc_bn, price, compare_at, tags, opt_set, sort_order)
join c on c.name_en = v.cat
join o on o.set_name = v.opt_set;

-- Approximate prep times (minutes)
update public.menu_items m set prep_minutes = v.mins
from (values
  ('Espresso', 2), ('Americano', 3), ('Cappuccino', 4), ('Café Latte', 4), ('Caramel Macchiato', 6), ('Mocha', 6),
  ('Iced Americano', 3), ('Iced Latte', 3), ('Cold Brew', 1), ('Caramel Frappé', 5), ('Mocha Frappé', 5),
  ('Mango Juice', 4), ('Watermelon Juice', 4), ('Malta Juice', 4), ('Lemon Mint Cooler', 3), ('Green Detox', 5),
  ('Oreo Shake', 5), ('Chocolate Shake', 5), ('Strawberry Smoothie', 5), ('Banana Date Smoothie', 5),
  ('Masala Chai', 4), ('Lemon Honey Tea', 3),
  ('Chicken Sandwich', 10), ('Butter Croissant', 2), ('Chocolate Brownie', 1), ('Baked Cheesecake', 1),
  ('Morning Combo', 6), ('Chill Combo', 4)
) as v(name_en, mins)
where m.name_en = v.name_en
  and m.restaurant_id = (select id from public.restaurants where slug = 'brew-bari');

-- Mark one item sold out so the demo shows the state
update public.menu_items set is_available = false
where name_en = 'Baked Cheesecake' and restaurant_id = (select id from public.restaurants where slug = 'brew-bari');

-- Offers
insert into public.offers (restaurant_id, title_en, title_bn, subtitle_en, subtitle_bn, badge_en, badge_bn,
  menu_item_id, category_id, sort_order)
select r.id, v.title_en, v.title_bn, v.sub_en, v.sub_bn, v.badge_en, v.badge_bn,
  (select id from public.menu_items where restaurant_id = r.id and name_en = v.item),
  (select id from public.categories where restaurant_id = r.id and name_en = v.cat),
  v.sort_order
from public.restaurants r,
(values
  ('Mango season is here', 'আমের মৌসুম এসে গেছে', 'Fresh mango juice, only ৳220', 'তাজা আমের জুস, মাত্র ৳২২০', 'Seasonal', 'মৌসুমি', 'Mango Juice', null, 1),
  ('Morning Combo', 'মর্নিং কম্বো', 'Cappuccino + Croissant — save ৳50', 'ক্যাপুচিনো + ক্রোয়াসাঁ — ৳৫০ সাশ্রয়', 'Save ৳50', '৳৫০ ছাড়', 'Morning Combo', null, 2),
  ('Happy Hour 3–5 PM', 'হ্যাপি আওয়ার ৩–৫টা', 'Buy 1 get 1 on all cold coffee, Mon–Thu', 'সোম–বৃহস্পতি সব কোল্ড কফিতে ১টা কিনলে ১টা ফ্রি', 'Today only', 'শুধু আজ', null, 'Cold Coffee', 3)
) as v(title_en, title_bn, sub_en, sub_bn, badge_en, badge_bn, item, cat, sort_order)
where r.slug = 'brew-bari';

-- Tables 1–8
insert into public.tables (restaurant_id, number, seats)
select r.id, n, case when n <= 4 then 2 else 4 end
from public.restaurants r, generate_series(1, 8) n
where r.slug = 'brew-bari';

-- Staff: create the users in Supabase Auth first, then:
-- insert into public.staff (user_id, restaurant_id, role, display_name)
-- select u.id, r.id, 'admin', 'Owner' from auth.users u, public.restaurants r
-- where u.email = '<admin email>' and r.slug = 'brew-bari';
-- (same for a 'counter' user)
```

## 7. SQL smoke tests (`supabase/tests/*.sql`)
Run via MCP `execute_sql`; each file is wrapped in `begin; ... rollback;` and uses `set local role anon;` to test as a guest. Minimum set (details in 06-TESTING.md):
- anon cannot `select` from `tables`, `table_sessions`, `service_requests`, `request_items`, `feedback`.
- anon cannot `insert` into `service_requests`.
- anon cannot execute `price_cart`, `_ensure_session`, `_create_request`.
- `call_waiter` with a valid token creates exactly one request; a second call returns `duplicate = true` and increments `nudge_count`.
- `place_order` with a sold-out item raises `ITEM_SOLD_OUT:<id>`; with a tampered price in the payload the stored price is still the DB price.
- `place_order` raises `FEATURE_NOT_IN_PACKAGE` when `package = 2`.
- `get_bill` totals: subtotal + VAT (5 %) rounded correctly, cancelled orders excluded.

## 8. Options Model v2 & `spice_level`

Applied in `20261015000006_option_rules.sql` for Grill Ghar (and available platform-wide):

### 8.1 Schema additions
```sql
alter table public.menu_items
  add column if not exists spice_level smallint check (spice_level between 0 and 4);
```
- `spice_level`: 0 = Not spicy, 1 = Mild, 2 = Medium, 3 = Hot, 4 = Naga Hot / Extra Spicy. Rendered in UI as chili glyphs.

### 8.2 Options Model v2 JSON structure (`menu_items.options`)
```json
[
  {
    "id": "meal-upgrade",
    "name_en": "Meal upgrade",
    "name_bn": "মিল আপগ্রেড",
    "type": "single",
    "required": true,
    "display": "cards",
    "choices": [
      {
        "id": "solo",
        "name_en": "Solo (Burger only)",
        "name_bn": "সোলো (শুধু বার্গার)",
        "price_delta": 0,
        "description_en": "Just the burger"
      },
      {
        "id": "meal",
        "name_en": "Meal (+৳150)",
        "name_bn": "মিল (+৳১৫০)",
        "price_delta": 150,
        "description_en": "Fries + soft drink included",
        "compare_delta": 200
      }
    ]
  },
  {
    "id": "drink",
    "name_en": "Included drink",
    "name_bn": "পানীয় নির্বাচন",
    "type": "single",
    "required": true,
    "display": "list",
    "show_if": {
      "group_id": "meal-upgrade",
      "choice_id": "meal"
    },
    "choices": [
      { "id": "cola", "name_en": "Soft Drink 250ml", "price_delta": 0 }
    ]
  }
]
```

### 8.3 Inactive conditional groups
When an option group has a `show_if` condition and the parent choice is not selected, the group is **inactive**.
- Inactive groups are omitted from the price calculation in `price_cart`.
- If an order payload supplies choices for an inactive group, `price_cart` rejects the line with `OPTION_INVALID`.
- If an active required group is omitted, `price_cart` rejects the line with `OPTION_REQUIRED`.
