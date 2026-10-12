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
        <h2 className="text-[18px] font-extrabold text-ink">Tables</h2>
        <span className="text-[12px] text-ink-2 font-semibold">
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
      <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[11.5px] text-ink-2 font-semibold pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 inline-block" /> Free
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-warning inline-block" /> Scanned
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-success-soft inline-block" /> Seated
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-warning inline-block" /> Calling
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-danger inline-block" /> New order
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-info inline-block" /> Bill
        </span>
      </div>
    </section>
  );
}
