-- Multi-restaurant platform (Menuwala).
-- Adds per-restaurant theme / package lock / listing / custom domain, reserves slugs
-- that collide with app routes, protects platform-managed columns from restaurant
-- admins, and adds a read-only RPC that maps a table QR token to its restaurant slug.

alter table public.restaurants
  add column theme_key      text    not null default 'brew-bari' check (theme_key ~ '^[a-z0-9-]{2,40}$'),
  add column package_locked boolean not null default false,
  add column is_listed      boolean not null default true,
  add column custom_domain  text unique check (custom_domain is null or custom_domain ~ '^[a-z0-9.-]{3,253}$');

comment on column public.restaurants.theme_key      is 'Key of the theme in src/themes (colours, fonts, layout variants). Platform-managed.';
comment on column public.restaurants.package_locked is 'true = package is fixed by the platform; restaurant admins cannot change it and the package picker is hidden.';
comment on column public.restaurants.is_listed      is 'true = shown on the platform home page.';
comment on column public.restaurants.custom_domain  is 'Optional own domain (e.g. grillghar.com) mapped to this restaurant. Platform-managed.';

-- Slugs live at the URL root (/<slug>), so they must not collide with app routes.
alter table public.restaurants
  add constraint restaurants_slug_not_reserved check (slug not in (
    'staff', 'api', 'm', 't', 'admin', 'login', 'logout', 'auth', 'platform', 'demo', 'dev',
    'static', 'public', 'images', 'fonts', 'sounds', 'new', 'signup', 'pricing', 'about',
    'contact', 'help', 'support', 'terms', 'privacy'
  ));

-- Restaurant admins may edit their own restaurant row (RLS restaurants_admin_update),
-- but these columns belong to the platform. Only the service role / SQL editor
-- (auth.uid() is null) may change them.
create or replace function public.guard_restaurant_admin_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null then
    if new.slug           is distinct from old.slug
    or new.theme_key      is distinct from old.theme_key
    or new.package_locked is distinct from old.package_locked
    or new.is_listed      is distinct from old.is_listed
    or new.custom_domain  is distinct from old.custom_domain
    or (old.package_locked and new.package is distinct from old.package) then
      raise exception 'PLATFORM_MANAGED_FIELD';
    end if;
  end if;
  return new;
end $$;

create trigger trg_restaurants_guard before update on public.restaurants
  for each row execute function public.guard_restaurant_admin_update();

-- Old table QR links were /t/<token>; new ones are /<slug>/t/<token>.
-- The proxy uses this to redirect old links. Read-only, no session side effects.
create or replace function public.resolve_table_slug(p_token text)
returns text language sql stable security definer set search_path = public as $$
  select r.slug
  from public.tables t
  join public.restaurants r on r.id = t.restaurant_id
  where t.qr_token = p_token and t.is_active
$$;

revoke execute on function public.resolve_table_slug(text) from public, anon, authenticated;
grant execute on function public.resolve_table_slug(text) to anon, authenticated;
revoke execute on function public.guard_restaurant_admin_update() from public, anon, authenticated;
