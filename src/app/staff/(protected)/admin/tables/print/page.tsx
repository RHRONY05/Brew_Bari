'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import QRCode from 'qrcode';
import { Printer, ArrowLeft, Loader2, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useStaffRestaurant } from '@/components/staff/StaffRestaurantContext';
import { qrBaseUrl, tablePath, tableUrl } from '@/lib/site-urls';
import { readThemeColors } from '@/lib/theme-colors';

type TableRow = Database['public']['Tables']['tables']['Row'];

interface TableWithQr extends TableRow {
  qrDataUrl: string;
}

export default function PrintTableCardsPage() {
  const { restaurant, logo } = useStaffRestaurant();
  const searchParams = useSearchParams();
  const showTest = searchParams.get('showTest') === '1';

  const [loading, setLoading] = useState(true);
  const [tablesWithQr, setTablesWithQr] = useState<TableWithQr[]>([]);
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

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
      const origin = qrBaseUrl();
      const colors = readThemeColors();
      setBaseUrl(origin);

      const withQr: TableWithQr[] = await Promise.all(
        filtered.map(async (t) => {
          const url = tableUrl(origin, restaurant.slug, t.qr_token);
          const qrDataUrl = await QRCode.toDataURL(url, {
            width: 320,
            margin: 1,
            color: {
              dark: colors.ink,
              light: colors.surface,
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
  }, [showTest, restaurant.slug]);

  // Generate and download individual table card PNG
  const handleDownloadCard = useCallback(async (table: TableWithQr) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1050;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const colors = readThemeColors();

      // Card Background
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, 800, 1050);

      // Card Frame
      ctx.strokeStyle = colors.brand;
      ctx.lineWidth = 10;
      ctx.strokeRect(18, 18, 764, 1014);

      // Inner Cream surface
      ctx.fillStyle = colors.paper;
      ctx.fillRect(24, 24, 752, 1002);

      // Brand Title
      ctx.fillStyle = colors.ink;
      ctx.font = 'bold 46px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(restaurant.name_en, 400, 110);

      // Bengali Brand Subtitle
      ctx.fillStyle = colors.brand;
      ctx.font = 'bold 24px system-ui, sans-serif';
      if (restaurant.name_bn) ctx.fillText(restaurant.name_bn, 400, 150);

      // Divider
      ctx.strokeStyle = colors.paperLine;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(120, 180);
      ctx.lineTo(680, 180);
      ctx.stroke();

      // Table Number Title
      ctx.fillStyle = colors.ink;
      ctx.font = 'bold 54px system-ui, sans-serif';
      const title = table.label || `Table ${table.number}`;
      ctx.fillText(title, 400, 255);

      if (table.label && table.label !== `Table ${table.number}`) {
        ctx.fillStyle = colors.paperInk;
        ctx.font = 'bold 24px system-ui, sans-serif';
        ctx.fillText(`Table #${table.number} · ${table.seats} Seats`, 400, 295);
      }

      // Draw QR image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.fillStyle = colors.surface;
          ctx.fillRect(170, 330, 460, 460);
          ctx.strokeStyle = colors.paperLine;
          ctx.lineWidth = 3;
          ctx.strokeRect(170, 330, 460, 460);
          ctx.drawImage(img, 190, 350, 420, 420);
          resolve();
        };
        img.onerror = reject;
        img.src = table.qrDataUrl;
      });

      // Call-to-actions
      ctx.fillStyle = colors.ink;
      ctx.font = 'bold 30px system-ui, sans-serif';
      ctx.fillText('Scan to order & call waiter', 400, 850);

      ctx.fillStyle = colors.brand;
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.fillText('অর্ডার করতে ও ওয়েটার ডাকতে স্ক্যান করুন', 400, 895);

      // Wi-Fi info footer
      if (restaurant.wifi_name) {
        ctx.fillStyle = colors.paperInk;
        ctx.font = '500 20px system-ui, sans-serif';
        ctx.fillText(
          `Wi-Fi: ${restaurant.wifi_name}${restaurant.wifi_password ? `  |  Pass: ${restaurant.wifi_password}` : ''}`,
          400,
          970
        );
      }

      // Download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${restaurant.slug}-table-${table.number}-card.png`;
      a.click();
    } catch {
      // Fallback: download raw QR
      const a = document.createElement('a');
      a.href = table.qrDataUrl;
      a.download = `${restaurant.slug}-table-${table.number}-qr.png`;
      a.click();
    }
  }, [restaurant]);

  const handleDownloadAllCards = async () => {
    setIsDownloadingAll(true);
    for (let i = 0; i < tablesWithQr.length; i++) {
      await handleDownloadCard(tablesWithQr[i]);
      await new Promise((res) => setTimeout(res, 250));
    }
    setIsDownloadingAll(false);
  };

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
      <div className="max-w-[210mm] mx-auto mb-4 bg-white p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/staff/admin/tables"
            className="h-10 px-4 rounded-full border border-line text-ink text-[13px] font-bold flex items-center gap-1.5 hover:bg-bg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to tables
          </Link>
          <span className="text-[13.5px] font-bold text-ink-2">
            {tablesWithQr.length} printable cards ready
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-2 text-brand">
            {baseUrl}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isDownloadingAll}
            onClick={handleDownloadAllCards}
            className="h-10 px-4 rounded-full border border-line bg-white hover:bg-bg text-ink text-[13px] font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDownloadingAll ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand" />
            ) : (
              <Download className="w-4 h-4 text-brand-muted" />
            )}
            Download all PNGs
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="h-10 px-5 rounded-full bg-accent text-ink text-[14px] font-extrabold flex items-center gap-2 shadow-xs hover:bg-accent-strong cursor-pointer transition-all active:scale-98"
          >
            <Printer className="w-4 h-4" />
            Print cards (A4)
          </button>
        </div>
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
            className="border-2 border-brand rounded-3xl p-5 flex flex-col items-center text-center gap-2.5 bg-surface-subtle print:break-inside-avoid shadow-xs print:shadow-none relative group"
          >
            {/* Header */}
            <div className="flex items-center gap-2">
              <img
                src={logo}
                alt={`${restaurant.name_en} logo`}
                className="w-7 h-7 object-contain shrink-0"
              />
              <span className="text-[16px] font-extrabold tracking-tight text-ink">
                {restaurant.name_en}
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
                className="w-36 h-36 object-contain"
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
            {restaurant.wifi_name && (
              <div className="mt-2 pt-2 border-t border-line w-full text-[11px] text-ink-3 font-medium flex justify-between px-2">
                <span>Wi-Fi: {restaurant.wifi_name}</span>
                {restaurant.wifi_password && <span>Pass: {restaurant.wifi_password}</span>}
              </div>
            )}

            {/* On-screen quick download & open button (hidden during print) */}
            <div className="print:hidden flex gap-2 w-full pt-1">
              <button
                type="button"
                onClick={() => handleDownloadCard(table)}
                className="flex-1 h-8 rounded-full border border-line bg-white hover:bg-bg text-[11.5px] font-bold text-ink flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Download this card as PNG"
              >
                <Download className="w-3 h-3 text-brand-muted" />
                <span>Save PNG</span>
              </button>
              <Link
                href={tablePath(restaurant.slug, table.qr_token)}
                target="_blank"
                className="h-8 px-2.5 rounded-full border border-line bg-white hover:bg-bg text-[11.5px] font-bold text-ink-2 flex items-center justify-center transition-colors"
                title="Open guest page in browser"
              >
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
