-- supabase/tests/08_staff_rls.sql
-- Asserts:
-- - counter user can update request status
-- - counter user cannot update restaurants or categories
-- - admin user can update restaurants and categories

begin;

-- Arrange test data
insert into public.restaurants (id, slug, name_en, package)
values ('10000000-0000-0000-0000-000000000001', 'test-cafe-staff', 'Test Cafe Staff', 3);

insert into public.categories (id, restaurant_id, name_en, sort_order, is_active)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Staff Cat', 1, true);

insert into public.tables (id, restaurant_id, number, seats, qr_token)
values ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 2, 'tokstaff1234567890123456');

insert into public.table_sessions (id, restaurant_id, table_id, status)
values ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'open');

insert into public.service_requests (id, restaurant_id, table_id, session_id, type, status)
values ('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'call_waiter', 'new');

-- Create dummy auth users in auth.users
insert into auth.users (id, aud, role, email)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'counter@test.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'admin@test.com')
on conflict (id) do nothing;

insert into public.staff (user_id, restaurant_id, role, display_name)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '10000000-0000-0000-0000-000000000001', 'counter', 'Counter Staff'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '10000000-0000-0000-0000-000000000001', 'admin', 'Admin Staff');

-- Test as Counter user
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';

do $$
declare
  v_cnt int;
begin
  -- Counter can see own staff row
  select count(*) into v_cnt from public.staff where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  if v_cnt <> 1 then raise exception 'FAIL: counter cannot see own staff row'; end if;

  -- Counter CAN update service request status
  update public.service_requests set status = 'acknowledged' where id = '70000000-0000-0000-0000-000000000001';
  if not found then raise exception 'FAIL: counter could not update service request status'; end if;

  -- Counter CANNOT update restaurant
  update public.restaurants set name_en = 'Hacked Restaurant' where id = '10000000-0000-0000-0000-000000000001';
  if found then raise exception 'FAIL: counter updated restaurant'; end if;

  -- Counter CANNOT update category
  update public.categories set name_en = 'Hacked Category' where id = '20000000-0000-0000-0000-000000000001';
  if found then raise exception 'FAIL: counter updated category'; end if;
end $$;

-- Test as Admin user
set local "request.jwt.claims" = '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';

do $$
begin
  -- Admin CAN update restaurant
  update public.restaurants set name_en = 'Admin Updated Restaurant' where id = '10000000-0000-0000-0000-000000000001';
  if not found then raise exception 'FAIL: admin could not update restaurant'; end if;

  -- Admin CAN update category
  update public.categories set name_en = 'Admin Updated Category' where id = '20000000-0000-0000-0000-000000000001';
  if not found then raise exception 'FAIL: admin could not update category'; end if;
end $$;

rollback;
