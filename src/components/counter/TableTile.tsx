'use client';

import React from 'react';
import type { TableTileState } from '@/lib/requests';

export interface TableItem {
  id: string;
  number: number;
  label?: string | null;
  seats?: number | null;
  is_active: boolean;
}

interface TableTileProps {
  table: TableItem;
  state: TableTileState;
  elapsedTime?: string;
  onClick: () => void;
  isCompact?: boolean;
}

const STATE_CONFIG: Record<
  TableTileState,
  { label: string; short: string; style: string; badgeStyle: string }
> = {
  idle: {
    label: 'Free',
    short: 'Free',
    style: 'bg-white border-line text-ink-2 hover:border-line',
    badgeStyle: 'bg-surface-2 text-ink-2',
  },
  session_pending: {
    label: 'Scanned',
    short: 'Scan',
    style: 'bg-pending-soft border-warning text-warning hover:bg-warning-soft',
    badgeStyle: 'bg-warning text-warning',
  },
  session_open: {
    label: 'Seated',
    short: 'Seated',
    style: 'bg-success-soft border-success-soft text-success hover:bg-success-soft',
    badgeStyle: 'bg-success-soft text-success',
  },
  call_open: {
    label: 'Calling',
    short: 'Call',
    style: 'bg-warning-soft border-warning text-warning animate-pulse hover:bg-warning-soft',
    badgeStyle: 'bg-warning text-warning',
  },
  order_new: {
    label: 'New order',
    short: 'Order',
    style: 'bg-danger-soft border-danger text-danger hover:bg-danger-soft',
    badgeStyle: 'bg-danger-soft text-danger',
  },
  bill_open: {
    label: 'Bill',
    short: 'Bill',
    style: 'bg-info-soft border-info text-info hover:bg-info-soft',
    badgeStyle: 'bg-info-soft text-info',
  },
};

export function TableTile({
  table,
  state,
  elapsedTime = '—',
  onClick,
  isCompact = false,
}: TableTileProps) {
  const config = STATE_CONFIG[state] || STATE_CONFIG.idle;

  if (isCompact) {
    return (
      <button
        type="button"
        data-testid={`table-tile-${table.number}`}
        onClick={onClick}
        aria-label={`Table ${table.number}, ${config.label}`}
        className={`w-[58px] h-[58px] rounded-[14px] border-2 flex flex-col items-center justify-center shrink-0 p-0 cursor-pointer active:scale-95 transition-all shadow-2xs ${config.style}`}
      >
        <b className="text-[20px] leading-[22px] font-extrabold">{table.number}</b>
        <span className="text-[9.5px] font-extrabold uppercase tracking-wider">
          {config.short}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      data-testid={`table-tile-${table.number}`}
      onClick={onClick}
      aria-label={`Table ${table.number}, ${config.label}`}
      className={`rounded-[18px] p-3 flex flex-col gap-1 min-h-[96px] border-2 text-left cursor-pointer active:scale-98 transition-all shadow-2xs ${config.style}`}
    >
      <span className="text-[26px] font-extrabold tracking-tight leading-[30px]">
        {table.number}
      </span>
      <span className="text-[12px] font-extrabold flex items-center gap-1.5">
        {config.label}
      </span>
      <span className="text-[11.5px] font-semibold opacity-85 mt-auto">
        {elapsedTime}
      </span>
    </button>
  );
}
