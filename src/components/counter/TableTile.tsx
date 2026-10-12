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
    style: 'bg-white border-[#F0DFCB] text-[#6F5A4B] hover:border-[#D9C4AC]',
    badgeStyle: 'bg-[#F4ECE2] text-[#6F5A4B]',
  },
  session_pending: {
    label: 'Scanned',
    short: 'Scan',
    style: 'bg-[#FFF4D1] border-[#E9C95A] text-[#6E5500] hover:bg-[#FDF0BE]',
    badgeStyle: 'bg-[#FBE490] text-[#6E5500]',
  },
  session_open: {
    label: 'Seated',
    short: 'Seated',
    style: 'bg-[#E7F3EC] border-[#9ED1B6] text-[#1F5C3F] hover:bg-[#D8ECE0]',
    badgeStyle: 'bg-[#CFE8D9] text-[#1F5C3F]',
  },
  call_open: {
    label: 'Calling',
    short: 'Call',
    style: 'bg-[#FDEBD2] border-[#C77C0E] text-[#8A4D06] animate-pulse hover:bg-[#FCDFA8]',
    badgeStyle: 'bg-[#FAD098] text-[#8A4D06]',
  },
  order_new: {
    label: 'New order',
    short: 'Order',
    style: 'bg-[#FBE3E0] border-[#B83B30] text-[#9A2F25] hover:bg-[#F8D2CD]',
    badgeStyle: 'bg-[#F5BFB8] text-[#9A2F25]',
  },
  bill_open: {
    label: 'Bill',
    short: 'Bill',
    style: 'bg-[#E3EDFA] border-[#7FA6DE] text-[#22508F] hover:bg-[#D2E2F7]',
    badgeStyle: 'bg-[#C1D7F5] text-[#22508F]',
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
