-- supabase/tests/01_rls_anon.sql
-- Asserts:
-- - anon sees 0 rows of tables/sessions/requests/items/feedback/staff
-- - anon cannot insert/update/delete any table
-- - anon sees only active items & live offers

begin;

-- Arrange test data
insert into public.restaurants (id, slug, name_en, package)
values ('10000000-0000-0000-0000-000000000001', 'test-cafe', 'Test Cafe', 3);

insert into public.categories (id, restaurant_id, name_en, sort_order, is_active)
values 
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Active Cat', 1, true),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Inactive Cat', 2, false);

insert into public.menu_items (id, restaurant_id, category_id, name_en, price, is_active, is_available)
values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Active Item', 100, true, true),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Hidden Item', 100, false, true);

insert into public.offers (id, restaurant_id, title_en, is_active, starts_at, ends_at)
values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Live Offer', true, now() - interval '1 hour', now() + interval '1 hour'),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Inactive Offer', false, now() - interval '1 hour', now() + interval '1 hour'),
  ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Expired Offer', true, now() - interval '2 hour', now() - interval '1 hour');

insert into public.tables (id, restaurant_id, number, seats, qr_token)
values ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 2, 'tok123456789012345678901');

insert into public.table_sessions (id, restaurant_id, table_id, status)
values ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'open');

insert into public.service_requests (id, restaurant_id, table_id, session_id, type, status)
values ('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'call_waiter', 'new');

insert into public.request_items (id, request_id, menu_item_id, name_en, quantity, unit_price, line_total)
values ('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Active Item', 1, 100, 100);

insert into public.feedback (id, restaurant_id, table_id, session_id, rating, comment)
values ('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 5, 'Great coffee');

-- Switch role to anon
set local role anon;

do $$
declare
  v_cnt int;
begin
  -- 1. tables, sessions, requests, items, feedback, staff are invisible (0 rows)
  select count(*) into v_cnt from public.tables;
  if v_cnt > 0 then raise exception 'FAIL: anon can see % rows in tables', v_cnt; end if;

  select count(*) into v_cnt from public.table_sessions;
  if v_cnt > 0 then raise exception 'FAIL: anon can see % rows in table_sessions', v_cnt; end if;

  select count(*) into v_cnt from public.service_requests;
  if v_cnt > 0 then raise exception 'FAIL: anon can see % rows in service_requests', v_cnt; end if;

  select count(*) into v_cnt from public.request_items;
  if v_cnt > 0 then raise exception 'FAIL: anon can see % rows in request_items', v_cnt; end if;

  select count(*) into v_cnt from public.feedback;
  if v_cnt > 0 then raise exception 'FAIL: anon can see % rows in feedback', v_cnt; end if;

  select count(*) into v_cnt from public.staff;
  if v_cnt > 0 then raise exception 'FAIL: anon can see % rows in staff', v_cnt; end if;

  -- 2. anon sees active categories only
  select count(*) into v_cnt from public.categories where id = '20000000-0000-0000-0000-000000000002';
  if v_cnt > 0 then raise exception 'FAIL: anon sees inactive category'; end if;

  select count(*) into v_cnt from public.categories where id = '20000000-0000-0000-0000-000000000001';
  if v_cnt <> 1 then raise exception 'FAIL: anon cannot see active category'; end if;

  -- 3. anon sees active items only
  select count(*) into v_cnt from public.menu_items where id = '30000000-0000-0000-0000-000000000002';
  if v_cnt > 0 then raise exception 'FAIL: anon sees inactive menu item'; end if;

  select count(*) into v_cnt from public.menu_items where id = '30000000-0000-0000-0000-000000000001';
  if v_cnt <> 1 then raise exception 'FAIL: anon cannot see active menu item'; end if;

  -- 4. anon sees live offers only
  select count(*) into v_cnt from public.offers where id = '40000000-0000-0000-0000-000000000001';
  if v_cnt <> 1 then raise exception 'FAIL: anon cannot see live offer'; end if;

  select count(*) into v_cnt from public.offers where id in ('40000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003');
  if v_cnt > 0 then raise exception 'FAIL: anon sees inactive or expired offer'; end if;

  -- 5. anon cannot insert/update/delete any table
  begin
    insert into public.service_requests (restaurant_id, table_id, session_id, type)
    values ('10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'call_waiter');
    raise exception 'FAIL: anon inserted service_requests';
  exception when insufficient_privilege then null;
  end;

  -- update must not affect any row
  update public.menu_items set price = 999 where id = '30000000-0000-0000-0000-000000000001';
  if found then raise exception 'FAIL: anon updated menu_items'; end if;

  -- delete must not affect any row
  delete from public.categories where id = '20000000-0000-0000-0000-000000000001';
  if found then raise exception 'FAIL: anon deleted categories'; end if;
end $$;

rollback;
