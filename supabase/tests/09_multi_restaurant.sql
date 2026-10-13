-- Multi-restaurant isolation + platform-managed fields.
-- Run via Supabase MCP execute_sql. Everything rolls back.
-- Expected: every "sees"/"updates" count is 0, guards say "blocked", resolve returns the slug.
begin;
create temp table _r(check_name text, value text) on commit drop;
grant all on _r to authenticated, anon;
do $$
declare v_admin uuid; v_rid uuid; v_other uuid; v_cat uuid; v_tbl uuid; v_n int; v_token text;
begin
  insert into public.restaurants (slug, name_en, theme_key, package, package_locked)
    values ('iso-test', 'Isolation Test', 'brew-bari', 3, true) returning id into v_other;
  insert into public.categories (restaurant_id, name_en) values (v_other, 'Burgers') returning id into v_cat;
  insert into public.menu_items (restaurant_id, category_id, name_en, price) values (v_other, v_cat, 'Test Burger', 300);
  insert into public.tables (restaurant_id, number) values (v_other, 1) returning id, qr_token into v_tbl, v_token;
  perform public.call_waiter(v_token, 'iso-device', '[]'::jsonb, null);

  select user_id, restaurant_id into v_admin, v_rid from public.staff where role = 'admin' limit 1;
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- isolation: an admin of restaurant A sees and changes nothing of restaurant B
  select count(*) into v_n from public.tables where restaurant_id = v_other;            insert into _r values ('A admin sees B tables', v_n::text);
  select count(*) into v_n from public.table_sessions where restaurant_id = v_other;    insert into _r values ('A admin sees B sessions', v_n::text);
  select count(*) into v_n from public.service_requests where restaurant_id = v_other;  insert into _r values ('A admin sees B requests', v_n::text);
  update public.menu_items set price = 1 where restaurant_id = v_other; get diagnostics v_n = row_count; insert into _r values ('A admin updates B items', v_n::text);
  update public.restaurants set name_en = 'x' where id = v_other;       get diagnostics v_n = row_count; insert into _r values ('A admin updates B restaurant', v_n::text);

  -- platform-managed fields on own restaurant
  begin update public.restaurants set slug = 'hacked' where id = v_rid; insert into _r values ('slug change', 'ALLOWED (bad)');
  exception when others then insert into _r values ('slug change', 'blocked'); end;
  begin update public.restaurants set theme_key = 'other' where id = v_rid; insert into _r values ('theme change', 'ALLOWED (bad)');
  exception when others then insert into _r values ('theme change', 'blocked'); end;
  begin update public.restaurants set package_locked = true where id = v_rid; insert into _r values ('lock change', 'ALLOWED (bad)');
  exception when others then insert into _r values ('lock change', 'blocked'); end;
  reset role;

  set local role anon;
  insert into _r values ('anon resolve_table_slug', coalesce(public.resolve_table_slug(v_token), 'null'));
  insert into _r values ('anon resolve bad token', coalesce(public.resolve_table_slug('nope'), 'null'));
  reset role;

  -- reserved slug rejected
  begin insert into public.restaurants (slug, name_en) values ('staff', 'x'); insert into _r values ('reserved slug', 'ALLOWED (bad)');
  exception when check_violation then insert into _r values ('reserved slug', 'blocked'); end;
end $$;
select * from _r;
rollback;
