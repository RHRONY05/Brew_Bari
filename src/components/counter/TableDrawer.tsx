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
      className="fixed inset-0 z-50 bg-[#24170F]/50 backdrop-blur-2xs flex justify-end selection:bg-[#F2C27D]"
      onClick={onClose}
    >
      <aside
        data-testid="table-drawer"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md h-full bg-white shadow-[0_0_40px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#F0DFCB] bg-[#FFF7EE] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#6B4226] text-[#F2C27D] flex flex-col items-center justify-center font-extrabold shadow-2xs">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Table</span>
              <span className="text-[20px] leading-[22px]">{table.number}</span>
            </div>
            <div>
              <h2 className="text-[19px] font-extrabold text-[#24170F] tracking-tight">
                Table {table.number} {table.label ? `· ${table.label}` : ''}
              </h2>
              <div className="text-[12.5px] text-[#6F5A4B] font-semibold flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {table.seats || 4} seats
                </span>
                <span>•</span>
                {session?.status === 'pending' && (
                  <span className="text-[#6E5500] font-bold">Scanned (Awaiting Approval)</span>
                )}
                {session?.status === 'open' && (
                  <span className="text-[#1F5C3F] font-bold">Seated (Active Session)</span>
                )}
                {(!session || session.status === 'closed') && (
                  <span className="text-[#6F5A4B]">Free / Available</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            data-testid="close-table-drawer"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-[#F0DFCB] text-[#6F5A4B] hover:text-[#24170F] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Action Callout */}
          {session?.status === 'pending' && (
            <div className="bg-[#FFF4D1] border border-[#E9C95A] rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-[#6E5500] shrink-0 mt-0.5" />
                <div className="text-[13px] text-[#6E5500] font-medium leading-relaxed">
                  A guest has scanned this table's QR code. Confirm they are seated, then approve this session.
                </div>
              </div>
              <button
                type="button"
                data-testid="drawer-approve-session"
                disabled={isActing}
                onClick={handleApprove}
                className="w-full h-11 rounded-full bg-[#F2C27D] text-[#24170F] font-extrabold text-[14.5px] flex items-center justify-center gap-2 hover:bg-[#e0b06c] active:scale-98 transition-all shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Approve session</span>
              </button>
            </div>
          )}

          {(!session || session.status === 'closed') && (
            <div className="bg-[#FFF7EE] border border-[#F0DFCB] rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-[13px] text-[#6F5A4B] font-medium">
                This table is currently free. You can open it manually for walk-in guests.
              </p>
              <button
                type="button"
                data-testid="drawer-open-table"
                disabled={isActing}
                onClick={handleOpenManually}
                className="w-full h-11 rounded-full border border-[#F0DFCB] bg-white text-[#24170F] font-extrabold text-[14.5px] flex items-center justify-center gap-2 hover:bg-[#FBEBD7] active:scale-98 transition-all"
              >
                <span>Open table manually</span>
              </button>
            </div>
          )}

          {/* Running Bill Section */}
          <section className="bg-white rounded-2xl border border-[#F0DFCB] p-4 flex flex-col gap-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#F6E9DA] pb-2.5">
              <div className="flex items-center gap-2 font-extrabold text-[15px] text-[#24170F]">
                <Receipt className="w-4 h-4 text-[#8A5A37]" />
                <span>Running Bill</span>
              </div>
              <span className="text-[12px] text-[#6F5A4B] font-bold">
                {completedOrActiveOrders.length} order{completedOrActiveOrders.length === 1 ? '' : 's'}
              </span>
            </div>

            {billLines.length === 0 ? (
              <div className="text-[13px] text-[#8C7767] font-medium py-2">
                No orders placed yet for this session.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex flex-col divide-y divide-[#F6E9DA]">
                  {billLines.map((line, idx) => (
                    <div key={`${line.id}-${idx}`} className="py-2 flex justify-between items-baseline text-[13.5px]">
                      <div className="flex-1 pr-3">
                        <span className="font-bold text-[#24170F]">{line.quantity}× {line.name}</span>
                        {line.options && (
                          <div className="text-[11.5px] text-[#6F5A4B]">{line.options}</div>
                        )}
                      </div>
                      <span className="font-bold text-[#24170F]">৳{line.price}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#F0DFCB] pt-2.5 flex flex-col gap-1 text-[13px] text-[#6F5A4B]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>৳{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (5%)</span>
                    <span>৳{vat}</span>
                  </div>
                  <div className="flex justify-between text-[16px] font-extrabold text-[#24170F] pt-1 border-t border-[#F6E9DA]">
                    <span>Total</span>
                    <span>৳{grandTotal}</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Requests History */}
          <section className="flex flex-col gap-2.5">
            <h3 className="text-[13px] font-extrabold text-[#8C7767] uppercase tracking-wider">
              Session Requests ({tableRequests.length})
            </h3>
            {tableRequests.length === 0 ? (
              <div className="text-[13px] text-[#8C7767] font-medium bg-[#FFF7EE] p-4 rounded-2xl text-center">
                No requests recorded for this table.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {tableRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-2xl border border-[#F0DFCB] bg-white flex items-center justify-between gap-3 text-[13px]"
                  >
                    <div className="flex items-center gap-2.5">
                      {req.type === 'order' && <ShoppingBag className="w-4 h-4 text-[#8A5A37]" />}
                      {req.type === 'call_waiter' && <Bell className="w-4 h-4 text-[#8A5A37]" />}
                      {req.type === 'bill' && <Receipt className="w-4 h-4 text-[#8A5A37]" />}
                      <span className="font-bold text-[#24170F] capitalize">
                        {req.type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FFF7EE] text-[#6B4226] text-[11.5px] font-bold capitalize">
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Close Table Button */}
          {session?.status === 'open' && (
            <div className="mt-auto pt-4 border-t border-[#F0DFCB]">
              {confirmClose ? (
                <div className="bg-[#FFF0EE] border border-[#FCD2CD] rounded-2xl p-4 flex flex-col gap-3">
                  <p className="text-[13px] text-[#CE2C31] font-bold">
                    Close table {table.number}? This will finalize the bill and close all active requests.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      data-testid="confirm-close-table-button"
                      disabled={isActing}
                      onClick={handleCloseTable}
                      className="flex-1 h-10 rounded-full bg-[#CE2C31] text-white font-extrabold text-[13.5px] active:scale-98 transition-all"
                    >
                      Yes, close table
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClose(false)}
                      className="px-4 h-10 rounded-full border border-[#F0DFCB] bg-white text-[#6F5A4B] font-bold text-[13px]"
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
                  className="w-full h-11 rounded-full border border-[#FCD2CD] bg-[#FFF0EE] text-[#CE2C31] font-extrabold text-[14px] hover:bg-[#FDE2DF] active:scale-98 transition-all"
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
