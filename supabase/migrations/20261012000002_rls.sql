-- Migration: rls (03-DATABASE.md §2)

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

-- Storage: menu-images bucket & policies
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
