import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { ArrowRight, LayoutDashboard, QrCode, BellRing, Languages, Sparkles, ExternalLink } from 'lucide-react';
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
    return <p className="text-sm text-ink-2">No restaurants currently listed.</p>;
  }

  const BADGES: Record<string, { label: string; accent: string }> = {
    'brew-bari': { label: '☕ Café & Bakery', accent: 'bg-[#5C382A]/10 text-[#5C382A] border-[#5C382A]/20' },
    'grill-ghar': { label: '🍔 Fast Food & Grill', accent: 'bg-[#D2291C]/10 text-[#D2291C] border-[#D2291C]/20' },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {restaurants.map((r) => {
        const theme = getTheme(r.theme_key);
        const badge = BADGES[r.slug] || { label: '🍽️ Restaurant', accent: 'bg-brand/10 text-brand border-brand/20' };
        const logoSrc = r.logo_url || theme.assets.logo;

        return (
          <Link
            key={r.slug}
            href={menuPath(r.slug)}
            data-testid={`restaurant-card-${r.slug}`}
            className="group relative flex flex-col justify-between p-5 rounded-2xl bg-surface border border-line/80 shadow-[0_4px_16px_rgb(var(--shadow-rgb)/0.06)] hover:shadow-[0_10px_24px_rgb(var(--shadow-rgb)/0.12)] hover:border-brand/60 transition-all active:scale-[0.99] cursor-pointer"
          >
            <div>
              {/* Header: Logo, Name & Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-13 h-13 rounded-2xl bg-surface-subtle border border-line/80 p-2 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform overflow-hidden">
                    <Image
                      src={logoSrc}
                      alt={`${r.name_en} logo`}
                      width={48}
                      height={48}
                      className="w-11 h-11 object-contain"
                      unoptimized
                      priority
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-heading text-[18px] font-extrabold text-ink leading-tight">
                        {r.name_en}
                      </h3>
                      {r.name_bn && (
                        <span className="font-bengali text-ink-2 font-bold text-[14px]">
                          · {r.name_bn}
                        </span>
                      )}
                    </div>
                    {r.tagline_en && (
                      <p className="text-[12.5px] text-ink-2 truncate mt-0.5 font-medium">
                        {r.tagline_en}
                      </p>
                    )}
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${badge.accent}`}>
                  {badge.label}
                </span>
              </div>
            </div>

            {/* Bottom URL & CTA */}
            <div className="mt-5 pt-3.5 border-t border-line/60 flex items-center justify-between gap-2">
              <span className="text-[12px] font-mono text-ink-3 font-semibold">
                {menuPath(r.slug)}
              </span>
              <span className="text-[13px] font-bold text-brand flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>View Menu</span>
                <ArrowRight className="w-4 h-4 stroke-[2.2]" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

const FEATURES = [
  {
    icon: QrCode,
    title: 'Scan, no app',
    text: 'Guests scan the table QR code and the full menu opens in their mobile browser instantly.',
  },
  {
    icon: BellRing,
    title: 'Order & call waiter',
    text: 'Orders, waiter requests and bill calls reach the kitchen & counter live with sound alerts.',
  },
  {
    icon: Languages,
    title: 'English & বাংলা',
    text: 'Full bilingual experience with authentic local fonts, translations, and taka (৳) pricing.',
  },
];

export default function PlatformHomePage() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col selection:bg-accent selection:text-ink">
      <ThemeStyle theme={PLATFORM_THEME} />

      {/* Top Navbar */}
      <nav aria-label="Main Navigation" className="w-full border-b border-line/70 bg-surface/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Image
              src={PLATFORM_THEME.assets.logo}
              alt="Menuwala"
              width={36}
              height={36}
              className="w-9 h-9 object-contain"
              unoptimized
              priority
            />
            <div className="flex items-center gap-2">
              <span className="font-heading text-[20px] font-extrabold tracking-tight text-ink">
                Menuwala
              </span>
              <span className="hidden sm:inline-block text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-surface-2 text-ink-2 border border-line">
                Multi-Restaurant OS
              </span>
            </div>
          </div>

          <Link
            href="/staff/login"
            className="h-9 px-3.5 rounded-full border border-line bg-surface text-ink text-[12.5px] font-bold flex items-center gap-1.5 hover:bg-bg hover:border-brand/40 active:scale-97 transition-all shadow-2xs"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-brand" />
            <span>Staff Portal</span>
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-10 sm:gap-12 flex-1">
        
        {/* Hero Section */}
        <header className="flex flex-col items-start gap-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-ink text-[12px] font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-accent-strong fill-current" />
            <span>Smart QR Dining Experience</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.15] text-ink max-w-2xl">
            QR menus, table service and ordering for restaurants.
          </h1>

          <p className="text-[15px] sm:text-[17px] text-ink-2 leading-relaxed max-w-2xl font-medium">
            One platform, every restaurant with its own look. Open a live demo below.
          </p>
        </header>

        {/* Live Demos Section */}
        <section aria-labelledby="demos-heading" className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h2 id="demos-heading" className="text-[13px] font-extrabold uppercase tracking-wider text-ink-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              <span>Live Restaurant Demos</span>
            </h2>
            <span className="text-[12px] text-ink-3 font-semibold">
              Select a venue to test
            </span>
          </div>

          <Suspense fallback={<div className="h-32 rounded-2xl bg-surface-2 animate-pulse" />}>
            <RestaurantList />
          </Suspense>
        </section>

        {/* Platform Capabilities (3 Pillars) */}
        <section aria-label="Features" className="flex flex-col gap-3.5 pt-2">
          <h2 className="text-[13px] font-extrabold uppercase tracking-wider text-ink-3">
            Core Platform Capabilities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-5 rounded-2xl bg-surface border border-line/80 shadow-[0_4px_16px_rgb(var(--shadow-rgb)/0.04)] flex flex-col gap-2.5"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-2 border border-line flex items-center justify-center text-brand shrink-0">
                  <f.icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="font-heading font-extrabold text-[16px] text-ink">
                  {f.title}
                </div>
                <p className="text-[13px] text-ink-2 leading-relaxed">
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Restaurant Staff & Admin Card */}
        <section className="p-5 sm:p-6 rounded-2xl bg-brand text-brand-ink shadow-[0_8px_24px_rgba(var(--shadow-rgb,31_77_58)/0.18)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-accent text-accent-ink flex items-center justify-center shrink-0 shadow-xs">
              <LayoutDashboard className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="font-heading text-[17px] sm:text-[18px] font-extrabold leading-tight text-brand-ink">
                Restaurant staff
              </div>
              <p className="text-[13px] text-brand-ink/80 leading-snug mt-0.5">
                Counter board and admin panel for your restaurant.
              </p>
            </div>
          </div>

          <Link
            href="/staff/login"
            data-testid="staff-login-link"
            className="h-11 px-6 rounded-full bg-accent text-accent-ink font-extrabold text-[14px] flex items-center gap-2 hover:bg-accent-strong active:scale-97 transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <span>Staff login</span>
            <ArrowRight className="w-4 h-4 stroke-[2.4]" />
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-line/60 py-6 text-center text-[12px] text-ink-3 font-medium">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Menuwala — The Smart Restaurant Operating System</span>
          <span>Dual-Theme Architecture: Café &amp; Fast Food</span>
        </div>
      </footer>
    </div>
  );
}
