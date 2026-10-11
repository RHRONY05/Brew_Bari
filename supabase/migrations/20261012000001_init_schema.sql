-- Migration: init_schema (03-DATABASE.md §1)
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
  prep_minutes      smallint check (prep_minutes between 1 and 120),  -- approx. prep time
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
