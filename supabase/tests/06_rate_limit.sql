-- supabase/tests/06_rate_limit.sql
-- Asserts:
-- - 16th request within 10 minutes raises RATE_LIMITED

begin;

-- Arrange test data
insert into public.restaurants (id, slug, name_en, package)
values ('10000000-0000-0000-0000-000000000001', 'test-rate-cafe', 'Test Rate Cafe', 3);

insert into public.tables (id, restaurant_id, number, qr_token)
values ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 'token_rate_test');

insert into public.table_sessions (id, restaurant_id, table_id, status)
values ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'open');

-- Insert 15 existing requests within last 10 minutes
insert into public.service_requests (restaurant_id, table_id, session_id, type, status, created_at)
select
  '10000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001',
  '60000000-0000-0000-0000-000000000001',
  'call_waiter',
  'done',
  now() - (n || ' seconds')::interval
from generate_series(1, 15) n;

set local role anon;

do $$
begin
  -- 16th request should raise RATE_LIMITED
  begin
    perform public.request_bill('token_rate_test', 'device_123');
    raise exception 'FAIL: expected RATE_LIMITED exception';
  exception when others then
    if sqlerrm <> 'RATE_LIMITED' then
      raise exception 'FAIL: expected RATE_LIMITED, got %', sqlerrm;
    end if;
  end;
end $$;

rollback;
