'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Clock, Users, Receipt, AlertCircle, ShoppingBag, Bell } from 'lucide-react';
import type { TableItem } from './TableTile';
import type { ServiceRequestData } from './RequestCard';
import { formatTaka } from '@/lib/money';

export interface TableSessionData {
  id: string;
  table_id: string;
  restaurant_id: string;
  status: 'pending' | 'open' | 'closed';
  opened_at: string;
  closed_at?: string | null;
}

interface TableDrawerProps {
  table: TableItem | null;
  session: TableSessionData | null;
  requests: ServiceRequestData[];
  isOpen: boolean;
  onClose: () => void;
  onApproveSession: (sessionId: string) => Promise<void>;
  onOpenTableManually: (tableId: string) => Promise<void>;
  onCloseTable: (sessionId: string) => Promise<void>;
}

export function TableDrawer({
  table,
  session,
  requests,
  isOpen,
  onClose,
  onApproveSession,
  onOpenTableManually,
  onCloseTable,
}: TableDrawerProps) {
  const [isActing, setIsActing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  if (!isOpen || !table) return null;

  // Filter requests that belong to this session or table
  const tableRequests = requests.filter(
    (r) => r.table_id === table.id || (session && r.session_id === session.id)
  );

  // Compute running bill from non-cancelled orders
  const completedOrActiveOrders = tableRequests.filter(
    (r) => r.type === 'order' && r.status !== 'cancelled'
  );

  let subtotal = 0;
  const billLines: { id: string; name: string; quantity: number; price: number; options?: string }[] = [];

  for (const ord of completedOrActiveOrders) {
    if (ord.items) {
      for (const item of ord.items) {
        subtotal += item.price;
        billLines.push({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          options: item.optionsSummary,
        });
      }
    } else if (ord.total_amount) {
      subtotal += ord.total_amount;
    }
  }

  const vat = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + vat;

  const handleApprove = async () => {
    if (!session || isActing) return;
    setIsActing(true);
    try {
      await onApproveSession(session.id);
    } finally {
      setIsActing(false);
    }
  };

  const handleOpenManually = async () => {
    if (isActing) return;
    setIsActing(true);
    try {
      await onOpenTableManually(table.id);
    } finally {
      setIsActing(false);
    }
  };

  const handleCloseTable = async () => {
    if (!session || isActing) return;
    setIsActing(true);
    try {
      await onCloseTable(session.id);
      setConfirmClose(false);
      onClose();
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div
      data-testid="table-drawer-overlay"
      className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-2xs flex justify-end selection:bg-accent"
      onClick={onClose}
    >
      <aside
        data-testid="table-drawer"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md h-full bg-white shadow-[0_0_40px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-line bg-bg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand text-accent flex flex-col items-center justify-center font-extrabold shadow-2xs">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Table</span>
              <span className="text-[20px] leading-[22px]">{table.number}</span>
            </div>
            <div>
              <h2 className="text-[19px] font-extrabold text-ink tracking-tight">
                Table {table.number} {table.label ? `· ${table.label}` : ''}
              </h2>
              <div className="text-[12.5px] text-ink-2 font-semibold flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {table.seats || 4} seats
                </span>
                <span>•</span>
                {session?.status === 'pending' && (
                  <span className="text-warning font-bold">Scanned (Awaiting Approval)</span>
                )}
                {session?.status === 'open' && (
                  <span className="text-success font-bold">Seated (Active Session)</span>
                )}
                {(!session || session.status === 'closed') && (
                  <span className="text-ink-2">Free / Available</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            data-testid="close-table-drawer"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-line text-ink-2 hover:text-ink flex items-center justify-center active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Action Callout */}
          {session?.status === 'pending' && (
            <div className="bg-pending-soft border border-warning rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div className="text-[13px] text-warning font-medium leading-relaxed">
                  A guest has scanned this table&apos;s QR code. Confirm they are seated, then approve this session.
                </div>
              </div>
              <button
                type="button"
                data-testid="drawer-approve-session"
                disabled={isActing}
                onClick={handleApprove}
                className="w-full h-11 rounded-full bg-accent text-ink font-extrabold text-[14.5px] flex items-center justify-center gap-2 hover:bg-accent-strong active:scale-98 transition-all shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Approve session</span>
              </button>
            </div>
          )}

          {(!session || session.status === 'closed') && (
            <div className="bg-bg border border-line rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-[13px] text-ink-2 font-medium">
                This table is currently free. You can open it manually for walk-in guests.
              </p>
              <button
                type="button"
                data-testid="drawer-open-table"
                disabled={isActing}
                onClick={handleOpenManually}
                className="w-full h-11 rounded-full border border-line bg-white text-ink font-extrabold text-[14.5px] flex items-center justify-center gap-2 hover:bg-surface-2 active:scale-98 transition-all"
              >
                <span>Open table manually</span>
              </button>
            </div>
          )}

          {/* Running Bill Section */}
          <section className="bg-white rounded-2xl border border-line p-4 flex flex-col gap-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-line-soft pb-2.5">
              <div className="flex items-center gap-2 font-extrabold text-[15px] text-ink">
                <Receipt className="w-4 h-4 text-brand-muted" />
                <span>Running Bill</span>
              </div>
              <span className="text-[12px] text-ink-2 font-bold">
                {completedOrActiveOrders.length} order{completedOrActiveOrders.length === 1 ? '' : 's'}
              </span>
            </div>

            {billLines.length === 0 ? (
              <div className="text-[13px] text-ink-3 font-medium py-2">
                No orders placed yet for this session.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex flex-col divide-y divide-line-soft">
                  {billLines.map((line, idx) => (
                    <div key={`${line.id}-${idx}`} className="py-2 flex justify-between items-baseline text-[13.5px]">
                      <div className="flex-1 pr-3">
                        <span className="font-bold text-ink">{line.quantity}× {line.name}</span>
                        {line.options && (
                          <div className="text-[11.5px] text-ink-2">{line.options}</div>
                        )}
                      </div>
                      <span className="font-bold text-ink">৳{line.price}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-line pt-2.5 flex flex-col gap-1 text-[13px] text-ink-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>৳{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (5%)</span>
                    <span>৳{vat}</span>
                  </div>
                  <div className="flex justify-between text-[16px] font-extrabold text-ink pt-1 border-t border-line-soft">
                    <span>Total</span>
                    <span>৳{grandTotal}</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Requests History */}
          <section className="flex flex-col gap-2.5">
            <h3 className="text-[13px] font-extrabold text-ink-3 uppercase tracking-wider">
              Session Requests ({tableRequests.length})
            </h3>
            {tableRequests.length === 0 ? (
              <div className="text-[13px] text-ink-3 font-medium bg-bg p-4 rounded-2xl text-center">
                No requests recorded for this table.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {tableRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-2xl border border-line bg-white flex items-center justify-between gap-3 text-[13px]"
                  >
                    <div className="flex items-center gap-2.5">
                      {req.type === 'order' && <ShoppingBag className="w-4 h-4 text-brand-muted" />}
                      {req.type === 'call_waiter' && <Bell className="w-4 h-4 text-brand-muted" />}
                      {req.type === 'bill' && <Receipt className="w-4 h-4 text-brand-muted" />}
                      <span className="font-bold text-ink capitalize">
                        {req.type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-bg text-brand text-[11.5px] font-bold capitalize">
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Close Table Button */}
          {session?.status === 'open' && (
            <div className="mt-auto pt-4 border-t border-line">
              {confirmClose ? (
                <div className="bg-danger-soft border border-danger-soft rounded-2xl p-4 flex flex-col gap-3">
                  <p className="text-[13px] text-danger font-bold">
                    Close table {table.number}? This will finalize the bill and close all active requests.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      data-testid="confirm-close-table-button"
                      disabled={isActing}
                      onClick={handleCloseTable}
                      className="flex-1 h-10 rounded-full bg-danger text-white font-extrabold text-[13.5px] active:scale-98 transition-all"
                    >
                      Yes, close table
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClose(false)}
                      className="px-4 h-10 rounded-full border border-line bg-white text-ink-2 font-bold text-[13px]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  data-testid="drawer-close-table"
                  onClick={() => setConfirmClose(true)}
                  className="w-full h-11 rounded-full border border-danger-soft bg-danger-soft text-danger font-extrabold text-[14px] hover:bg-danger-soft active:scale-98 transition-all"
                >
                  Close table
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
