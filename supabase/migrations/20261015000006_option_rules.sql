-- Migration: 20261015000006_option_rules.sql
-- 1. Add spice_level column to menu_items (0 to 4)
alter table public.menu_items
  add column if not exists spice_level smallint null check (spice_level between 0 and 4);

-- 2. Update price_cart with show_if conditional option rules
create or replace function public.price_cart(p_restaurant_id uuid, p_items jsonb)
returns table (menu_item_id uuid, name_en text, name_bn text, quantity int,
               unit_price int, options jsonb, line_total int, note text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_variable
declare
  v_line        jsonb;
  v_item        public.menu_items;
  v_qty         int;
  v_selected    text[];
  v_group       jsonb;
  v_choice      jsonb;
  v_count       int;
  v_delta       int;
  v_opts        jsonb;
  v_is_active   boolean;
  v_show_if     jsonb;
  v_parent_key  text;
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

    for v_group in select value from jsonb_array_elements(coalesce(v_item.options, '[]'::jsonb)) loop
      v_is_active := true;
      v_show_if := v_group->'show_if';
      if v_show_if is not null and v_show_if <> 'null'::jsonb and jsonb_typeof(v_show_if) = 'object' then
        v_parent_key := (v_show_if->>'group') || ':' || (v_show_if->>'choice');
        if not (v_parent_key = any (v_selected)) then
          v_is_active := false;
        end if;
      end if;

      v_count := 0;
      for v_choice in select value from jsonb_array_elements(coalesce(v_group->'choices', '[]'::jsonb)) loop
        if (v_group->>'id') || ':' || (v_choice->>'id') = any (v_selected) then
          if not v_is_active then
            raise exception 'OPTION_INVALID:%', v_group->>'id';
          end if;
          v_count := v_count + 1;
          v_delta := v_delta + coalesce((v_choice->>'price_delta')::int, 0);
          v_opts  := v_opts || jsonb_build_array(jsonb_build_object(
            'group_en',  v_group->>'name_en',  'group_bn',  v_group->>'name_bn',
            'choice_en', v_choice->>'name_en', 'choice_bn', v_choice->>'name_bn',
            'price_delta', coalesce((v_choice->>'price_delta')::int, 0)));
        end if;
      end loop;

      if v_is_active then
        if coalesce((v_group->>'required')::boolean, false) and v_count = 0 then
          raise exception 'OPTION_REQUIRED:%', v_group->>'id';
        end if;
        if v_group->>'type' = 'single' and v_count > 1 then
          raise exception 'OPTION_INVALID:%', v_group->>'id';
        end if;
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
