'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  Coffee,
  QrCode,
  LayoutDashboard,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Printer,
  Sparkles,
  Layers,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface TableInfo {
  number: number;
  qr_token: string;
  label?: string | null;
}

const PACKAGES = [
  {
    code: 'P1',
    level: 1,
    name: 'Digital Menu',
    desc: 'Browse menu, prices, photos, Bangla toggle & Wi-Fi',
  },
  {
    code: 'P2',
    level: 2,
    name: 'Table Service',
    desc: 'QR per table, guest list & live Call Waiter chime',
  },
  {
    code: 'P3',
    level: 3,
    name: 'Full Ordering',
    desc: 'Place orders, live progress, bill with VAT & Google reviews',
  },
];

export default function DemoLauncherPage() {
  const [currentPackage, setCurrentPackage] = useState<number>(3);
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = getSupabaseBrowserClient();

      // Check current user role
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: staffMember } = await supabase
          .from('staff')
          .select('role')
          .eq('user_id', user.id)
          .single();
        if (staffMember?.role === 'admin') {
          setIsAdmin(true);
        }
      }

      // Fetch restaurant settings
      const { data: rest } = await supabase
        .from('restaurants')
        .select('id, package')
        .eq('slug', 'brew-bari')
        .single();

      if (rest) {
        setRestaurantId(rest.id);
        setCurrentPackage(Number(rest.package || 3));
      }

      // Fetch sample tables (1, 2, 3, 99)
      const { data: tablesData } = await supabase
        .from('tables')
        .select('number, qr_token, label')
        .in('number', [1, 2, 3, 99])
        .order('number');

      if (tablesData) {
        setTables(tablesData);
      }
      setLoading(false);
    }

    loadData();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSwitchPackage = async (level: number) => {
    if (!isAdmin) {
      alert('Package switching requires Admin login. Please log in as Admin below to switch packages.');
      return;
    }

    try {
      setSwitching(true);
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from('restaurants')
        .update({ package: level, updated_at: new Date().toISOString() })
        .eq('id', restaurantId);

      if (error) throw error;
      setCurrentPackage(level);
    } catch (err: any) {
      alert(err.message || 'Failed to switch package');
    } finally {
      setSwitching(false);
    }
  };

  // Find token helper
  const getTableUrl = (num: number) => {
    const t = tables.find((item) => item.number === num);
    return t ? `/t/${t.qr_token}` : num === 99 ? '/t/test-table-99' : '/m/brew-bari';
  };

  return (
    <div className="min-h-screen bg-[#FFF7EE] text-[#24170F] flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        {/* Header */}
        <header className="text-center pt-2 pb-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBEBD7] border border-[#F0DFCB] text-xs font-bold text-[#8A5A37] mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            Brew Bari Sales Pitch & Demo Launcher
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#24170F]">
            Brew Bari <span className="text-[#8A5A37] font-semibold text-2xl sm:text-3xl">(ব্রিউ বাড়ি)</span>
          </h1>
          <p className="text-sm text-[#6F5A4B] mt-1.5 max-w-md mx-auto">
            Bilingual QR ordering & counter system for Chattogram cafés. Tap any screen below to demo live in front of a café owner.
          </p>
        </header>

        {/* Package Switcher Section (US-50 & US-44) */}
        <section
          aria-label="Package Switcher"
          className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_6px_20px_rgba(107,66,38,0.06)] border border-[#F0DFCB]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#8A5A37]" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#6F5A4B]">
                Active Package Tier
              </h2>
            </div>
            {switching && <Loader2 className="w-4 h-4 animate-spin text-[#8A5A37]" />}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {PACKAGES.map((pkg) => {
              const isActive = currentPackage === pkg.level;
              return (
                <button
                  key={pkg.code}
                  type="button"
                  data-testid={`demo-package-${pkg.code.toLowerCase()}`}
                  onClick={() => handleSwitchPackage(pkg.level)}
                  className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isActive
                      ? 'border-[#6B4226] bg-[#FFF7EE] shadow-xs ring-2 ring-[#6B4226]/10'
                      : 'border-[#F0DFCB]/80 bg-white hover:bg-[#FFFBF7]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#8A5A37]">{pkg.code}</span>
                    {isActive && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#6B4226] text-[#FFF7EE]">
                        Live
                      </span>
                    )}
                  </div>
                  <div className="mt-1">
                    <div className="text-xs font-bold text-[#24170F]">{pkg.name}</div>
                    <div className="text-[11px] text-[#8C7767] leading-tight mt-0.5">{pkg.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
          {!isAdmin && (
            <p className="text-[11px] text-[#8C7767] mt-2.5 italic">
              * Note: Fast package switching is instant when logged in as Admin.
            </p>
          )}
        </section>

        {/* Customer Screens */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_6px_20px_rgba(107,66,38,0.06)] border border-[#F0DFCB] space-y-3">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-[#8A5A37]" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#6F5A4B]">
              Customer Experiences (Phone)
            </h2>
          </div>

          <Link
            href="/m/brew-bari"
            target="_blank"
            data-testid="launcher-menu-link"
            className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFF7EE] border border-[#F0DFCB]/80 hover:bg-[#FBEBD7]/50 active:scale-99 transition-all group"
          >
            <div>
              <div className="text-sm font-extrabold text-[#24170F] group-hover:text-[#6B4226] flex items-center gap-1.5">
                Guest Menu (/m/brew-bari)
                <ExternalLink className="w-3.5 h-3.5 text-[#8A5A37] opacity-60" />
              </div>
              <p className="text-xs text-[#6F5A4B] mt-0.5">
                Public digital menu, 28 items, Quick items, EN/বাং toggle, and Wi-Fi password.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#8A5A37] group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>

          {/* Sample Table QR Links */}
          <div className="pt-1">
            <span className="text-xs font-bold text-[#6F5A4B] block mb-2">
              Scan / Open Sample Tables as Guest:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Link
                href={getTableUrl(1)}
                target="_blank"
                data-testid="launcher-table-1"
                className="p-2.5 rounded-xl bg-white border border-[#F0DFCB] hover:border-[#6B4226] text-center transition-all hover:shadow-xs group"
              >
                <div className="text-xs font-extrabold text-[#24170F] group-hover:text-[#6B4226]">
                  Table 1
                </div>
                <div className="text-[10px] text-[#8C7767]">Sales Pitch</div>
              </Link>

              <Link
                href={getTableUrl(2)}
                target="_blank"
                data-testid="launcher-table-2"
                className="p-2.5 rounded-xl bg-white border border-[#F0DFCB] hover:border-[#6B4226] text-center transition-all hover:shadow-xs group"
              >
                <div className="text-xs font-extrabold text-[#24170F] group-hover:text-[#6B4226]">
                  Table 2
                </div>
                <div className="text-[10px] text-[#8C7767]">Outdoor</div>
              </Link>

              <Link
                href={getTableUrl(3)}
                target="_blank"
                data-testid="launcher-table-3"
                className="p-2.5 rounded-xl bg-white border border-[#F0DFCB] hover:border-[#6B4226] text-center transition-all hover:shadow-xs group"
              >
                <div className="text-xs font-extrabold text-[#24170F] group-hover:text-[#6B4226]">
                  Table 3
                </div>
                <div className="text-[10px] text-[#8C7767]">Window</div>
              </Link>

              <Link
                href={getTableUrl(99)}
                target="_blank"
                data-testid="launcher-table-99"
                className="p-2.5 rounded-xl bg-[#FFF7EE] border border-[#E3A651] text-center transition-all hover:shadow-xs group"
              >
                <div className="text-xs font-extrabold text-[#8A5A37]">
                  Table 99
                </div>
                <div className="text-[10px] text-[#6F5A4B]">Automated Test</div>
              </Link>
            </div>
          </div>
        </section>

        {/* Staff Experiences */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_6px_20px_rgba(107,66,38,0.06)] border border-[#F0DFCB] space-y-3">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-[#8A5A37]" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#6F5A4B]">
              Staff & Counter Operations
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/staff/counter"
              target="_blank"
              data-testid="launcher-counter-link"
              className="p-3.5 rounded-xl bg-[#FFF7EE] border border-[#F0DFCB]/80 hover:bg-[#FBEBD7]/50 active:scale-99 transition-all group block"
            >
              <div className="text-sm font-extrabold text-[#24170F] group-hover:text-[#6B4226] flex items-center justify-between">
                <span>Counter Board</span>
                <ChevronRight className="w-4 h-4 text-[#8A5A37] group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-[#6F5A4B] mt-1">
                Live table tiles, order feed, chime audio & table bill drawer.
              </p>
            </Link>

            <Link
              href="/staff/admin"
              target="_blank"
              data-testid="launcher-admin-link"
              className="p-3.5 rounded-xl bg-[#FFF7EE] border border-[#F0DFCB]/80 hover:bg-[#FBEBD7]/50 active:scale-99 transition-all group block"
            >
              <div className="text-sm font-extrabold text-[#24170F] group-hover:text-[#6B4226] flex items-center justify-between">
                <span>Admin Console</span>
                <ChevronRight className="w-4 h-4 text-[#8A5A37] group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-[#6F5A4B] mt-1">
                Menu editor, instant sold-out, offers, settings & private feedback.
              </p>
            </Link>
          </div>

          <Link
            href="/staff/admin/tables/print?showTest=1"
            target="_blank"
            className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#F0DFCB] hover:bg-[#FFF7EE] text-xs font-bold text-[#6F5A4B] transition-all"
          >
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-[#8A5A37]" />
              <span>Printable Table QR Cards (A4 2×3 Sheet)</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#8A5A37]" />
          </Link>
        </section>

        {/* Demo Credentials Quick-Copy Pills */}
        <section className="bg-[#FFFBF7] rounded-2xl p-4 border border-[#F0DFCB]/60">
          <div className="text-xs font-extrabold uppercase tracking-wider text-[#6F5A4B] mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#8A5A37]" />
            Demo Staff Credentials
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#F0DFCB]">
              <div>
                <span className="font-bold text-[#24170F] block">Admin Account</span>
                <span className="text-[11px] text-[#6F5A4B]">admin@brewbari.com</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('admin@brewbari.com\nBrewBari#Admin2026!', 'admin')}
                className="px-2 py-1 rounded bg-[#FFF7EE] border border-[#F0DFCB] hover:bg-[#FBEBD7] flex items-center gap-1 font-semibold text-[11px] text-[#8A5A37] transition-all"
              >
                {copiedKey === 'admin' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedKey === 'admin' ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#F0DFCB]">
              <div>
                <span className="font-bold text-[#24170F] block">Counter Account</span>
                <span className="text-[11px] text-[#6F5A4B]">counter@brewbari.com</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('counter@brewbari.com\nBrewBari#Counter2026!', 'counter')}
                className="px-2 py-1 rounded bg-[#FFF7EE] border border-[#F0DFCB] hover:bg-[#FBEBD7] flex items-center gap-1 font-semibold text-[11px] text-[#8A5A37] transition-all"
              >
                {copiedKey === 'counter' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedKey === 'counter' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-[#8C7767] pt-6 pb-2">
        Brew Bari · Built for Chattogram coffee shops · EN / বাংলা
      </footer>
    </div>
  );
}
