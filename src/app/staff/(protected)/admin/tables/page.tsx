'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import QRCode from 'qrcode';
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
} from 'lucide-react';

type TableRow = Database['public']['Tables']['tables']['Row'];

export default function AdminTablesPage() {
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [tables, setTables] = useState<TableRow[]>([]);
  const [siteUrl, setSiteUrl] = useState<string>('');
  const [shopQrDataUrl, setShopQrDataUrl] = useState<string>('');

  // Add Table Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newNumber, setNewNumber] = useState<number>(10);
  const [newLabel, setNewLabel] = useState<string>('');
  const [newSeats, setNewSeats] = useState<number>(4);
  const [isSaving, setIsSaving] = useState(false);

  // Regenerate Confirmation Modal state
  const [regenTargetTable, setRegenTargetTable] = useState<TableRow | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

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
    }

    const currentUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    setSiteUrl(currentUrl);

    // Generate shop QR
    try {
      const qrData = await QRCode.toDataURL(`${currentUrl}/m/brew-bari`, {
        width: 300,
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

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to add table');
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
      setRegenTargetTable(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate token');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Download Shop QR
  const handleDownloadShopQr = () => {
    if (!shopQrDataUrl) return;
    const a = document.createElement('a');
    a.href = shopQrDataUrl;
    a.download = 'brew-bari-shop-qr.png';
    a.click();
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
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-[24px] font-extrabold text-ink tracking-tight">
            Tables &amp; QR
          </h1>
          <p className="text-[13px] text-ink-2 font-medium">
            Each table has its own QR code. Print them once — they keep working after menu changes.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            data-testid="add-table-button"
            onClick={() => setIsAddModalOpen(true)}
            className="h-10 px-4 rounded-full border border-line bg-white text-ink text-[13px] font-bold flex items-center gap-1.5 hover:bg-bg active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4 text-brand-muted" />
            Add table
          </button>
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
          className="flex-1 min-w-0 w-full bg-white rounded-[20px] shadow-[0_6px_20px_rgba(107,66,38,0.08)] overflow-hidden border border-line/60 flex flex-col"
        >
          <div className="flex justify-between px-4 py-2.5 text-[11.5px] font-extrabold tracking-wider uppercase text-ink-3 border-b border-line-soft">
            <span>Table</span>
            <span>QR · Active</span>
          </div>

          <div className="divide-y divide-line-soft">
            {tables.map((table) => {
              const tableUrl = `/t/${table.qr_token}`;
              return (
                <div
                  key={table.id}
                  data-testid={`table-row-${table.number}`}
                  className="flex flex-wrap items-center gap-3 p-3.5 hover:bg-surface-subtle transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-surface-2 text-brand font-extrabold text-[18px] flex items-center justify-center shrink-0">
                    {table.number}
                  </div>

                  <div className="flex-1 min-w-[130px]">
                    <div className="text-[14.5px] font-bold text-ink">
                      {table.label || `Table ${table.number}`}
                    </div>
                    <div className="text-[12px] text-ink-2 font-semibold">
                      {table.seats} seats {table.number === 99 && '· Test table'}
                    </div>
                  </div>

                  {/* Token & Link */}
                  <Link
                    href={tableUrl}
                    target="_blank"
                    data-testid={`view-table-link-${table.number}`}
                    className="text-[12px] text-ink-3 font-mono hover:text-brand flex items-center gap-1 shrink-0 bg-bg px-2 py-1 rounded-md"
                  >
                    <span>{table.qr_token.slice(0, 10)}…</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  {/* Regenerate Token Button */}
                  <button
                    type="button"
                    aria-label={`Regenerate QR for Table ${table.number}`}
                    data-testid={`regen-token-${table.number}`}
                    onClick={() => setRegenTargetTable(table)}
                    className="h-9 px-3 rounded-full border border-line bg-white text-ink text-[12.5px] font-bold flex items-center gap-1.5 hover:bg-bg active:scale-98 transition-all shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-brand-muted" />
                    New QR
                  </button>

                  {/* Active Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={table.is_active}
                    aria-label={`Table ${table.number} active`}
                    data-testid={`toggle-table-${table.number}`}
                    onClick={() => handleToggleActive(table)}
                    className={`w-[52px] h-[30px] rounded-full p-[3px] flex shrink-0 transition-colors cursor-pointer ${
                      table.is_active
                        ? 'bg-success justify-end'
                        : 'bg-line justify-start'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-bg text-[12px] text-ink-2 leading-relaxed border-t border-line-soft">
            <b>New QR</b> makes the old printed code stop working immediately — use it if a QR is being misused, then reprint that table’s card.
          </div>
        </section>

        {/* Shop QR Side Section */}
        <aside
          aria-label="Shop QR"
          className="w-full xl:w-[340px] shrink-0 bg-white rounded-[20px] shadow-[0_6px_20px_rgba(107,66,38,0.08)] p-5 flex flex-col gap-3.5 border border-line/60"
        >
          <div>
            <h2 className="text-[17px] font-extrabold text-ink">Shop QR — menu only</h2>
            <p className="text-[12.5px] text-ink-2 leading-relaxed mt-0.5">
              For the entrance door, counter flyers and social media. Opens the full digital menu without assigning a table.
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
              <span className="text-[12px] text-ink-2 font-mono break-all leading-tight">
                {siteUrl}/m/brew-bari
              </span>
              <button
                type="button"
                data-testid="download-shop-qr-button"
                onClick={handleDownloadShopQr}
                className="h-9 px-3.5 rounded-full border border-line bg-white text-ink text-[12.5px] font-bold flex items-center gap-1.5 hover:bg-bg active:scale-98 transition-all w-fit"
              >
                <Download className="w-3.5 h-3.5 text-brand-muted" />
                Download PNG
              </button>
            </div>
          </div>
        </aside>
      </div>

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
                className="w-8 h-8 rounded-full text-ink-2 hover:bg-bg flex items-center justify-center"
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
                className="flex-1 h-11 rounded-full bg-accent text-ink text-[14px] font-extrabold hover:bg-accent-strong active:scale-98 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create table'}
              </button>
              <button
                type="button"
                data-testid="cancel-table-button"
                onClick={() => setIsAddModalOpen(false)}
                className="h-11 px-4 rounded-full border border-line bg-white text-ink-2 text-[13px] font-bold hover:bg-bg"
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
                className="flex-1 h-11 rounded-full bg-danger text-white text-[14px] font-extrabold hover:bg-danger active:scale-98 transition-all disabled:opacity-50"
              >
                {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, regenerate'}
              </button>
              <button
                type="button"
                data-testid="cancel-regen-button"
                onClick={() => setRegenTargetTable(null)}
                className="h-11 px-4 rounded-full border border-line bg-white text-ink-2 text-[13px] font-bold hover:bg-bg"
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
