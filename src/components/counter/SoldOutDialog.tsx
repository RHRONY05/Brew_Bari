'use client';

import React, { useState } from 'react';
import { X, Search, Check, AlertTriangle } from 'lucide-react';

export interface MenuItemAvailability {
  id: string;
  category_id: string;
  category_name: string;
  name_en: string;
  name_bn?: string | null;
  price: number;
  is_available: boolean;
}

interface SoldOutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItemAvailability[];
  onToggleAvailability: (itemId: string, currentStatus: boolean) => Promise<void>;
}

export function SoldOutDialog({
  isOpen,
  onClose,
  items,
  onToggleAvailability,
}: SoldOutDialogProps) {
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredItems = items.filter(
    (i) =>
      i.name_en.toLowerCase().includes(search.toLowerCase()) ||
      (i.name_bn && i.name_bn.includes(search)) ||
      i.category_name.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const categories = Array.from(new Set(filteredItems.map((i) => i.category_name)));

  const handleToggle = async (itemId: string, currentStatus: boolean) => {
    setUpdatingId(itemId);
    try {
      await onToggleAvailability(itemId, currentStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div
      data-testid="sold-out-dialog"
      className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4 selection:bg-accent"
    >
      <div className="w-full max-w-xl max-h-[85vh] bg-white rounded-3xl border border-line shadow-[0_20px_50px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-line flex items-center justify-between gap-3 bg-bg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-danger-soft text-danger flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-[17px] font-extrabold text-ink">
                Quick Sold-Out Menu
              </h2>
              <p className="text-[12px] text-ink-2 font-medium">
                Instantly mark items as available or sold out
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="close-sold-out-dialog"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-line text-ink-2 hover:text-ink flex items-center justify-center active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-line/60 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              data-testid="sold-out-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items or categories…"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-line bg-bg text-[14px] text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            />
          </div>
        </div>

        {/* List of items */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {categories.length === 0 ? (
            <div className="text-center py-8 text-[14px] text-ink-2 font-medium">
              No matching menu items found.
            </div>
          ) : (
            categories.map((cat) => {
              const catItems = filteredItems.filter((i) => i.category_name === cat);
              return (
                <div key={cat} className="flex flex-col gap-2">
                  <h3 className="text-[12px] font-extrabold text-ink-3 uppercase tracking-wider">
                    {cat}
                  </h3>
                  <div className="flex flex-col divide-y divide-line-soft border border-line rounded-2xl overflow-hidden bg-white">
                    {catItems.map((item) => {
                      const isUpdating = updatingId === item.id;
                      return (
                        <div
                          key={item.id}
                          className="p-3.5 flex items-center justify-between gap-3 hover:bg-bg/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-[14.5px] font-bold text-ink truncate">
                              {item.name_en}
                            </div>
                            <div className="text-[12px] text-ink-2 font-medium">
                              ৳{item.price}
                              {!item.is_available && (
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-danger-soft text-danger text-[10.5px] font-bold uppercase">
                                  Sold Out
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Instant Switch */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={item.is_available}
                            data-testid={`toggle-item-${item.id}`}
                            disabled={isUpdating}
                            onClick={() => handleToggle(item.id, item.is_available)}
                            className={`w-13 h-7.5 rounded-full p-1 flex items-center transition-colors cursor-pointer disabled:opacity-50 ${
                              item.is_available
                                ? 'bg-success justify-end'
                                : 'bg-line justify-start'
                            }`}
                          >
                            <span className="w-5.5 h-5.5 rounded-full bg-white shadow-xs" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
