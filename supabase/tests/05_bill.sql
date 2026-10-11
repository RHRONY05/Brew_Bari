-- supabase/tests/05_bill.sql
-- Asserts:
-- - two orders (one cancelled) -> subtotal excludes cancelled order
-- - VAT 5% rounding: 250 -> 13 -> total 263

begin;

-- Arrange test data
insert into public.restaurants (id, slug, name_en, package, vat_percent, service_charge_percent)
values ('10000000-0000-0000-0000-000000000001', 'test-bill-cafe', 'Test Bill Cafe', 3, 5.0, 0.0);

insert into public.categories (id, restaurant_id, name_en, sort_order)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Coffee', 1);

insert into public.menu_items (id, restaurant_id, category_id, name_en, price, options)
values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Latte', 250, '[]'::jsonb),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Cake', 100, '[]'::jsonb);

insert into public.tables (id, restaurant_id, number, qr_token)
values ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 'token_bill_test');

insert into public.table_sessions (id, restaurant_id, table_id, status)
values ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'open');

-- Order 1: active (preparing), 250
insert into public.service_requests (id, restaurant_id, table_id, session_id, type, status, subtotal)
values ('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'order', 'preparing', 250);

insert into public.request_items (request_id, menu_item_id, name_en, quantity, unit_price, line_total)
values ('70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Latte', 1, 250, 250);

-- Order 2: cancelled, 100
insert into public.service_requests (id, restaurant_id, table_id, session_id, type, status, subtotal)
values ('70000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'order', 'cancelled', 100);

insert into public.request_items (request_id, menu_item_id, name_en, quantity, unit_price, line_total)
values ('70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Cake', 1, 100, 100);

set local role anon;

do $$
declare
  v_bill jsonb;
begin
  v_bill := public.get_bill('token_bill_test');

  -- Verify subtotal excludes cancelled order
  if (v_bill->>'subtotal')::int <> 250 then
    raise exception 'FAIL: expected subtotal 250, got %', (v_bill->>'subtotal');
  end if;

  -- Verify VAT calculation: round(250 * 0.05) = 13
  if (v_bill->>'vat')::int <> 13 then
    raise exception 'FAIL: expected vat 13, got %', (v_bill->>'vat');
  end if;

  -- Verify total: 250 + 13 = 263
  if (v_bill->>'total')::int <> 263 then
    raise exception 'FAIL: expected total 263, got %', (v_bill->>'total');
  end if;

  -- Verify lines count is 1 (cancelled item excluded)
  if jsonb_array_length(v_bill->'lines') <> 1 then
    raise exception 'FAIL: expected 1 bill line, got %', jsonb_array_length(v_bill->'lines');
  end if;
end $$;

rollback;
