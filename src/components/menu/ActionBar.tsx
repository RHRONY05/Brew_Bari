'use client';

import React from 'react';
import { Bell, ShoppingBag, ChevronRight } from 'lucide-react';
import { formatTaka } from '@/lib/money';

interface ActionBarProps {
  packageTier: number;
  locale: 'en' | 'bn';
  cartCount: number;
  cartSubtotal: number;
  activeStatusText?: string | null;
  onCallWaiter: () => void;
  onOpenCart: () => void;
  onOpenStatus?: () => void;
}

export function ActionBar({
  packageTier,
  locale,
  cartCount,
  cartSubtotal,
  activeStatusText,
  onCallWaiter,
  onOpenCart,
  onOpenStatus,
}: ActionBarProps) {
  // P1: No action bar at all
  if (packageTier < 2) {
    return null;
  }

  const callWaiterLabel = locale === 'bn' ? 'ওয়েটার ডাকুন' : 'Call waiter';
  const viewOrderLabel = locale === 'bn' ? 'অর্ডার দেখুন' : 'View order';

  return (
    <div
      data-testid="bottom-action-bar"
      className="fixed bottom-0 inset-x-0 z-30 p-3 pb-4 pointer-events-none flex flex-col gap-2 max-w-xl mx-auto"
    >
      {/* Floating status pill if an active request/order is in progress */}
      {activeStatusText && onOpenStatus && (
        <button
          type="button"
          onClick={onOpenStatus}
          data-testid="floating-status-pill"
          className="pointer-events-auto self-center h-[34px] px-3.5 rounded-full bg-white shadow-[0_6px_20px_rgba(107,66,38,0.14)] border border-line/60 flex items-center gap-2 text-[13px] font-bold text-ink hover:bg-bg active:scale-95 transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          <span>{activeStatusText}</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      )}

      {/* Main bar container */}
      <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-[28px] p-2 shadow-[0_-4px_24px_rgba(36,23,15,0.12)] border border-line/80 flex gap-2">
        {/* Call waiter button */}
        <button
          type="button"
          data-testid="action-call-waiter"
          onClick={onCallWaiter}
          className="h-[52px] px-4.5 rounded-full bg-brand text-bg text-[14.5px] font-bold flex items-center gap-2 hover:bg-brand-dark active:scale-95 transition-all shrink-0 shadow-sm"
        >
          <Bell className="w-5 h-5 stroke-[2]" />
          <span>{callWaiterLabel}</span>
        </button>

        {/* View order / Cart button */}
        {cartCount > 0 ? (
          <button
            type="button"
            data-testid="action-view-order"
            onClick={onOpenCart}
            className="flex-1 h-[52px] rounded-full bg-accent text-ink text-[15px] font-extrabold flex items-center justify-center gap-2 hover:bg-accent-strong active:scale-98 transition-all shadow-sm min-w-0"
          >
            <div className="relative flex items-center shrink-0">
              <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
              <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] rounded-full bg-ink text-bg text-[10.5px] font-extrabold flex items-center justify-center px-1">
                {cartCount}
              </span>
            </div>
            <span className="truncate">
              {viewOrderLabel} · {formatTaka(cartSubtotal, locale)}
            </span>
          </button>
        ) : packageTier === 3 ? (
          <button
            type="button"
            data-testid="action-empty-cart"
            onClick={onOpenCart}
            className="flex-1 h-[52px] rounded-full bg-bg text-ink-3 text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-surface-2 transition-all"
          >
            <ShoppingBag className="w-5 h-5 stroke-[2]" />
            <span>{locale === 'bn' ? 'অর্ডার খালি' : 'Cart empty'}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
