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
        <Loader2 className="w-8 h-8 animate-spin text-[#8A5A37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6E9DA] print:bg-white text-[#24170F] p-4 print:p-0">
      {/* Screen action bar (hidden during print) */}
      <div className="max-w-[210mm] mx-auto mb-4 bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/staff/admin/tables"
            className="h-10 px-4 rounded-full border border-[#F0DFCB] text-[#24170F] text-[13px] font-bold flex items-center gap-1.5 hover:bg-[#FFF7EE]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to tables
          </Link>
          <span className="text-[14px] font-bold text-[#6F5A4B]">
            {tablesWithQr.length} printable cards ready
          </span>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="h-10 px-5 rounded-full bg-[#F2C27D] text-[#24170F] text-[14px] font-extrabold flex items-center gap-2 shadow-xs hover:bg-[#e0b06c]"
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
            className="border-2 border-[#6B4226] rounded-3xl p-5 flex flex-col items-center text-center gap-2.5 bg-[#FFFBF7] print:break-inside-avoid shadow-xs print:shadow-none"
          >
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#6B4226] text-[#F2C27D] font-extrabold text-[11px] flex items-center justify-center">
                BB
              </div>
              <span className="text-[16px] font-extrabold tracking-tight text-[#24170F]">
                Brew Bari
              </span>
            </div>

            {/* Table Number */}
            <div className="text-[26px] font-extrabold text-[#24170F] leading-tight mt-1">
              {table.label || `Table ${table.number}`}
            </div>

            {/* QR Code image */}
            <div className="p-3 bg-white border border-[#F0DFCB] rounded-2xl shadow-2xs my-1">
              <img
                src={table.qrDataUrl}
                alt={`Table ${table.number} QR code`}
                className="w-36 h-36"
              />
            </div>

            {/* Bilingual instructions */}
            <div className="text-[13px] font-bold text-[#24170F] leading-tight">
              Scan to order &amp; call waiter
            </div>
            <div className="text-[12px] font-semibold text-[#6F5A4B] leading-tight">
              অর্ডার করতে ও ওয়েটার ডাকতে স্ক্যান করুন
            </div>

            {/* Wi-Fi footer */}
            <div className="mt-2 pt-2 border-t border-[#F0DFCB] w-full text-[11px] text-[#8C7767] font-medium flex justify-between px-2">
              <span>Wi-Fi: BrewBari_Guest</span>
              <span>Pass: Coffee2026</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
