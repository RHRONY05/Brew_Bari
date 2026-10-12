'use client';

import React from 'react';
import { TableTile, type TableItem } from './TableTile';
import type { TableTileState } from '@/lib/requests';

interface TableWithState {
  table: TableItem;
  state: TableTileState;
  elapsedTime?: string;
}

interface TableGridProps {
  tables: TableWithState[];
  onSelectTable: (table: TableItem) => void;
  className?: string;
}

export function TableGrid({ tables, onSelectTable, className = '' }: TableGridProps) {
  return (
    <section
      aria-label="Tables"
      className={`flex flex-col gap-3 ${className}`}
    >
      <div className="flex justify-between items-baseline">
        <h2 className="text-[18px] font-extrabold text-[#24170F]">Tables</h2>
        <span className="text-[12px] text-[#6F5A4B] font-semibold">
          Tap a table for details
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {tables.map(({ table, state, elapsedTime }) => (
          <TableTile
            key={table.id}
            table={table}
            state={state}
            elapsedTime={elapsedTime}
            onClick={() => onSelectTable(table)}
          />
        ))}
      </div>

      {/* State Legend */}
      <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[11.5px] text-[#6F5A4B] font-semibold pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 inline-block" /> Free
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E9C95A] inline-block" /> Scanned
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#9ED1B6] inline-block" /> Seated
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C77C0E] inline-block" /> Calling
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#B83B30] inline-block" /> New order
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#7FA6DE] inline-block" /> Bill
        </span>
      </div>
    </section>
  );
}
