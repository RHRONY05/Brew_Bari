'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import type { MenuItem } from '@/lib/menu/data';
import { formatTaka } from '@/lib/money';
import { pick } from '@/lib/i18n';
import { useTheme } from '@/themes/ThemeContext';

interface DealsRowProps {
  items: MenuItem[];
  locale: 'en' | 'bn';
  packageTier?: number;
  onSelect: (item: MenuItem) => void;
  onAddDirectly?: (item: MenuItem) => void;
}

export function DealsRow({
  items,
  locale,
  packageTier = 3,
  onSelect,
  onAddDirectly,
}: DealsRowProps) {
  const theme = useTheme();

  // Find all items that have a compare_at_price higher than base price
  const deals = useMemo(() => {
    return items.filter(
      (item) => item.compare_at_price != null && item.compare_at_price > item.price
    );
  }, [items]);

  // Hidden when there are no deals
  if (deals.length === 0) {
    return null;
  }

  const title =
    theme.copy.dealsTitle?.[locale] || (locale === 'bn' ? 'মিল ডিলস' : 'Meal deals');
  const viewAllText = locale === 'bn' ? 'সবগুলো →' : 'View all →';
  const saveLabel = locale === 'bn' ? 'সেভ' : 'SAVE';

  return (
    <section
      id="section-deals"
      aria-labelledby="deals-heading"
      data-testid="deals-row-section"
      className="pt-4 scroll-mt-20"
    >
      <div className="flex items-baseline justify-between px-4 pb-3">
        <h2
          id="deals-heading"
          className="font-heading font-extrabold text-[20px] text-ink tracking-tight"
        >
          {title}
        </h2>
        <a
          href="#section-burgers"
          className="text-[13px] font-semibold text-brand hover:text-brand-dark transition-colors"
        >
          {viewAllText}
        </a>
      </div>

      <div
        data-testid="deals-slider"
        className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth px-4 pb-2 snap-x"
      >
        {deals.map((item) => {
          const name = pick(item, 'name', locale);
          const desc = pick(item, 'description', locale) || '';
          const priceFormatted = formatTaka(item.price, locale);
          const wasFormatted = item.compare_at_price
            ? formatTaka(item.compare_at_price, locale)
            : null;
          const savePercent = Math.round(
            ((item.compare_at_price! - item.price) / item.compare_at_price!) * 100
          );
          const isSoldOut = !item.is_available;
          const canAdd = !isSoldOut && packageTier > 1;

          return (
            <div
              key={item.id}
              data-testid={`deal-card-${item.id}`}
              onClick={() => onSelect(item)}
              className={`w-[176px] shrink-0 snap-start bg-white rounded-[20px] border border-line shadow-[0_6px_18px_rgb(var(--shadow-rgb)/0.07)] overflow-hidden flex flex-col cursor-pointer transition-transform hover:-translate-y-0.5 ${
                isSoldOut ? 'opacity-55' : ''
              }`}
            >
              {/* Photo Area */}
              <div className="relative h-[118px] bg-surface-2 overflow-hidden flex items-center justify-center">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={name}
                    fill
                    sizes="176px"
                    className="object-cover"
                  />
                ) : (
                  <div className="text-[10px] font-bold text-ink-3">No photo</div>
                )}
                {/* SAVE X% badge */}
                <span className="absolute top-2.5 left-2.5 bg-brand text-brand-ink text-[11px] font-extrabold px-2.5 py-1 rounded-full tracking-wide shadow-xs">
                  {saveLabel} {savePercent}%
                </span>
              </div>

              {/* Info & Price */}
              <div className="p-3 flex flex-col gap-1 flex-1">
                <div className="font-bold text-[14px] leading-snug text-ink line-clamp-1">
                  {name}
                </div>
                {desc && (
                  <div className="text-[11.5px] text-ink-2 leading-tight line-clamp-1">
                    {desc}
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto pt-2">
                  <div className="flex flex-col leading-none">
                    <span className="font-extrabold text-[16px] text-ink tabular-nums">
                      {priceFormatted}
                    </span>
                    {wasFormatted && (
                      <span className="text-[11px] text-ink-3 line-through tabular-nums mt-0.5">
                        {wasFormatted}
                      </span>
                    )}
                  </div>

                  {canAdd ? (
                    <button
                      type="button"
                      data-testid={`deal-add-${item.id}`}
                      aria-label={`Add ${name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onAddDirectly) {
                          onAddDirectly(item);
                        } else {
                          onSelect(item);
                        }
                      }}
                      className="w-[34px] h-[34px] rounded-full bg-brand text-brand-ink flex items-center justify-center shadow-[0_4px_10px_rgb(var(--brand-rgb,210_41_28)/0.35)] hover:bg-brand-muted active:scale-95 transition-all shrink-0 cursor-pointer"
                    >
                      <Plus className="w-[18px] h-[18px] stroke-[2.8]" />
                    </button>
                  ) : isSoldOut ? (
                    <span className="text-[11px] font-bold text-ink-3">
                      {locale === 'bn' ? 'শেষ' : 'Sold out'}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
