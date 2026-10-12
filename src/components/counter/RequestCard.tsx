'use client';

import React from 'react';
import { Bell, ShoppingBag, Receipt, AlertCircle } from 'lucide-react';
import type { RequestType, RequestStatus } from '@/lib/schemas';
import { formatTaka } from '@/lib/money';

export interface RequestItemRow {
  id: string;
  name: string;
  quantity: number;
  optionsSummary?: string;
  price: number;
}

export interface ServiceRequestData {
  id: string;
  restaurant_id: string;
  session_id: string;
  table_id: string;
  type: RequestType;
  status: RequestStatus;
  nudge_count: number;
  note?: string | null;
  created_at: string;
  order_number?: number | null;
  total_amount?: number | null;
  items?: RequestItemRow[];
  table_number: number;
  session_status?: string;
  isFlashing?: boolean;
}

interface RequestCardProps {
  request: ServiceRequestData;
  timeAgoText: string;
  onTransition: (request: ServiceRequestData, nextStatus: RequestStatus) => void;
  onViewBill?: (tableNumber: number) => void;
  isMobile?: boolean;
}

export function RequestCard({
  request,
  timeAgoText,
  onTransition,
  onViewBill,
  isMobile = false,
}: RequestCardProps) {
  const isPendingSession = request.session_status === 'pending';

  // Badge background & text color
  let badgeStyle = 'bg-surface-2 text-ink-2';
  let cardBorder = 'border-transparent';

  if (request.type === 'order') {
    if (request.status === 'new') {
      badgeStyle = 'bg-danger-soft text-danger';
      cardBorder = 'border-danger';
    } else if (request.status === 'preparing') {
      badgeStyle = 'bg-success-soft text-success';
      cardBorder = 'border-success-soft';
    } else {
      badgeStyle = 'bg-surface-2 text-brand-muted';
    }
  } else if (request.type === 'call_waiter') {
    if (isPendingSession) {
      badgeStyle = 'bg-pending-soft text-warning';
      cardBorder = 'border-warning';
    } else {
      badgeStyle = 'bg-warning-soft text-warning';
      cardBorder = 'border-warning';
    }
  } else if (request.type === 'bill') {
    badgeStyle = 'bg-info-soft text-info';
    cardBorder = 'border-info';
  }

  // Type title & flag
  let typeTitle = 'Request';
  let flag: { text: string; style: string } | null = null;

  if (request.type === 'order') {
    const num = request.order_number ? `#${request.order_number}` : '';
    if (request.status === 'new') {
      typeTitle = `New order ${num}`;
      flag = { text: 'NEW', style: 'bg-danger-soft text-danger' };
    } else if (request.status === 'acknowledged') {
      typeTitle = `Order ${num} · Accepted`;
      flag = { text: 'Accepted', style: 'bg-warning-soft text-warning' };
    } else if (request.status === 'preparing') {
      typeTitle = `Order ${num} · Preparing`;
      flag = { text: 'Preparing', style: 'bg-surface-2 text-brand-muted' };
    } else if (request.status === 'ready') {
      typeTitle = `Order ${num} · Ready`;
      flag = { text: 'Ready', style: 'bg-success-soft text-success' };
    } else {
      typeTitle = `Order ${num}`;
    }
  } else if (request.type === 'call_waiter') {
    typeTitle = 'Calling waiter';
    if (isPendingSession) {
      flag = { text: 'Unverified table', style: 'bg-pending-soft text-warning' };
    } else if (request.nudge_count > 0) {
      flag = {
        text: `Called again ×${request.nudge_count}`,
        style: 'bg-warning-soft text-warning',
      };
    }
  } else if (request.type === 'bill') {
    typeTitle = 'Bill requested';
  }

  // Render buttons
  const renderActions = () => {
    // If table session is still unverified (pending approval)
    if (isPendingSession && request.status === 'new') {
      return (
        <div className={`flex ${isMobile ? 'gap-2' : 'flex-col gap-2 justify-center'}`}>
          <button
            type="button"
            data-testid={`action-approve-send-${request.id}`}
            onClick={() => onTransition(request, 'acknowledged')}
            className={`${isMobile ? 'flex-1' : ''} h-12 px-5.5 rounded-full bg-accent text-ink text-[15px] font-extrabold hover:bg-accent-strong active:scale-98 transition-all shadow-xs`}
          >
            Approve &amp; send
          </button>
          <button
            type="button"
            data-testid={`action-dismiss-${request.id}`}
            onClick={() => onTransition(request, 'cancelled')}
            className="h-10 px-4 rounded-full border border-line bg-white text-ink-2 text-[13px] font-bold hover:bg-bg active:scale-98 transition-all"
          >
            Dismiss
          </button>
        </div>
      );
    }

    if (request.type === 'call_waiter') {
      if (request.status === 'new') {
        return (
          <div className={`flex ${isMobile ? 'gap-2' : 'flex-col gap-2 justify-center'}`}>
            <button
              type="button"
              data-testid={`action-waiter-sent-${request.id}`}
              onClick={() => onTransition(request, 'acknowledged')}
              className={`${isMobile ? 'flex-1' : ''} h-12 px-5.5 rounded-full bg-accent text-ink text-[15px] font-extrabold hover:bg-accent-strong active:scale-98 transition-all shadow-xs`}
            >
              Waiter sent
            </button>
            <button
              type="button"
              data-testid={`action-call-done-${request.id}`}
              onClick={() => onTransition(request, 'done')}
              className="h-10 px-4 rounded-full border border-line bg-white text-ink-2 text-[13px] font-bold hover:bg-bg active:scale-98 transition-all"
            >
              Done
            </button>
          </div>
        );
      }
      return (
        <div className={`flex ${isMobile ? 'gap-2' : 'flex-col gap-2 justify-center'}`}>
          <button
            type="button"
            data-testid={`action-call-done-${request.id}`}
            onClick={() => onTransition(request, 'done')}
            className={`${isMobile ? 'flex-1' : ''} h-12 px-5.5 rounded-full bg-accent text-ink text-[15px] font-extrabold hover:bg-accent-strong active:scale-98 transition-all shadow-xs`}
          >
            Done
          </button>
        </div>
      );
    }

    if (request.type === 'order') {
      if (request.status === 'new') {
        return (
          <div className={`flex ${isMobile ? 'gap-2' : 'flex-col gap-2 justify-center'}`}>
            <button
              type="button"
              data-testid={`action-order-accept-${request.id}`}
              onClick={() => onTransition(request, 'acknowledged')}
              className={`${isMobile ? 'flex-1' : ''} h-12 px-5.5 rounded-full bg-accent text-ink text-[15px] font-extrabold hover:bg-accent-strong active:scale-98 transition-all shadow-xs`}
            >
              Accept
            </button>
            <button
              type="button"
              data-testid={`action-order-cancel-${request.id}`}
              onClick={() => onTransition(request, 'cancelled')}
              className="h-10 px-4 rounded-full border border-line bg-white text-ink-2 text-[13px] font-bold hover:bg-bg active:scale-98 transition-all"
            >
              Cancel
            </button>
          </div>
        );
      }
      if (request.status === 'acknowledged') {
        return (
          <div className={`flex ${isMobile ? 'gap-2' : 'flex-col gap-2 justify-center'}`}>
            <button
              type="button"
              data-testid={`action-order-preparing-${request.id}`}
              onClick={() => onTransition(request, 'preparing')}
              className={`${isMobile ? 'flex-1' : ''} h-12 px-5.5 rounded-full bg-accent text-ink text-[15px] font-extrabold hover:bg-accent-strong active:scale-98 transition-all shadow-xs`}
            >
              Start preparing
            </button>
            <button
              type="button"
              data-testid={`action-order-cancel-${request.id}`}
              onClick={() => onTransition(request, 'cancelled')}
              className="h-10 px-4 rounded-full border border-line bg-white text-ink-2 text-[13px] font-bold hover:bg-bg active:scale-98 transition-all"
            >
              Cancel
            </button>
          </div>
        );
      }
      if (request.status === 'preparing') {
        return (
          <div className={`flex ${isMobile ? 'gap-2' : 'flex-col gap-2 justify-center'}`}>
            <button
              type="button"
              data-testid={`action-order-ready-${request.id}`}
              onClick={() => onTransition(request, 'ready')}
              className={`${isMobile ? 'flex-1' : ''} h-12 px-5.5 rounded-full bg-accent text-ink text-[15px] font-extrabold hover:bg-accent-strong active:scale-98 transition-all shadow-xs`}
            >
              Ready
            </button>
          </div>
        );
      }
      if (request.status === 'ready') {
        return (
          <div className={`flex ${isMobile ? 'gap-2' : 'flex-col gap-2 justify-center'}`}>
            <button
              type="button"
              data-testid={`action-order-served-${request.id}`}
              onClick={() => onTransition(request, 'done')}
              className={`${isMobile ? 'flex-1' : ''} h-12 px-5.5 rounded-full bg-accent text-ink text-[15px] font-extrabold hover:bg-accent-strong active:scale-98 transition-all shadow-xs`}
            >
              Served
            </button>
          </div>
        );
      }
    }

    if (request.type === 'bill') {
      if (request.status === 'new') {
        return (
          <div className={`flex ${isMobile ? 'gap-2' : 'flex-col gap-2 justify-center'}`}>
            <button
              type="button"
              data-testid={`action-bill-sent-${request.id}`}
              onClick={() => onTransition(request, 'acknowledged')}
              className={`${isMobile ? 'flex-1' : ''} h-12 px-5.5 rounded-full bg-accent text-ink text-[15px] font-extrabold hover:bg-accent-strong active:scale-98 transition-all shadow-xs`}
            >
              Bill sent
            </button>
            {onViewBill && (
              <button
                type="button"
                data-testid={`action-view-bill-${request.id}`}
                onClick={() => onViewBill(request.table_number)}
                className="h-10 px-4 rounded-full border border-line bg-white text-ink-2 text-[13px] font-bold hover:bg-bg active:scale-98 transition-all"
              >
                View bill
              </button>
            )}
          </div>
        );
      }
      return (
        <div className={`flex ${isMobile ? 'gap-2' : 'flex-col gap-2 justify-center'}`}>
          <button
            type="button"
            data-testid={`action-bill-paid-close-${request.id}`}
            onClick={() => onTransition(request, 'done')}
            className={`${isMobile ? 'flex-1' : ''} h-12 px-5.5 rounded-full bg-accent text-ink text-[15px] font-extrabold hover:bg-accent-strong active:scale-98 transition-all shadow-xs`}
          >
            Paid &amp; close table
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <article
      data-testid={`request-card-${request.id}`}
      className={`bg-white rounded-3xl p-4 shadow-[0_6px_20px_rgba(107,66,38,0.08)] border-2 transition-all ${cardBorder} ${
        request.isFlashing ? 'animate-pulse ring-4 ring-accent' : ''
      } ${isMobile ? 'flex flex-col gap-3' : 'flex gap-4'}`}
    >
      {/* Top row on mobile, Left badge on desktop */}
      <div className={`flex items-center gap-3 ${isMobile ? 'w-full' : ''}`}>
        <div
          className={`rounded-2xl flex flex-col items-center justify-center shrink-0 font-extrabold shadow-2xs ${badgeStyle} ${
            isMobile ? 'w-12 h-12' : 'w-16 h-16'
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-80">
            Table
          </span>
          <b className={`${isMobile ? 'text-[20px] leading-[22px]' : 'text-[26px] leading-[28px]'}`}>
            {request.table_number}
          </b>
        </div>

        {/* In mobile, header details are next to the badge */}
        {isMobile && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-[15px] text-ink">
                {typeTitle}
              </span>
              {flag && (
                <span
                  className={`h-5.5 px-2 rounded-full text-[11px] font-extrabold inline-flex items-center ${flag.style}`}
                >
                  {flag.text}
                </span>
              )}
            </div>
            <div className="text-[12px] text-ink-2 font-semibold mt-0.5">
              {timeAgoText}
              {request.total_amount ? ` · ৳${request.total_amount}` : ''}
            </div>
          </div>
        )}
      </div>

      {/* Main content body on desktop */}
      <div className="flex-1 min-w-0">
        {!isMobile && (
          <div className="flex flex-wrap justify-between items-baseline gap-2">
            <div className="flex items-center gap-2 flex-wrap font-extrabold text-[15px] text-ink">
              {request.type === 'order' && <ShoppingBag className="w-4 h-4 text-brand-muted" />}
              {request.type === 'call_waiter' && <Bell className="w-4 h-4 text-brand-muted" />}
              {request.type === 'bill' && <Receipt className="w-4 h-4 text-brand-muted" />}
              <span>{typeTitle}</span>
              {flag && (
                <span
                  className={`h-5.5 px-2 rounded-full text-[11px] font-extrabold inline-flex items-center ${flag.style}`}
                >
                  {flag.text}
                </span>
              )}
            </div>
            <span className="text-[12.5px] text-ink-2 font-semibold">
              {timeAgoText}
              {request.total_amount ? ` · ৳${request.total_amount}` : ''}
            </span>
          </div>
        )}

        {/* Pending table warning message */}
        {isPendingSession && request.type === 'call_waiter' && (
          <div className="mt-2 text-[13px] text-ink-2 font-medium bg-bg p-2.5 rounded-xl border border-line">
            Table {request.table_number} was scanned but not approved yet. Check someone is seated, then approve.
          </div>
        )}

        {/* Bill breakdown summary */}
        {request.type === 'bill' && request.total_amount && (
          <div className="mt-2 text-[14px] text-ink font-medium bg-bg p-2.5 rounded-xl">
            Total <b>৳{request.total_amount}</b>{' '}
            <span className="text-ink-2 text-[12.5px]">
              (VAT 5% incl.)
            </span>
          </div>
        )}

        {/* Item rows */}
        {request.items && request.items.length > 0 && (
          <ul className={`mt-2 p-0 list-none flex flex-col gap-1 text-[14px] text-ink ${isMobile ? 'bg-bg p-3 rounded-2xl' : ''}`}>
            {request.items.map((item) => (
              <li key={item.id} className="flex flex-col">
                <div>
                  <b>{item.quantity}×</b> {item.name}
                </div>
                {item.optionsSummary && (
                  <span className="text-[12px] text-ink-2 font-medium">
                    {item.optionsSummary}
                  </span>
                )}
              </li>
            ))}
            {request.note && (
              <li className="mt-1 text-[13px] text-brand-muted font-semibold italic">
                Note: {request.note}
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Action Buttons */}
      {renderActions()}
    </article>
  );
}
