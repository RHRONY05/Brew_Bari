-- Migration: rpc (03-DATABASE.md §3)

-- ---------- internal helpers ----------

-- Look up a table by QR token. Does not create anything.
create or replace function public._table_ctx(p_token text)
returns table (table_id uuid, restaurant_id uuid, table_number int, package smallint,
               session_id uuid, session_status public.session_status)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  return query
    select t.id, t.restaurant_id, t.number, r.package, s.id, s.status
    from public.tables t
    join public.restaurants r on r.id = t.restaurant_id
    left join public.table_sessions s on s.table_id = t.id and s.status <> 'closed'
    where t.qr_token = p_token and t.is_active;
  if not found then
    raise exception 'TABLE_NOT_FOUND';
  end if;
end $$;

-- Return the live session for a table, creating one if needed.
create or replace function public._ensure_session(p_table_id uuid)
returns public.table_sessions
language plpgsql security definer set search_path = public as $$
declare
  v_s public.table_sessions;
  v_rest public.restaurants;
begin
  select * into v_s from public.table_sessions where table_id = p_table_id and status <> 'closed';
  if found then return v_s; end if;

  select r.* into v_rest from public.restaurants r join public.tables t on t.restaurant_id = r.id where t.id = p_table_id;

  insert into public.table_sessions (restaurant_id, table_id, status)
  values (v_rest.id, p_table_id, case when v_rest.require_session_approval then 'pending' else 'open' end::public.session_status)
  on conflict do nothing
  returning * into v_s;

  if v_s.id is null then  -- lost a race with a concurrent scan
    select * into v_s from public.table_sessions where table_id = p_table_id and status <> 'closed';
  end if;
  return v_s;
end $$;

create or replace function public._check_rate(p_session_id uuid)
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if (select count(*) from public.service_requests
      where session_id = p_session_id and created_at > now() - interval '10 minutes') >= 15 then
    raise exception 'RATE_LIMITED';
  end if;
end $$;

-- Validate a cart and compute prices server-side.
-- p_items: [{"item_id": uuid, "qty": int, "choices": ["group:choice", ...], "note": text}]
create or replace function public.price_cart(p_restaurant_id uuid, p_items jsonb)
returns table (menu_item_id uuid, name_en text, name_bn text, quantity int,
               unit_price int, options jsonb, line_total int, note text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_variable
declare
  v_line     jsonb;
  v_item     public.menu_items;
  v_qty      int;
  v_selected text[];
  v_group    jsonb;
  v_choice   jsonb;
  v_count    int;
  v_delta    int;
  v_opts     jsonb;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;
  if jsonb_array_length(p_items) > 30 then
    raise exception 'CART_TOO_LARGE';
  end if;

  for v_line in select value from jsonb_array_elements(p_items) loop
    select m.* into v_item from public.menu_items m
      where m.id = (v_line->>'item_id')::uuid and m.restaurant_id = p_restaurant_id and m.is_active;
    if not found then raise exception 'ITEM_NOT_FOUND'; end if;
    if not v_item.is_available then raise exception 'ITEM_SOLD_OUT:%', v_item.id; end if;

    v_qty := coalesce((v_line->>'qty')::int, 1);
    if v_qty < 1 or v_qty > 20 then raise exception 'BAD_QUANTITY'; end if;

    v_selected := coalesce(array(select jsonb_array_elements_text(coalesce(v_line->'choices', '[]'::jsonb))), '{}');
    v_delta := 0;
    v_opts  := '[]'::jsonb;

    for v_group in select value from jsonb_array_elements(v_item.options) loop
      v_count := 0;
      for v_choice in select value from jsonb_array_elements(v_group->'choices') loop
        if (v_group->>'id') || ':' || (v_choice->>'id') = any (v_selected) then
          v_count := v_count + 1;
          v_delta := v_delta + coalesce((v_choice->>'price_delta')::int, 0);
          v_opts  := v_opts || jsonb_build_array(jsonb_build_object(
            'group_en',  v_group->>'name_en',  'group_bn',  v_group->>'name_bn',
            'choice_en', v_choice->>'name_en', 'choice_bn', v_choice->>'name_bn',
            'price_delta', coalesce((v_choice->>'price_delta')::int, 0)));
        end if;
      end loop;
      if coalesce((v_group->>'required')::boolean, false) and v_count = 0 then
        raise exception 'OPTION_REQUIRED:%', v_group->>'id';
      end if;
      if v_group->>'type' = 'single' and v_count > 1 then
        raise exception 'OPTION_INVALID:%', v_group->>'id';
      end if;
    end loop;

    -- every selected choice must have matched exactly once (catches unknown or duplicate ids)
    if jsonb_array_length(v_opts) <> cardinality(v_selected) then
      raise exception 'OPTION_INVALID';
    end if;

    menu_item_id := v_item.id;
    name_en      := v_item.name_en;
    name_bn      := v_item.name_bn;
    quantity     := v_qty;
    unit_price   := v_item.price + v_delta;
    options      := v_opts;
    line_total   := (v_item.price + v_delta) * v_qty;
    note         := left(v_line->>'note', 200);
    return next;
  end loop;
end $$;

-- Insert a request with its priced items. Internal.
create or replace function public._create_request(
  p_ctx_restaurant uuid, p_table uuid, p_session uuid, p_type public.request_type,
  p_device text, p_items jsonb, p_note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.service_requests (restaurant_id, table_id, session_id, type, device_id, note)
  values (p_ctx_restaurant, p_table, p_session, p_type, left(p_device, 64), left(p_note, 300))
  returning id into v_id;

  if p_items is not null and jsonb_array_length(p_items) > 0 then
    insert into public.request_items (request_id, menu_item_id, name_en, name_bn, quantity, unit_price, options, line_total, note)
    select v_id, c.menu_item_id, c.name_en, c.name_bn, c.quantity, c.unit_price, c.options, c.line_total, c.note
    from public.price_cart(p_ctx_restaurant, p_items) c;

    update public.service_requests
      set subtotal = (select coalesce(sum(line_total), 0) from public.request_items where request_id = v_id)
      where id = v_id;
  end if;
  return v_id;
end $$;

-- Shared JSON for the guest: session + its requests
create or replace function public._session_json(p_session_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', s.id,
    'status', s.status,
    'requests', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', r.id, 'type', r.type, 'status', r.status, 'subtotal', r.subtotal,
               'created_at', r.created_at, 'updated_at', r.updated_at)
             order by r.created_at desc)
      from public.service_requests r where r.session_id = s.id), '[]'::jsonb))
  from public.table_sessions s where s.id = p_session_id
$$;

-- ---------- public (guest) RPCs ----------

-- Called when a table QR page loads. Creates/joins the session for P2+.
create or replace function public.get_table_context(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ctx record; v_s public.table_sessions; v_slug text;
begin
  select * into v_ctx from public._table_ctx(p_token);
  select slug into v_slug from public.restaurants where id = v_ctx.restaurant_id;

  if v_ctx.package >= 2 then
    v_s := public._ensure_session(v_ctx.table_id);
  end if;

  return jsonb_build_object(
    'restaurant_slug', v_slug,
    'package', v_ctx.package,
    'table', jsonb_build_object('id', v_ctx.table_id, 'number', v_ctx.table_number),
    'session', case when v_s.id is null then null else public._session_json(v_s.id) end);
end $$;

-- Polling. Read-only: never creates a session.
create or replace function public.get_session_status(p_token text, p_session_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_ctx record;
begin
  select * into v_ctx from public._table_ctx(p_token);
  if not exists (select 1 from public.table_sessions where id = p_session_id and table_id = v_ctx.table_id) then
    raise exception 'SESSION_NOT_FOUND';
  end if;
  -- if the guest's session was closed, tell them which session is live now (may be null)
  return jsonb_build_object(
    'session', public._session_json(p_session_id),
    'live_session_id', v_ctx.session_id);
end $$;

create or replace function public.call_waiter(p_token text, p_device_id text, p_items jsonb default '[]'::jsonb, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ctx record; v_s public.table_sessions; v_existing uuid; v_id uuid;
begin
  select * into v_ctx from public._table_ctx(p_token);
  if v_ctx.package < 2 then raise exception 'FEATURE_NOT_IN_PACKAGE'; end if;
  v_s := public._ensure_session(v_ctx.table_id);

  select id into v_existing from public.service_requests
    where session_id = v_s.id and type = 'call_waiter' and status in ('new', 'acknowledged')
    order by created_at desc limit 1;

  if v_existing is not null then
    -- nudge: replace the attached list with the latest cart and re-alert the counter
    delete from public.request_items where request_id = v_existing;
    if p_items is not null and jsonb_array_length(p_items) > 0 then
      insert into public.request_items (request_id, menu_item_id, name_en, name_bn, quantity, unit_price, options, line_total, note)
      select v_existing, c.menu_item_id, c.name_en, c.name_bn, c.quantity, c.unit_price, c.options, c.line_total, c.note
      from public.price_cart(v_ctx.restaurant_id, p_items) c;
    end if;
    update public.service_requests
      set nudge_count = nudge_count + 1,
          note = coalesce(left(p_note, 300), note),
          subtotal = (select coalesce(sum(line_total), 0) from public.request_items where request_id = v_existing)
      where id = v_existing;
    return jsonb_build_object('request_id', v_existing, 'duplicate', true, 'session', public._session_json(v_s.id));
  end if;

  perform public._check_rate(v_s.id);
  v_id := public._create_request(v_ctx.restaurant_id, v_ctx.table_id, v_s.id, 'call_waiter', p_device_id, p_items, p_note);
  return jsonb_build_object('request_id', v_id, 'duplicate', false, 'session', public._session_json(v_s.id));
end $$;

create or replace function public.place_order(p_token text, p_device_id text, p_items jsonb, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ctx record; v_s public.table_sessions; v_id uuid;
begin
  select * into v_ctx from public._table_ctx(p_token);
  if v_ctx.package < 3 then raise exception 'FEATURE_NOT_IN_PACKAGE'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'EMPTY_CART'; end if;
  v_s := public._ensure_session(v_ctx.table_id);
  perform public._check_rate(v_s.id);
  v_id := public._create_request(v_ctx.restaurant_id, v_ctx.table_id, v_s.id, 'order', p_device_id, p_items, p_note);
  return jsonb_build_object('request_id', v_id, 'duplicate', false, 'session', public._session_json(v_s.id));
end $$;

create or replace function public.request_bill(p_token text, p_device_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ctx record; v_s public.table_sessions; v_existing uuid; v_id uuid;
begin
  select * into v_ctx from public._table_ctx(p_token);
  if v_ctx.package < 3 then raise exception 'FEATURE_NOT_IN_PACKAGE'; end if;
  if v_ctx.session_id is null then raise exception 'NO_ACTIVE_SESSION'; end if;
  select * into v_s from public.table_sessions where id = v_ctx.session_id;

  select id into v_existing from public.service_requests
    where session_id = v_s.id and type = 'bill' and status in ('new', 'acknowledged') limit 1;
  if v_existing is not null then
    update public.service_requests set nudge_count = nudge_count + 1 where id = v_existing;
    return jsonb_build_object('request_id', v_existing, 'duplicate', true, 'session', public._session_json(v_s.id));
  end if;

  perform public._check_rate(v_s.id);
  v_id := public._create_request(v_ctx.restaurant_id, v_ctx.table_id, v_s.id, 'bill', p_device_id, null, null);
  return jsonb_build_object('request_id', v_id, 'duplicate', false, 'session', public._session_json(v_s.id));
end $$;

create or replace function public.get_bill(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_ctx record; v_r public.restaurants; v_sub int; v_vat int; v_svc int;
begin
  select * into v_ctx from public._table_ctx(p_token);
  if v_ctx.package < 3 then raise exception 'FEATURE_NOT_IN_PACKAGE'; end if;
  if v_ctx.session_id is null then raise exception 'NO_ACTIVE_SESSION'; end if;
  select * into v_r from public.restaurants where id = v_ctx.restaurant_id;

  select coalesce(sum(i.line_total), 0) into v_sub
    from public.request_items i join public.service_requests r on r.id = i.request_id
    where r.session_id = v_ctx.session_id and r.type = 'order' and r.status <> 'cancelled';

  v_svc := round(v_sub * v_r.service_charge_percent / 100.0);
  v_vat := round((v_sub + v_svc) * v_r.vat_percent / 100.0);

  return jsonb_build_object(
    'lines', coalesce((
      select jsonb_agg(jsonb_build_object(
               'name_en', i.name_en, 'name_bn', i.name_bn, 'quantity', i.quantity,
               'unit_price', i.unit_price, 'options', i.options, 'line_total', i.line_total,
               'order_status', r.status) order by r.created_at, i.id)
      from public.request_items i join public.service_requests r on r.id = i.request_id
      where r.session_id = v_ctx.session_id and r.type = 'order' and r.status <> 'cancelled'), '[]'::jsonb),
    'subtotal', v_sub,
    'service_charge_percent', v_r.service_charge_percent, 'service_charge', v_svc,
    'vat_percent', v_r.vat_percent, 'vat', v_vat,
    'total', v_sub + v_svc + v_vat);
end $$;

create or replace function public.submit_feedback(p_token text, p_rating int, p_comment text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ctx record; v_session uuid;
begin
  select * into v_ctx from public._table_ctx(p_token);
  if v_ctx.package < 3 then raise exception 'FEATURE_NOT_IN_PACKAGE'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'BAD_RATING'; end if;

  v_session := coalesce(v_ctx.session_id, (
    select id from public.table_sessions
    where table_id = v_ctx.table_id and status = 'closed' and closed_at > now() - interval '3 hours'
    order by closed_at desc limit 1));
  if v_session is null then raise exception 'NO_ACTIVE_SESSION'; end if;

  insert into public.feedback (restaurant_id, table_id, session_id, rating, comment)
  values (v_ctx.restaurant_id, v_ctx.table_id, v_session, p_rating, left(p_comment, 1000))
  on conflict (session_id) do update set rating = excluded.rating, comment = excluded.comment;

  return jsonb_build_object('ok', true);
end $$;

-- ---------- grants ----------
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.get_table_context(text)                    to anon, authenticated;
grant execute on function public.get_session_status(text, uuid)             to anon, authenticated;
grant execute on function public.call_waiter(text, text, jsonb, text)       to anon, authenticated;
grant execute on function public.place_order(text, text, jsonb, text)       to anon, authenticated;
grant execute on function public.request_bill(text, text)                   to anon, authenticated;
grant execute on function public.get_bill(text)                             to anon, authenticated;
grant execute on function public.submit_feedback(text, int, text)           to anon, authenticated;
-- used inside RLS policies, must stay callable
grant execute on function public.is_staff(uuid), public.is_admin(uuid), public.my_restaurant_id() to anon, authenticated;
