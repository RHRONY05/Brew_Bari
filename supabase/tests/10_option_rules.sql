-- supabase/tests/10_option_rules.sql
-- Asserts options model v2 rules in price_cart:
-- 1. solo -> base price
-- 2. meal + drink -> priced with both deltas
-- 3. meal without drink -> OPTION_REQUIRED:drink
-- 4. drink without meal -> OPTION_INVALID
-- 5. tampered price / price_delta in request is ignored

begin;

insert into public.restaurants (id, slug, name_en, package)
values ('10000000-0000-0000-0000-000000000010', 'grill-ghar-test', 'Grill Ghar Test', 3);

insert into public.categories (id, restaurant_id, name_en, sort_order)
values ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000010', 'Burgers', 1);

insert into public.menu_items (id, restaurant_id, category_id, name_en, price, is_available, options, spice_level)
values
  ('30000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000010',
   'Classic Beef Burger', 280, true,
   '[
     {"id":"meal","name_en":"Meal","type":"single","required":true,"choices":[{"id":"solo","name_en":"Just burger","price_delta":0},{"id":"meal","name_en":"Meal","price_delta":150}]},
     {"id":"drink","name_en":"Drink","type":"single","required":true,"show_if":{"group":"meal","choice":"meal"},"choices":[{"id":"cola","name_en":"Cola","price_delta":0},{"id":"lassi","name_en":"Lassi","price_delta":30}]}
   ]'::jsonb, 0);

insert into public.tables (id, restaurant_id, number, qr_token)
values ('50000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000010', 1, 'token_gg_test');

set local role anon;

do $$
declare
  v_res jsonb;
begin
  -- 1. Solo choice -> base price 280
  v_res := public.place_order(
    'token_gg_test',
    'device_1',
    jsonb_build_array(jsonb_build_object(
      'item_id', '30000000-0000-0000-0000-000000000010',
      'qty', 1,
      'choices', jsonb_build_array('meal:solo')
    ))
  );
  if (v_res->'session'->'requests'->0->>'subtotal')::int <> 280 then
    raise exception 'FAIL: expected subtotal 280 for solo, got %', (v_res->'session'->'requests'->0->>'subtotal');
  end if;

  -- 2. Meal + Drink -> base 280 + 150 + 30 = 460
  v_res := public.place_order(
    'token_gg_test',
    'device_1',
    jsonb_build_array(jsonb_build_object(
      'item_id', '30000000-0000-0000-0000-000000000010',
      'qty', 1,
      'choices', jsonb_build_array('meal:meal', 'drink:lassi')
    ))
  );
  if (v_res->'session'->'requests'->1->>'subtotal')::int <> 460 then
    raise exception 'FAIL: expected subtotal 460 for meal + lassi, got %', (v_res->'session'->'requests'->1->>'subtotal');
  end if;

  -- 3. Meal without drink -> raises OPTION_REQUIRED
  begin
    perform public.place_order(
      'token_gg_test',
      'device_1',
      jsonb_build_array(jsonb_build_object(
        'item_id', '30000000-0000-0000-0000-000000000010',
        'qty', 1,
        'choices', jsonb_build_array('meal:meal')
      ))
    );
    raise exception 'FAIL: meal without drink should raise error';
  exception when others then
    if sqlerrm not like 'OPTION_REQUIRED%' then
      raise exception 'FAIL: expected OPTION_REQUIRED, got %', sqlerrm;
    end if;
  end;

  -- 4. Drink without meal -> raises OPTION_INVALID
  begin
    perform public.place_order(
      'token_gg_test',
      'device_1',
      jsonb_build_array(jsonb_build_object(
        'item_id', '30000000-0000-0000-0000-000000000010',
        'qty', 1,
        'choices', jsonb_build_array('meal:solo', 'drink:cola')
      ))
    );
    raise exception 'FAIL: drink without meal should raise error';
  exception when others then
    if sqlerrm not like 'OPTION_INVALID%' then
      raise exception 'FAIL: expected OPTION_INVALID, got %', sqlerrm;
    end if;
  end;

  -- 5. Tampered price_delta in payload is ignored (280 + 150 = 430)
  v_res := public.place_order(
    'token_gg_test',
    'device_1',
    jsonb_build_array(jsonb_build_object(
      'item_id', '30000000-0000-0000-0000-000000000010',
      'qty', 1,
      'price', 5,
      'choices', jsonb_build_array('meal:meal', 'drink:cola')
    ))
  );
  if (v_res->'session'->'requests'->2->>'subtotal')::int <> 430 then
    raise exception 'FAIL: expected subtotal 430 ignoring tampered price, got %', (v_res->'session'->'requests'->2->>'subtotal');
  end if;

end $$;

rollback;
