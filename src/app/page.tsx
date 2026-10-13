import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { ArrowRight, LayoutDashboard, QrCode, BellRing, Languages } from 'lucide-react';
import type { Database } from '@/types/database';
import { getTheme, PLATFORM_THEME } from '@/themes';
import { ThemeStyle } from '@/themes/ThemeStyle';
import { menuPath } from '@/lib/site-urls';

async function listRestaurants() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data } = await supabase
    .from('restaurants')
    .select('slug, name_en, name_bn, tagline_en, logo_url, theme_key')
    .eq('is_listed', true)
    .order('created_at', { ascending: true });
  return data ?? [];
}

async function RestaurantList() {
  const restaurants = await listRestaurants();
  if (restaurants.length === 0) {
    return <p className="text-sm text-ink-2">No restaurants yet.</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {restaurants.map((r) => {
        const theme = getTheme(r.theme_key);
        return (
          <Link
            key={r.slug}
            href={menuPath(r.slug)}
            data-testid={`restaurant-card-${r.slug}`}
            className="group flex items-center gap-3.5 p-4 rounded-2xl bg-surface border border-line shadow-[var(--shadow-card)] hover:border-brand transition-colors"
          >
            <Image
              src={r.logo_url || theme.assets.logo}
              alt=""
              width={52}
              height={52}
              className="w-13 h-13 object-contain shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-heading text-[17px] font-extrabold text-ink leading-tight">
                {r.name_en}
                {r.name_bn && <span className="font-bengali text-ink-2 font-semibold"> · {r.name_bn}</span>}
              </div>
              {r.tagline_en && <p className="text-[13px] text-ink-2 truncate">{r.tagline_en}</p>}
              <p className="text-[12px] text-ink-3 mt-0.5">{menuPath(r.slug)}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-brand-muted shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        );
      })}
    </div>
  );
}

const FEATURES = [
  { icon: QrCode, title: 'Scan, no app', text: 'Guests scan the table QR and the menu opens in their browser.' },
  { icon: BellRing, title: 'Order & call waiter', text: 'Orders, waiter calls and bill requests reach the counter live, with sound.' },
  { icon: Languages, title: 'English & বাংলা', text: 'Every menu works in both languages, with prices in ৳.' },
];

export default function PlatformHomePage() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      <ThemeStyle theme={PLATFORM_THEME} />
      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 flex flex-col gap-10">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Image src={PLATFORM_THEME.assets.logo} alt="" width={44} height={44} className="w-11 h-11" priority />
            <span className="font-heading text-2xl font-extrabold tracking-tight">Menuwala</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight max-w-xl">
            QR menus, table service and ordering for restaurants.
          </h1>
          <p className="text-ink-2 max-w-xl">
            One platform, every restaurant with its own look. Open a live demo below.
          </p>
        </header>

        <section aria-labelledby="demos-heading" className="flex flex-col gap-3">
          <h2 id="demos-heading" className="text-sm font-extrabold uppercase tracking-wider text-ink-2">
            Live demos
          </h2>
          <Suspense fallback={<div className="h-24 rounded-2xl bg-surface-2 animate-pulse" />}>
            <RestaurantList />
          </Suspense>
        </section>

        <section aria-label="Features" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="p-4 rounded-2xl bg-surface border border-line">
              <f.icon className="w-5 h-5 text-brand mb-2" />
              <div className="font-bold text-[15px]">{f.title}</div>
              <p className="text-[13px] text-ink-2 leading-snug mt-1">{f.text}</p>
            </div>
          ))}
        </section>

        <section className="p-4 rounded-2xl bg-surface-2 border border-line flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-bold">Restaurant staff</div>
            <p className="text-[13px] text-ink-2">Counter board and admin panel for your restaurant.</p>
          </div>
          <Link
            href="/staff/login"
            data-testid="staff-login-link"
            className="h-11 px-5 rounded-full bg-brand text-brand-ink font-bold text-[14px] flex items-center gap-2 hover:bg-brand-dark transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Staff login
          </Link>
        </section>
      </main>
      <footer className="text-center text-xs text-ink-3 pb-6">Menuwala · Made in Chattogram</footer>
    </div>
  );
}
