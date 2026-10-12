'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UtensilsCrossed, Tag, QrCode, Settings, MessageSquareQuote, ArrowRight, LayoutDashboard } from 'lucide-react';

const ADMIN_LINKS = [
  { href: '/staff/admin/menu', label: 'Menu', mobileLabel: 'Menu', icon: UtensilsCrossed },
  { href: '/staff/admin/offers', label: 'Offers', mobileLabel: 'Offers', icon: Tag },
  { href: '/staff/admin/tables', label: 'Tables & QR', mobileLabel: 'Tables', icon: QrCode },
  { href: '/staff/admin/settings', label: 'Settings', mobileLabel: 'Settings', icon: Settings },
  { href: '/staff/admin/feedback', label: 'Feedback', mobileLabel: 'Feedback', icon: MessageSquareQuote },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Top Header + Tabs (< 1024px) */}
      <header className="lg:hidden bg-white border-b border-[#F0DFCB] sticky top-0 z-30">
        <div className="px-4 pt-4 pb-2.5 flex items-center gap-2.5">
          <div className="w-[38px] h-[38px] rounded-full bg-[#6B4226] text-[#F2C27D] flex items-center justify-center font-extrabold text-[13px] shrink-0">
            BB
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-extrabold text-[#24170F] leading-tight">Brew Bari</div>
            <div className="text-[11.5px] text-[#6F5A4B] font-semibold leading-tight">Admin</div>
          </div>
          <Link
            href="/staff/counter"
            className="h-[38px] px-3.5 rounded-full border border-[#F0DFCB] text-[#24170F] text-[13px] font-bold flex items-center gap-1.5 hover:bg-[#FFF7EE] active:scale-97 transition-all"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[#8A5A37]" />
            Counter
          </Link>
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
                    ? 'bg-[#24170F] text-[#FFF7EE]'
                    : 'text-[#6F5A4B] hover:bg-[#FBEBD7]/60'
                }`}
              >
                {link.mobileLabel}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Desktop Sidebar (>= 1024px) */}
      <aside className="hidden lg:flex flex-col w-[240px] shrink-0 bg-white border-r border-[#F0DFCB] p-4 min-h-screen">
        <div className="flex items-center gap-2.5 px-2 pb-5 mb-2 border-b border-[#F0DFCB]/60">
          <div className="w-[38px] h-[38px] rounded-full bg-[#6B4226] text-[#F2C27D] flex items-center justify-center font-extrabold text-[13px] shrink-0 shadow-2xs">
            BB
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-extrabold text-[#24170F] leading-tight">Brew Bari</div>
            <div className="text-[11.5px] text-[#6F5A4B] font-semibold leading-tight">Admin Console</div>
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
                    ? 'bg-[#FBEBD7] text-[#24170F] font-extrabold shadow-2xs'
                    : 'text-[#6F5A4B] hover:bg-[#FFF7EE] hover:text-[#24170F]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#8A5A37]' : 'text-[#8C7767]'}`} />
                {link.label}
              </Link>
            );
          })}

          <div className="h-px bg-[#F0DFCB] my-3" />

          <Link
            href="/staff/counter"
            className="flex items-center gap-2.5 h-11 px-3.5 rounded-xl text-[14px] font-bold text-[#6F5A4B] hover:bg-[#FFF7EE] hover:text-[#24170F] transition-all"
          >
            <LayoutDashboard className="w-4 h-4 text-[#8A5A37]" />
            Counter board
          </Link>

          <Link
            href="/m/brew-bari"
            target="_blank"
            className="flex items-center gap-2.5 h-11 px-3.5 rounded-xl text-[14px] font-bold text-[#6F5A4B] hover:bg-[#FFF7EE] hover:text-[#24170F] transition-all"
          >
            <ArrowRight className="w-4 h-4 text-[#8A5A37]" />
            View guest menu
          </Link>
        </nav>
      </aside>
    </>
  );
}
