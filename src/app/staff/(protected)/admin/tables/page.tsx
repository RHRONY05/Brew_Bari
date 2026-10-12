'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import {
  QrCode,
  Printer,
  Plus,
  RefreshCw,
  ExternalLink,
  Download,
  Check,
  AlertCircle,
  X,
  Loader2,
  Copy,
} from 'lucide-react';

type TableRow = Database['public']['Tables']['tables']['Row'];

const LIVE_PRODUCTION_URL = 'https://brew-bari.vercel.app';

export default function AdminTablesPage() {
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [tables, setTables] = useState<TableRow[]>([]);
  const [siteUrl, setSiteUrl] = useState<string>('');
  const [shopQrDataUrl, setShopQrDataUrl] = useState<string>('');

  // Table QR data URLs map: tableId -> dataUrl
  const [tableQrs, setTableQrs] = useState<Record<string, string>>({});

  // Selected table for the QR Inspection Modal
  const [selectedQrTable, setSelectedQrTable] = useState<TableRow | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  // Add Table Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newNumber, setNewNumber] = useState<number>(10);
  const [newLabel, setNewLabel] = useState<string>('');
  const [newSeats, setNewSeats] = useState<number>(4);
  const [isSaving, setIsSaving] = useState(false);

  // Regenerate Confirmation Modal state
  const [regenTargetTable, setRegenTargetTable] = useState<TableRow | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Determine current origin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSiteUrl(window.location.origin);
    }
  }, []);

  const effectiveBaseUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      if (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
        return LIVE_PRODUCTION_URL;
      }
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_SITE_URL || LIVE_PRODUCTION_URL;
  }, []);

  // Generate QR codes for all tables and shop
  const generateQrs = useCallback(
    async (tablesList: TableRow[], baseUrl: string) => {
      // 1. Generate Table QRs
      const qrs: Record<string, string> = {};
      await Promise.all(
        tablesList.map(async (t) => {
          try {
            const tableUrl = `${baseUrl}/t/${t.qr_token}`;
            const qrData = await QRCode.toDataURL(tableUrl, {
              width: 360,
              margin: 1,
              color: {
                dark: '#24170F',
                light: '#FFFFFF',
              },
            });
            qrs[t.id] = qrData;
          } catch (e) {
            console.error(`Failed to generate QR for Table ${t.number}`, e);
          }
        })
      );
      setTableQrs(qrs);

      // 2. Generate Shop QR (menu only)
      try {
        const shopUrl = `${baseUrl}/m/brew-bari`;
        const qrData = await QRCode.toDataURL(shopUrl, {
          width: 360,
          margin: 1,
          color: {
            dark: '#24170F',
            light: '#FFFFFF',
          },
        });
        setShopQrDataUrl(qrData);
      } catch (e) {
        console.error('Failed to generate shop QR', e);
      }
    },
    []
  );

  const fetchData = useCallback(async () => {
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
    setRestaurantId(rid);

    const { data: tablesData } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', rid)
      .order('number', { ascending: true });

    if (tablesData) {
      setTables(tablesData);
      await generateQrs(tablesData, effectiveBaseUrl);
    }

    setLoading(false);
  }, [effectiveBaseUrl, generateQrs]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-generate QRs whenever the effectiveBaseUrl changes
  useEffect(() => {
    if (tables.length > 0) {
      generateQrs(tables, effectiveBaseUrl);
    }
  }, [effectiveBaseUrl, generateQrs, tables]);

  // Toggle table active
  const handleToggleActive = async (table: TableRow) => {
    const nextVal = !table.is_active;
    setTables((prev) =>
      prev.map((t) => (t.id === table.id ? { ...t, is_active: nextVal } : t))
    );

    const supabase = getSupabaseBrowserClient();
    await supabase.from('tables').update({ is_active: nextVal }).eq('id', table.id);
  };

  // Add new table
  const handleAddTable = async () => {
    if (!newNumber || newNumber <= 0) return;
    try {
      setIsSaving(true);
      const supabase = getSupabaseBrowserClient();
      const newToken = `t_${newNumber}_${Math.random().toString(36).slice(2, 10)}`;

      const { error } = await supabase.from('tables').insert({
        restaurant_id: restaurantId,
        number: Number(newNumber),
        label: newLabel.trim() || `Table ${newNumber}`,
        seats: Number(newSeats || 4),
        is_active: true,
        qr_token: newToken,
      });

      if (error) throw error;
      setIsAddModalOpen(false);
      setNewNumber((prev) => prev + 1);
      setNewLabel('');
      toast.success(`Table ${newNumber} added successfully!`);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add table');
    } finally {
      setIsSaving(false);
    }
  };

  // Regenerate Token for a table
  const handleConfirmRegenerate = async () => {
    if (!regenTargetTable) return;
    try {
      setIsRegenerating(true);
      const supabase = getSupabaseBrowserClient();
      const newToken = `t_${regenTargetTable.number}_${Math.random().toString(36).slice(2, 10)}`;

      const { error } = await supabase
        .from('tables')
        .update({ qr_token: newToken })
        .eq('id', regenTargetTable.id);

      if (error) throw error;
      toast.success(`Generated new QR code for Table ${regenTargetTable.number}`);
      setRegenTargetTable(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to regenerate token');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Download raw QR code PNG
  const handleDownloadRawQr = (table: TableRow) => {
    const qrData = tableQrs[table.id];
    if (!qrData) return;
    const a = document.createElement('a');
    a.href = qrData;
    a.download = `brew-bari-table-${table.number}-qr.png`;
    a.click();
    toast.success(`Downloaded QR for Table ${table.number}`);
  };

  // Generate and download full branded Table Card PNG via Canvas
  const handleDownloadTableCard = async (table: TableRow) => {
    const qrData = tableQrs[table.id];
    if (!qrData) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1050;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Card Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 800, 1050);

      // Card Frame
      ctx.strokeStyle = '#6B4226';
      ctx.lineWidth = 10;
      ctx.strokeRect(18, 18, 764, 1014);

      // Inner Cream surface
      ctx.fillStyle = '#FAF7F2';
      ctx.fillRect(24, 24, 752, 1002);

      // Brand Title
      ctx.fillStyle = '#24170F';
      ctx.font = 'bold 46px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Brew Bari', 400, 110);

      // Bengali Brand Subtitle
      ctx.fillStyle = '#6B4226';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.fillText('ব্রু বাড়ি · কফি ও খাবার', 400, 150);

      // Divider
      ctx.strokeStyle = '#E6DFD5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(120, 180);
      ctx.lineTo(680, 180);
      ctx.stroke();

      // Table Number Title
      ctx.fillStyle = '#24170F';
      ctx.font = 'bold 54px system-ui, sans-serif';
      const title = table.label || `Table ${table.number}`;
      ctx.fillText(title, 400, 255);

      if (table.label && table.label !== `Table ${table.number}`) {
        ctx.fillStyle = '#8C7E74';
        ctx.font = 'bold 24px system-ui, sans-serif';
        ctx.fillText(`Table #${table.number} · ${table.seats} Seats`, 400, 295);
      }

      // Draw QR image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          // White box behind QR
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(170, 330, 460, 460);
          ctx.strokeStyle = '#E6DFD5';
          ctx.lineWidth = 3;
          ctx.strokeRect(170, 330, 460, 460);

          // Draw QR
          ctx.drawImage(img, 190, 350, 420, 420);
          resolve();
        };
        img.onerror = reject;
        img.src = qrData;
      });

      // Call-to-actions
      ctx.fillStyle = '#24170F';
      ctx.font = 'bold 30px system-ui, sans-serif';
      ctx.fillText('Scan to order & call waiter', 400, 850);

      ctx.fillStyle = '#6B4226';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.fillText('অর্ডার করতে ও ওয়েটার ডাকতে স্ক্যান করুন', 400, 895);

      // Wi-Fi info footer
      ctx.fillStyle = '#8C7E74';
      ctx.font = '500 20px system-ui, sans-serif';
      ctx.fillText('Wi-Fi: BrewBari_Guest  |  Pass: Coffee2026', 400, 970);

      // Download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `brew-bari-table-${table.number}-card.png`;
      a.click();
      toast.success(`Downloaded printable card for Table ${table.number}`);
    } catch (e) {
      console.error('Failed to generate card', e);
      // Fallback to raw QR
      handleDownloadRawQr(table);
    }
  };

  // Download All Active Table Cards
  const handleDownloadAllCards = async () => {
    setIsDownloadingAll(true);
    toast.info('Preparing downloads for all active tables...');
    try {
      const activeTables = tables.filter((t) => t.is_active);
      for (let i = 0; i < activeTables.length; i++) {
        await handleDownloadTableCard(activeTables[i]);
        // 250ms delay between files to prevent browser download queue throttling
        await new Promise((res) => setTimeout(res, 250));
      }
      toast.success(`Downloaded all ${activeTables.length} table cards!`);
    } catch {
      toast.error('Failed to download some table cards');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Download Shop QR
  const handleDownloadShopQr = () => {
    if (!shopQrDataUrl) return;
    const a = document.createElement('a');
    a.href = shopQrDataUrl;
    a.download = 'brew-bari-shop-qr.png';
    a.click();
    toast.success('Downloaded Shop QR');
  };

  // Copy table URL
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    toast.success('Table link copied to clipboard!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="text-[24px] font-extrabold text-ink tracking-tight flex items-center gap-2">
            <span>Tables &amp; QR</span>
            <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-accent text-ink">
              {tables.length} tables
            </span>
          </h1>
          <p className="text-[13px] text-ink-2 font-medium">
            Each table has a dedicated QR code. Customers scan from their phones to view the menu, order, and call a waiter.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Download all cards */}
          <button
            type="button"
            data-testid="download-all-qrs-button"
            disabled={isDownloadingAll}
            onClick={handleDownloadAllCards}
            className="h-10 px-4 rounded-full border border-line bg-white text-ink text-[13px] font-bold flex items-center gap-2 hover:bg-bg active:scale-98 transition-all disabled:opacity-50"
          >
            {isDownloadingAll ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand" />
            ) : (
              <Download className="w-4 h-4 text-brand-muted" />
            )}
            Download all cards
          </button>

          {/* Add Table Button */}
          <button
            type="button"
            data-testid="add-table-button"
            onClick={() => setIsAddModalOpen(true)}
            className="h-10 px-4 rounded-full border border-line bg-white text-ink text-[13px] font-bold flex items-center gap-1.5 hover:bg-bg active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4 text-brand-muted" />
            Add table
          </button>

          {/* Print Cards Link */}
          <Link
            href="/staff/admin/tables/print?showTest=1"
            target="_blank"
            data-testid="print-qr-cards-link"
            className="h-10 px-5 rounded-full bg-accent text-ink text-[14px] font-extrabold flex items-center gap-1.5 shadow-xs hover:bg-accent-strong active:scale-98 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print QR cards
          </Link>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Table List Card */}
        <section
          aria-label="Tables"
          className="flex-1 min-w-0 w-full bg-white rounded-[20px] shadow-[0_6px_20px_rgba(107,66_38,0.08)] overflow-hidden border border-line/60 flex flex-col"
        >
          <div className="flex justify-between items-center px-4 py-3 text-[11.5px] font-extrabold tracking-wider uppercase text-ink-3 border-b border-line-soft">
            <span>Table &amp; QR Code</span>
            <span>Actions &amp; Status</span>
          </div>

          <div className="divide-y divide-line-soft">
            {tables.map((table) => {
              const tableUrl = `/t/${table.qr_token}`;
              const fullUrl = `${effectiveBaseUrl}${tableUrl}`;
              const qrDataUrl = tableQrs[table.id];

              return (
                <div
                  key={table.id}
                  data-testid={`table-row-${table.number}`}
                  className="flex flex-wrap items-center gap-3.5 p-3.5 hover:bg-surface-subtle transition-colors"
                >
                  {/* Table Number Badge */}
                  <div className="w-11 h-11 rounded-xl bg-surface-2 text-brand font-extrabold text-[17px] flex items-center justify-center shrink-0 border border-line/50">
                    {table.number}
                  </div>

                  {/* Scannable QR Code Thumbnail */}
                  <button
                    type="button"
                    data-testid={`qr-thumb-${table.number}`}
                    onClick={() => setSelectedQrTable(table)}
                    className="w-12 h-12 p-1 rounded-xl bg-white border border-line hover:border-brand hover:shadow-xs transition-all flex items-center justify-center shrink-0 cursor-pointer group"
                    title="Click to view large scannable QR code"
                  >
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt={`Table ${table.number} QR`}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <QrCode className="w-6 h-6 text-brand-muted" />
                    )}
                  </button>

                  {/* Table Label & Seats */}
                  <div className="flex-1 min-w-[140px]">
                    <div className="text-[14.5px] font-bold text-ink flex items-center gap-1.5">
                      <span>{table.label || `Table ${table.number}`}</span>
                      {table.number === 99 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-warning-soft text-warning">
                          TEST
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-ink-2 font-semibold flex items-center gap-2">
                      <span>{table.seats} seats</span>
                      <span className="text-line">•</span>
                      <span className="text-ink-3 font-mono text-[11px]">
                        {table.qr_token.slice(0, 8)}…
                      </span>
                    </div>
                  </div>

                  {/* View QR Code Button */}
                  <button
                    type="button"
                    data-testid={`view-qr-button-${table.number}`}
                    onClick={() => setSelectedQrTable(table)}
                    className="h-9 px-3.5 rounded-full bg-accent text-ink text-[12.5px] font-extrabold flex items-center gap-1.5 hover:bg-accent-strong active:scale-98 transition-all shrink-0 shadow-2xs cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View QR</span>
                  </button>

                  {/* Download Card Button */}
                  <button
                    type="button"
                    data-testid={`download-qr-button-${table.number}`}
                    onClick={() => handleDownloadTableCard(table)}
                    className="h-9 px-3 rounded-full border border-line bg-white text-ink text-[12px] font-bold flex items-center gap-1.5 hover:bg-bg active:scale-98 transition-all shrink-0 cursor-pointer"
                    title="Download Table Card PNG"
                  >
                    <Download className="w-3.5 h-3.5 text-brand-muted" />
                    <span>Download</span>
                  </button>

                  {/* Token & Direct Link (e2e test compatibility) */}
                  <Link
                    href={tableUrl}
                    target="_blank"
                    data-testid={`view-table-link-${table.number}`}
                    className="h-9 px-2.5 rounded-full bg-bg text-ink-2 hover:text-brand text-[12px] font-mono flex items-center gap-1 shrink-0 transition-colors"
                    title="Open table directly in browser"
                  >
                    <span className="hidden sm:inline">Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  {/* Regenerate Token Button */}
                  <button
                    type="button"
                    aria-label={`Regenerate QR for Table ${table.number}`}
                    data-testid={`regen-token-${table.number}`}
                    onClick={() => setRegenTargetTable(table)}
                    className="h-9 px-2.5 rounded-full border border-line bg-white text-ink-3 hover:text-ink text-[12px] font-bold flex items-center gap-1 hover:bg-bg active:scale-98 transition-all shrink-0 cursor-pointer"
                    title="Regenerate QR token"
                  >
                    <RefreshCw className="w-3 h-3 text-brand-muted" />
                    <span className="hidden md:inline">Reset</span>
                  </button>

                  {/* Active Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={table.is_active}
                    aria-label={`Table ${table.number} active`}
                    data-testid={`toggle-table-${table.number}`}
                    onClick={() => handleToggleActive(table)}
                    className={`w-[48px] h-[28px] rounded-full p-[2px] flex shrink-0 transition-colors cursor-pointer ${
                      table.is_active ? 'bg-success justify-end' : 'bg-line justify-start'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 bg-bg text-[12px] text-ink-2 leading-relaxed border-t border-line-soft flex items-center justify-between">
            <div>
              💡 <b>Tip:</b> Click <b>View QR</b> or the QR thumbnail to scan directly from your phone screen.
            </div>
            <Link
              href="/staff/admin/tables/print?showTest=1"
              target="_blank"
              className="text-brand font-bold hover:underline"
            >
              Open Print Sheet →
            </Link>
          </div>
        </section>

        {/* Shop QR Side Section (Entrance / General Menu) */}
        <aside
          aria-label="Shop QR"
          className="w-full xl:w-[340px] shrink-0 bg-white rounded-[20px] shadow-[0_6px_20px_rgba(107,66,38,0.08)] p-5 flex flex-col gap-3.5 border border-line/60"
        >
          <div>
            <div className="inline-block px-2 py-0.5 rounded-full bg-surface-2 text-brand text-[11px] font-extrabold uppercase tracking-wider mb-1">
              General / Entrance
            </div>
            <h2 className="text-[17px] font-extrabold text-ink">Shop QR (Menu Only)</h2>
            <p className="text-[12.5px] text-ink-2 leading-relaxed mt-0.5">
              For entrance doors, take-away flyers and social media. Opens the digital menu for browsing without assigning a table number.
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <div className="p-2.5 bg-white border border-line rounded-2xl shrink-0 shadow-2xs">
              {shopQrDataUrl ? (
                <img src={shopQrDataUrl} alt="Brew Bari Shop QR" className="w-28 h-28" />
              ) : (
                <div className="w-28 h-28 bg-bg flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-brand-muted" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <span className="text-[11.5px] text-ink-2 font-mono break-all leading-tight">
                {effectiveBaseUrl}/m/brew-bari
              </span>
              <button
                type="button"
                data-testid="download-shop-qr-button"
                onClick={handleDownloadShopQr}
                className="h-9 px-3.5 rounded-full border border-line bg-white text-ink text-[12.5px] font-bold flex items-center gap-1.5 hover:bg-bg active:scale-98 transition-all w-fit cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-brand-muted" />
                Download PNG
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Table QR Inspection Modal */}
      {selectedQrTable && (
        <div
          data-testid="table-qr-modal"
          className="fixed inset-0 z-50 bg-ink/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl flex flex-col gap-4 border border-line animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-[18px] font-extrabold text-ink">
                  {selectedQrTable.label || `Table ${selectedQrTable.number}`}
                </h3>
                <p className="text-[12.5px] text-ink-2 font-medium">
                  {selectedQrTable.seats} seats · Ready for mobile camera scan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQrTable(null)}
                className="w-8 h-8 rounded-full text-ink-2 hover:bg-bg flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Branded Card Preview */}
            <div className="p-6 rounded-2xl bg-[#FAF7F2] border-2 border-brand/80 flex flex-col items-center text-center gap-3 shadow-xs">
              <div className="text-[17px] font-extrabold text-ink tracking-tight">
                Brew Bari
              </div>
              <div className="text-[22px] font-extrabold text-ink">
                {selectedQrTable.label || `Table ${selectedQrTable.number}`}
              </div>

              {/* Large, High-Contrast QR Code */}
              <div className="p-3 bg-white border border-line rounded-2xl shadow-sm">
                {tableQrs[selectedQrTable.id] ? (
                  <img
                    data-testid={`qr-image-${selectedQrTable.number}`}
                    src={tableQrs[selectedQrTable.id]}
                    alt={`Table ${selectedQrTable.number} QR`}
                    className="w-56 h-56 object-contain"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand" />
                  </div>
                )}
              </div>

              <div className="text-[13px] font-bold text-ink">
                Scan to order &amp; call waiter
              </div>
              <div className="text-[12px] font-semibold text-ink-2">
                অর্ডার করতে ও ওয়েটার ডাকতে স্ক্যান করুন
              </div>

              <div className="text-[11px] font-medium text-ink-3 pt-1 border-t border-line/60 w-full">
                Wi-Fi: BrewBari_Guest | Pass: Coffee2026
              </div>
            </div>

            {/* URL Display with Copy Button */}
            <div className="p-2.5 rounded-xl bg-bg border border-line flex items-center justify-between gap-2">
              <span className="text-[11.5px] font-mono text-ink-2 truncate select-all">
                {`${effectiveBaseUrl}/t/${selectedQrTable.qr_token}`}
              </span>
              <button
                type="button"
                data-testid="copy-table-link-button"
                onClick={() => handleCopyUrl(`${effectiveBaseUrl}/t/${selectedQrTable.qr_token}`)}
                className="px-2.5 py-1 rounded-lg bg-white border border-line hover:bg-surface-2 text-[11px] font-bold text-ink flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3 h-3 text-success" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  data-testid="download-card-button"
                  onClick={() => handleDownloadTableCard(selectedQrTable)}
                  className="flex-1 h-11 rounded-full bg-accent text-ink text-[13.5px] font-extrabold flex items-center justify-center gap-2 hover:bg-accent-strong active:scale-98 transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Card PNG</span>
                </button>

                <button
                  type="button"
                  data-testid="download-qr-only-button"
                  onClick={() => handleDownloadRawQr(selectedQrTable)}
                  className="h-11 px-4 rounded-full border border-line bg-white text-ink text-[13px] font-bold flex items-center justify-center gap-1.5 hover:bg-bg active:scale-98 transition-all cursor-pointer"
                  title="Download raw QR image"
                >
                  <QrCode className="w-4 h-4 text-brand" />
                  <span className="hidden sm:inline">QR Only</span>
                </button>
              </div>

              <Link
                href={`/t/${selectedQrTable.qr_token}`}
                target="_blank"
                data-testid="open-table-guest-button"
                className="w-full h-10 rounded-full border border-line bg-bg hover:bg-surface-2 text-ink-2 hover:text-ink text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test in new tab (Guest view)</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {isAddModalOpen && (
        <div
          data-testid="add-table-modal"
          className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-xl flex flex-col gap-4 border border-line">
            <div className="flex justify-between items-center">
              <h3 className="text-[17px] font-extrabold text-ink">Add New Table</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full text-ink-2 hover:bg-bg flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-ink-2">Table Number</label>
                <input
                  data-testid="table-number-input"
                  type="number"
                  value={newNumber}
                  onChange={(e) => setNewNumber(Number(e.target.value))}
                  className="h-10 rounded-xl border border-line px-3 text-[14px] font-bold text-ink"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-ink-2">Label (optional)</label>
                <input
                  data-testid="table-label-input"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Window Side"
                  className="h-10 rounded-xl border border-line px-3 text-[14px] font-semibold text-ink"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-ink-2">Seats</label>
                <input
                  data-testid="table-seats-input"
                  type="number"
                  value={newSeats}
                  onChange={(e) => setNewSeats(Number(e.target.value))}
                  className="h-10 rounded-xl border border-line px-3 text-[14px] font-bold text-ink"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                data-testid="save-table-button"
                disabled={isSaving}
                onClick={handleAddTable}
                className="flex-1 h-11 rounded-full bg-accent text-ink text-[14px] font-extrabold hover:bg-accent-strong active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create table'}
              </button>
              <button
                type="button"
                data-testid="cancel-table-button"
                onClick={() => setIsAddModalOpen(false)}
                className="h-11 px-4 rounded-full border border-line bg-white text-ink-2 text-[13px] font-bold hover:bg-bg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Confirmation Modal */}
      {regenTargetTable && (
        <div
          data-testid="regen-confirm-modal"
          className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-xl flex flex-col gap-4 border border-line">
            <div className="flex items-center gap-3 text-danger">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-[17px] font-extrabold text-ink">
                Regenerate Table {regenTargetTable.number} QR?
              </h3>
            </div>

            <p className="text-[13px] text-ink-2 leading-relaxed">
              The existing QR code URL will immediately become invalid. Guests scanning the old printed card will see an invalid code page.
            </p>

            <div className="flex gap-2 mt-1">
              <button
                type="button"
                data-testid="confirm-regen-button"
                disabled={isRegenerating}
                onClick={handleConfirmRegenerate}
                className="flex-1 h-11 rounded-full bg-danger text-white text-[14px] font-extrabold hover:bg-danger active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, regenerate'}
              </button>
              <button
                type="button"
                data-testid="cancel-regen-button"
                onClick={() => setRegenTargetTable(null)}
                className="h-11 px-4 rounded-full border border-line bg-white text-ink-2 text-[13px] font-bold hover:bg-bg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
