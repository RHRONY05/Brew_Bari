-- supabase/tests/02_rpc_grants.sql
-- Asserts:
-- - anon cannot execute price_cart, _ensure_session, _create_request, _table_ctx
-- - anon can execute the 7 guest RPCs

begin;

set local role anon;

-- Test 1: internal helpers are NOT executable by anon
do $$
begin
  begin
    perform public._table_ctx('dummy');
    raise exception 'FAIL: anon executed _table_ctx';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public._ensure_session('00000000-0000-0000-0000-000000000001'::uuid);
    raise exception 'FAIL: anon executed _ensure_session';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.price_cart('00000000-0000-0000-0000-000000000001'::uuid, '[]'::jsonb);
    raise exception 'FAIL: anon executed price_cart';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public._create_request('00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'call_waiter', 'dev', '[]'::jsonb, null);
    raise exception 'FAIL: anon executed _create_request';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Test 2: customer RPCs CAN be executed (raises domain error like TABLE_NOT_FOUND, not insufficient_privilege)
do $$
begin
  begin
    perform public.get_table_context('invalid_token');
    raise exception 'FAIL: did not raise';
  exception
    when insufficient_privilege then raise exception 'FAIL: anon lacks execute on get_table_context';
    when others then
      if sqlerrm <> 'TABLE_NOT_FOUND' then raise exception 'FAIL: unexpected error %', sqlerrm; end if;
  end;

  begin
    perform public.call_waiter('invalid_token', 'dev1');
    raise exception 'FAIL: did not raise';
  exception
    when insufficient_privilege then raise exception 'FAIL: anon lacks execute on call_waiter';
    when others then
      if sqlerrm <> 'TABLE_NOT_FOUND' then raise exception 'FAIL: unexpected error %', sqlerrm; end if;
  end;

  begin
    perform public.place_order('invalid_token', 'dev1', '[]'::jsonb);
    raise exception 'FAIL: did not raise';
  exception
    when insufficient_privilege then raise exception 'FAIL: anon lacks execute on place_order';
    when others then
      if sqlerrm <> 'TABLE_NOT_FOUND' then raise exception 'FAIL: unexpected error %', sqlerrm; end if;
  end;

  begin
    perform public.request_bill('invalid_token', 'dev1');
    raise exception 'FAIL: did not raise';
  exception
    when insufficient_privilege then raise exception 'FAIL: anon lacks execute on request_bill';
    when others then
      if sqlerrm <> 'TABLE_NOT_FOUND' then raise exception 'FAIL: unexpected error %', sqlerrm; end if;
  end;

  begin
    perform public.get_bill('invalid_token');
    raise exception 'FAIL: did not raise';
  exception
    when insufficient_privilege then raise exception 'FAIL: anon lacks execute on get_bill';
    when others then
      if sqlerrm <> 'TABLE_NOT_FOUND' then raise exception 'FAIL: unexpected error %', sqlerrm; end if;
  end;

  begin
    perform public.submit_feedback('invalid_token', 5);
    raise exception 'FAIL: did not raise';
  exception
    when insufficient_privilege then raise exception 'FAIL: anon lacks execute on submit_feedback';
    when others then
      if sqlerrm <> 'TABLE_NOT_FOUND' then raise exception 'FAIL: unexpected error %', sqlerrm; end if;
  end;
end $$;

rollback;
