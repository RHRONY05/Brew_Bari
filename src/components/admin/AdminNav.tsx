'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UtensilsCrossed, Tag, QrCode, Settings, MessageSquareQuote, ArrowRight, LayoutDashboard } from 'lucide-react';
import { LanguageToggle } from '@/components/menu/LanguageToggle';
import { useStaffRestaurant } from '@/components/staff/StaffRestaurantContext';
import { pick } from '@/lib/i18n';
import { menuPath } from '@/lib/site-urls';

const ADMIN_LINKS = [
  { href: '/staff/admin/menu', labelEn: 'Menu', labelBn: 'মেন্যু', icon: UtensilsCrossed },
  { href: '/staff/admin/offers', labelEn: 'Offers', labelBn: 'অফার', icon: Tag },
  { href: '/staff/admin/tables', labelEn: 'Tables & QR', labelBn: 'টেবিল ও কিউআর', icon: QrCode },
  { href: '/staff/admin/settings', labelEn: 'Settings', labelBn: 'সেটিংস', icon: Settings },
  { href: '/staff/admin/feedback', labelEn: 'Feedback', labelBn: 'মতামত', icon: MessageSquareQuote },
];

function getCookieLocale(): 'en' | 'bn' {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|; )lang=([a-z]{2})/);
    if (match && (match[1] === 'en' || match[1] === 'bn')) {
      return match[1] as 'en' | 'bn';
    }
  }
  return 'en';
}

export function AdminNav() {
  const pathname = usePathname();
  const { restaurant, logo } = useStaffRestaurant();
  const [locale, setLocale] = useState<'en' | 'bn'>('en');

  useEffect(() => {
    setLocale(getCookieLocale());
  }, [pathname]);

  const handleLocaleChange = (newLocale: 'en' | 'bn') => {
    setLocale(newLocale);
  };

  const isBn = locale === 'bn';
  const restaurantName = pick(restaurant, 'name', locale);

  return (
    <>
      {/* Mobile Top Header + Tabs (< 1024px) */}
      <header className="lg:hidden bg-white border-b border-line sticky top-0 z-30">
        <div className="px-4 pt-4 pb-2.5 flex items-center gap-2.5">
          <div className="relative w-9 h-9 shrink-0">
            <Image
              src={logo}
              alt={`${restaurant.name_en} logo`}
              width={36}
              height={36}
              className="w-9 h-9 object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-heading text-[16px] font-extrabold text-ink leading-tight">
              {restaurantName}
            </div>
            <div className="text-[11.5px] text-ink-2 font-semibold leading-tight">
              {isBn ? 'অ্যাডমিন' : 'Admin'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle size="sm" locale={locale} onLocaleChange={handleLocaleChange} />
            <Link
              href="/staff/counter"
              className="h-[34px] px-3 rounded-full border border-line text-ink text-[12px] font-bold flex items-center gap-1.5 hover:bg-bg active:scale-97 transition-all"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-brand-muted" />
              {isBn ? 'কাউন্টার' : 'Counter'}
            </Link>
          </div>
        </div>
        <nav
          aria-label="Admin Mobile Navigation"
          className="flex gap-1 px-3 pb-2.5 overflow-x-auto scrollbar-none"
        >
          {ADMIN_LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`h-9 px-3 rounded-full text-[13.5px] font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                  isActive
                    ? 'bg-ink text-bg'
                    : 'text-ink-2 hover:bg-surface-2/60'
                }`}
              >
                {isBn ? link.labelBn : link.labelEn}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Desktop Sidebar (>= 1024px) - Pinned to screen, no scroll needed */}
      <aside className="hidden lg:flex flex-col w-[240px] shrink-0 bg-white border-r border-line p-4 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-2.5 px-2 pb-5 mb-2 border-b border-line/60">
          <div className="relative w-9 h-9 shrink-0">
            <Image
              src={logo}
              alt={`${restaurant.name_en} logo`}
              width={36}
              height={36}
              className="w-9 h-9 object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-heading text-[15px] font-extrabold text-ink leading-tight">
              {restaurantName}
            </div>
            <div className="text-[11.5px] text-ink-2 font-semibold leading-tight">
              {isBn ? 'অ্যাডমিন কনসোল' : 'Admin Console'}
            </div>
          </div>
        </div>

        <nav aria-label="Admin Desktop Navigation" className="flex flex-col gap-1 flex-1">
          {ADMIN_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 h-11 px-3.5 rounded-xl text-[14px] font-bold transition-all ${
                  isActive
                    ? 'bg-surface-2 text-ink font-extrabold shadow-2xs'
                    : 'text-ink-2 hover:bg-bg hover:text-ink'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-muted' : 'text-ink-3'}`} />
                {isBn ? link.labelBn : link.labelEn}
              </Link>
            );
          })}

          <div className="h-px bg-line my-2" />

          {/* Language Toggle right with regular items */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-2/40 border border-line/50 my-0.5">
            <span className="text-[12.5px] font-bold text-ink-2">
              {isBn ? 'ভাষা' : 'Language'}
            </span>
            <LanguageToggle size="sm" locale={locale} onLocaleChange={handleLocaleChange} />
          </div>

          <div className="h-px bg-line my-2" />

          <Link
            href="/staff/counter"
            className="flex items-center gap-2.5 h-11 px-3.5 rounded-xl text-[14px] font-bold text-ink-2 hover:bg-bg hover:text-ink transition-all"
          >
            <LayoutDashboard className="w-4 h-4 text-brand-muted" />
            {isBn ? 'কাউন্টার বোর্ড' : 'Counter board'}
          </Link>

          <Link
            href={menuPath(restaurant.slug)}
            target="_blank"
            className="flex items-center gap-2.5 h-11 px-3.5 rounded-xl text-[14px] font-bold text-ink-2 hover:bg-bg hover:text-ink transition-all"
          >
            <ArrowRight className="w-4 h-4 text-brand-muted" />
            {isBn ? 'গেস্ট মেন্যু দেখুন' : 'View guest menu'}
          </Link>
        </nav>
      </aside>
    </>
  );
}
