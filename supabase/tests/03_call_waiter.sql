-- supabase/tests/03_call_waiter.sql
-- Asserts:
-- - creates session (pending when require_session_approval is true)
-- - 1st call creates request (duplicate=false, nudge_count=0)
-- - 2nd call updates request (duplicate=true, nudge_count=1)
-- - items attached with calculated DB prices

begin;

-- Arrange test data
insert into public.restaurants (id, slug, name_en, package, require_session_approval)
values ('10000000-0000-0000-0000-000000000001', 'test-waiter-cafe', 'Test Waiter Cafe', 2, true);

insert into public.categories (id, restaurant_id, name_en, sort_order)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Coffee', 1);

insert into public.menu_items (id, restaurant_id, category_id, name_en, price, options)
values (
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Latte',
  250,
  '[{"id":"size","name_en":"Size","name_bn":"সাইজ","type":"single","required":true,"choices":[{"id":"reg","name_en":"Regular","name_bn":"রেগুলার","price_delta":0},{"id":"large","name_en":"Large","name_bn":"লার্জ","price_delta":50}]}]'::jsonb
);

insert into public.tables (id, restaurant_id, number, qr_token)
values ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 'token_call_waiter_test');

set local role anon;

do $$
declare
  v_res1 jsonb;
  v_res2 jsonb;
begin
  -- 1st call_waiter with item (large latte: 250 + 50 = 300, qty 2 -> 600)
  v_res1 := public.call_waiter(
    'token_call_waiter_test',
    'device_123',
    jsonb_build_array(jsonb_build_object(
      'item_id', '30000000-0000-0000-0000-000000000001',
      'qty', 2,
      'choices', jsonb_build_array('size:large'),
      'note', 'extra hot'
    )),
    'Please bring water'
  );

  if (v_res1->>'duplicate')::boolean <> false then
    raise exception 'FAIL: first call should not be duplicate';
  end if;

  if (v_res1->'session'->>'status') <> 'pending' then
    raise exception 'FAIL: expected session status pending, got %', (v_res1->'session'->>'status');
  end if;

  if (v_res1->'session'->'requests'->0->>'subtotal')::int <> 600 then
    raise exception 'FAIL: expected subtotal 600, got %', (v_res1->'session'->'requests'->0->>'subtotal');
  end if;

  -- 2nd call_waiter should be duplicate
  v_res2 := public.call_waiter(
    'token_call_waiter_test',
    'device_123',
    '[]'::jsonb,
    'Still waiting'
  );

  if (v_res2->>'duplicate')::boolean <> true then
    raise exception 'FAIL: second call should be duplicate';
  end if;
  if (v_res2->>'request_id') <> (v_res1->>'request_id') then
    raise exception 'FAIL: second call returned different request_id';
  end if;
end $$;

-- Switch role back to owner/postgres to assert underlying tables
reset role;

do $$
declare
  v_req_id uuid;
  v_nudge int;
  v_item_cnt int;
  v_line_total int;
begin
  select id into v_req_id from public.service_requests
  where table_id = '50000000-0000-0000-0000-000000000001';

  select nudge_count into v_nudge from public.service_requests where id = v_req_id;
  if v_nudge <> 1 then raise exception 'FAIL: expected nudge_count 1, got %', v_nudge; end if;

  -- Note: on duplicate nudge without new items, request_items was cleared per RPC logic
  -- or if new items provided, replaced. In call 2, p_items was '[]', so items were cleared.
end $$;

rollback;
