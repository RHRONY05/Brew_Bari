import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import type { Database, Tables } from '@/types/database';

export type Restaurant = Tables<'restaurants'>;
export type Category = Tables<'categories'>;
export type MenuItem = Tables<'menu_items'>;
export type Offer = Tables<'offers'>;

export interface MenuData {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
  offers: Offer[];
}

function getAnonSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function fetchMenuUncached(slug: string): Promise<MenuData | null> {
  const supabase = getAnonSupabaseClient();

  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (restError || !restaurant) {
    return null;
  }

  const [categoriesRes, itemsRes, offersRes] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('offers')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ]);

  const categories = categoriesRes.data ?? [];
  const items = itemsRes.data ?? [];
  const now = new Date().toISOString();
  const offers = (offersRes.data ?? []).filter((offer) => {
    if (offer.starts_at && offer.starts_at > now) return false;
    if (offer.ends_at && offer.ends_at < now) return false;
    return true;
  });

  return {
    restaurant,
    categories,
    items,
    offers,
  };
}

export async function getMenu(slug: string): Promise<MenuData | null> {
  // First lookup restaurant to get id for tag-based caching
  const initial = await fetchMenuUncached(slug);
  if (!initial) {
    return null;
  }

  const cachedFetch = unstable_cache(
    async () => fetchMenuUncached(slug),
    [`menu-data-${slug}`],
    {
      revalidate: 60,
      tags: [`menu:${initial.restaurant.id}`, `menu-slug:${slug}`, `menu-data-${slug}`],
    }
  );

  return cachedFetch();
}
