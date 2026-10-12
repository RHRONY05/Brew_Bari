'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import QRCode from 'qrcode';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

type TableRow = Database['public']['Tables']['tables']['Row'];

interface TableWithQr extends TableRow {
  qrDataUrl: string;
}

export default function PrintTableCardsPage() {
  const searchParams = useSearchParams();
  const showTest = searchParams.get('showTest') === '1';

  const [loading, setLoading] = useState(true);
  const [tablesWithQr, setTablesWithQr] = useState<TableWithQr[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: staffMember } = await supabase
        .from('staff')
        .select('restaurant_id')
        .eq('user_id', user.id)
        .single();

      if (!staffMember) return;
      const rid = staffMember.restaurant_id;

      const { data: tablesData } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', rid)
        .eq('is_active', true)
        .order('number', { ascending: true });

      if (!tablesData) return;

      const filtered = tablesData.filter((t) => showTest || t.number !== 99);
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

      const withQr: TableWithQr[] = await Promise.all(
        filtered.map(async (t) => {
          const url = `${origin}/t/${t.qr_token}`;
          const qrDataUrl = await QRCode.toDataURL(url, {
            width: 260,
            margin: 1,
            color: {
              dark: '#24170F',
              light: '#FFFFFF',
            },
          });
          return {
            ...t,
            qrDataUrl,
          };
        })
      );

      setTablesWithQr(withQr);
      setLoading(false);
    }

    load();
  }, [showTest]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-muted" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-line-soft print:bg-white text-ink p-4 print:p-0">
      {/* Screen action bar (hidden during print) */}
      <div className="max-w-[210mm] mx-auto mb-4 bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/staff/admin/tables"
            className="h-10 px-4 rounded-full border border-line text-ink text-[13px] font-bold flex items-center gap-1.5 hover:bg-bg"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to tables
          </Link>
          <span className="text-[14px] font-bold text-ink-2">
            {tablesWithQr.length} printable cards ready
          </span>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="h-10 px-5 rounded-full bg-accent text-ink text-[14px] font-extrabold flex items-center gap-2 shadow-xs hover:bg-accent-strong"
        >
          <Printer className="w-4 h-4" />
          Print cards (A4)
        </button>
      </div>

      {/* A4 Printable Sheet (2 columns x 3 rows grid) */}
      <div
        data-testid="print-sheet-container"
        className="max-w-[210mm] mx-auto grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 print:gap-6 bg-white p-6 print:p-8 rounded-2xl print:rounded-none shadow-md print:shadow-none"
      >
        {tablesWithQr.map((table) => (
          <div
            key={table.id}
            data-testid={`qr-card-${table.number}`}
            className="border-2 border-brand rounded-3xl p-5 flex flex-col items-center text-center gap-2.5 bg-surface-subtle print:break-inside-avoid shadow-xs print:shadow-none"
          >
            {/* Header */}
            <div className="flex items-center gap-2">
              <img
                src="/images/brand/concept-1.png"
                alt="Brew Bari Logo"
                className="w-7 h-7 object-contain shrink-0"
              />
              <span className="text-[16px] font-extrabold tracking-tight text-ink">
                Brew Bari
              </span>
            </div>

            {/* Table Number */}
            <div className="text-[26px] font-extrabold text-ink leading-tight mt-1">
              {table.label || `Table ${table.number}`}
            </div>

            {/* QR Code image */}
            <div className="p-3 bg-white border border-line rounded-2xl shadow-2xs my-1">
              <img
                src={table.qrDataUrl}
                alt={`Table ${table.number} QR code`}
                className="w-36 h-36"
              />
            </div>

            {/* Bilingual instructions */}
            <div className="text-[13px] font-bold text-ink leading-tight">
              Scan to order &amp; call waiter
            </div>
            <div className="text-[12px] font-semibold text-ink-2 leading-tight">
              অর্ডার করতে ও ওয়েটার ডাকতে স্ক্যান করুন
            </div>

            {/* Wi-Fi footer */}
            <div className="mt-2 pt-2 border-t border-line w-full text-[11px] text-ink-3 font-medium flex justify-between px-2">
              <span>Wi-Fi: BrewBari_Guest</span>
              <span>Pass: Coffee2026</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
