-- supabase/tests/04_place_order.sql
-- Asserts:
-- - tampered payload (extra price field) ignored and DB prices used
-- - sold-out item -> ITEM_SOLD_OUT:<uuid>
-- - missing required option -> OPTION_REQUIRED:<id>
-- - unknown choice -> OPTION_INVALID
-- - package 2 -> FEATURE_NOT_IN_PACKAGE

begin;

-- Arrange test data
insert into public.restaurants (id, slug, name_en, package)
values
  ('10000000-0000-0000-0000-000000000001', 'test-p3-cafe', 'Test P3 Cafe', 3),
  ('10000000-0000-0000-0000-000000000002', 'test-p2-cafe', 'Test P2 Cafe', 2);

insert into public.categories (id, restaurant_id, name_en, sort_order)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Coffee', 1),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Coffee', 1);

insert into public.menu_items (id, restaurant_id, category_id, name_en, price, is_available, options)
values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   'Americano', 200, true,
   '[{"id":"size","name_en":"Size","name_bn":"সাইজ","type":"single","required":true,"choices":[{"id":"regular","name_en":"Regular","name_bn":"রেগুলার","price_delta":0},{"id":"large","name_en":"Large","name_bn":"লার্জ","price_delta":50}]}]'::jsonb),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   'Soldout Cake', 300, false, '[]'::jsonb),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002',
   'P2 Coffee', 150, true, '[]'::jsonb);

insert into public.tables (id, restaurant_id, number, qr_token)
values
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 'token_p3_test'),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 2, 'token_p2_test');

set local role anon;

do $$
declare
  v_res jsonb;
begin
  -- 1. Package 2 raises FEATURE_NOT_IN_PACKAGE
  begin
    perform public.place_order(
      'token_p2_test',
      'device_1',
      jsonb_build_array(jsonb_build_object('item_id', '30000000-0000-0000-0000-000000000003', 'qty', 1))
    );
    raise exception 'FAIL: package 2 should not allow place_order';
  exception when others then
    if sqlerrm <> 'FEATURE_NOT_IN_PACKAGE' then
      raise exception 'FAIL: expected FEATURE_NOT_IN_PACKAGE, got %', sqlerrm;
    end if;
  end;

  -- 2. Sold out item raises ITEM_SOLD_OUT:<id>
  begin
    perform public.place_order(
      'token_p3_test',
      'device_1',
      jsonb_build_array(jsonb_build_object('item_id', '30000000-0000-0000-0000-000000000002', 'qty', 1))
    );
    raise exception 'FAIL: sold out item should not be ordered';
  exception when others then
    if sqlerrm <> 'ITEM_SOLD_OUT:30000000-0000-0000-0000-000000000002' then
      raise exception 'FAIL: expected ITEM_SOLD_OUT:..., got %', sqlerrm;
    end if;
  end;

  -- 3. Missing required option raises OPTION_REQUIRED:size
  begin
    perform public.place_order(
      'token_p3_test',
      'device_1',
      jsonb_build_array(jsonb_build_object('item_id', '30000000-0000-0000-0000-000000000001', 'qty', 1, 'choices', '[]'::jsonb))
    );
    raise exception 'FAIL: missing option should raise error';
  exception when others then
    if sqlerrm <> 'OPTION_REQUIRED:size' then
      raise exception 'FAIL: expected OPTION_REQUIRED:size, got %', sqlerrm;
    end if;
  end;

  -- 4. Unknown choice raises OPTION_INVALID
  begin
    perform public.place_order(
      'token_p3_test',
      'device_1',
      jsonb_build_array(jsonb_build_object(
        'item_id', '30000000-0000-0000-0000-000000000001',
        'qty', 1,
        'choices', jsonb_build_array('size:regular', 'extras:bogus')
      ))
    );
    raise exception 'FAIL: unknown choice should raise error';
  exception when others then
    if sqlerrm <> 'OPTION_INVALID' then
      raise exception 'FAIL: expected OPTION_INVALID, got %', sqlerrm;
    end if;
  end;

  -- 5. Valid order with tampered price (passed price: 10) uses real DB price 250 (200 + 50)
  v_res := public.place_order(
    'token_p3_test',
    'device_1',
    jsonb_build_array(jsonb_build_object(
      'item_id', '30000000-0000-0000-0000-000000000001',
      'qty', 2,
      'price', 10,
      'choices', jsonb_build_array('size:large')
    ))
  );

  if (v_res->'session'->'requests'->0->>'subtotal')::int <> 500 then
    raise exception 'FAIL: expected subtotal 500 (250*2), got %', (v_res->'session'->'requests'->0->>'subtotal');
  end if;
end $$;

rollback;
