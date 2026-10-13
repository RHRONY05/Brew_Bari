'use client';

import React from 'react';
import Image from 'next/image';
import { Plus, Clock } from 'lucide-react';
import type { MenuItem } from '@/lib/menu/data';
import { formatTaka } from '@/lib/money';
import { formatPrepTime } from '@/lib/menu/sort';
import { pick } from '@/lib/i18n';
import { VenueIcon } from '@/themes/ThemeContext';

interface ItemCardProps {
  item: MenuItem;
  locale: 'en' | 'bn';
  packageTier?: number;
  onSelect?: (item: MenuItem) => void;
  onAddDirectly?: (item: MenuItem) => void;
}

export function ItemCard({
  item,
  locale,
  packageTier = 3,
  onSelect,
  onAddDirectly,
}: ItemCardProps) {
  const isSoldOut = !item.is_available;
  const canAdd = !isSoldOut && packageTier > 1;

  const name = pick(item, 'name', locale);
  const desc = pick(item, 'description', locale) || '';
  const priceFormatted = formatTaka(item.price, locale);
  const compareAtFormatted = item.compare_at_price
    ? formatTaka(item.compare_at_price, locale)
    : null;
  const prepFormatted = formatPrepTime(item.prep_minutes, locale);

  // Badge logic
  let badge: { label: string; className: string } | null = null;
  if (isSoldOut) {
    badge = {
      label: locale === 'bn' ? 'শেষ' : 'Sold out',
      className: 'bg-danger text-white',
    };
  } else if (item.tags.includes('bestseller')) {
    badge = {
      label: locale === 'bn' ? 'জনপ্রিয়' : 'Bestseller',
      className: 'bg-accent text-ink',
    };
  } else if (item.tags.includes('new')) {
    badge = {
      label: locale === 'bn' ? 'নতুন' : 'New',
      className: 'bg-success text-white',
    };
  } else if (item.tags.includes('seasonal')) {
    badge = {
      label: locale === 'bn' ? 'মৌসুমি' : 'Seasonal',
      className: 'bg-brand text-bg',
    };
  }

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(item);
    }
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddDirectly) {
      onAddDirectly(item);
    } else if (onSelect) {
      onSelect(item);
    }
  };

  return (
    <article
      data-testid={`item-card-${item.id}`}
      onClick={handleCardClick}
      className={`card group cursor-pointer bg-white rounded-3xl p-2.5 flex flex-col gap-2 shadow-[0_6px_20px_rgb(var(--shadow-rgb)/0.08)] border border-line/50 transition-all hover:shadow-[0_8px_24px_rgb(var(--shadow-rgb)/0.12)] min-w-0 ${
        isSoldOut ? 'opacity-85' : ''
      }`}
    >
      {/* Thumbnail */}
      <div
        className={`thumb relative aspect-square rounded-2xl bg-surface-2 flex items-center justify-center overflow-hidden text-brand-muted ${
          isSoldOut ? 'grayscale opacity-75' : ''
        }`}
      >
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, 220px"
            className="object-cover transition-transform group-hover:scale-105 duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 opacity-70">
            <VenueIcon className="w-10 h-10 stroke-[1.4]" />
          </div>
        )}

        {/* Badge */}
        {badge && (
          <span
            className={`absolute top-2 left-2 h-[22px] px-2.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider flex items-center shadow-xs ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-1 flex flex-col gap-1 min-h-[72px]">
        <h3 className="font-extrabold text-[15px] leading-snug text-ink line-clamp-1">
          {name}
        </h3>
        {desc && (
          <p className="text-[12.5px] leading-tight text-ink-2 line-clamp-1">
            {desc}
          </p>
        )}
        {prepFormatted && (
          <span className="mt-auto inline-flex items-center gap-1 text-[11px] font-semibold text-ink-3">
            <Clock className="w-3 h-3 stroke-[2.2] text-brand-muted" />
            {prepFormatted}
          </span>
        )}
      </div>

      {/* Price & Action */}
      <div className="px-1 flex items-center justify-between gap-1 pt-1 border-t border-line/40">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-base font-extrabold text-ink tabular-nums">
            {priceFormatted}
          </span>
          {compareAtFormatted && (
            <span className="text-xs text-ink-3 line-through font-medium tabular-nums">
              {compareAtFormatted}
            </span>
          )}
        </div>

        {canAdd && (
          <button
            type="button"
            data-testid="item-card-add-button"
            aria-label={`Add ${name}`}
            onClick={handlePlusClick}
            className="w-9 h-9 rounded-full bg-accent text-ink flex items-center justify-center shadow-[0_4px_10px_rgb(var(--accent-rgb)/0.35)] transition-transform hover:scale-105 active:scale-95 shrink-0"
          >
            <Plus className="w-[18px] h-[18px] stroke-[2.5]" />
          </button>
        )}
      </div>
    </article>
  );
}
