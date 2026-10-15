'use client';

import React from 'react';
import Image from 'next/image';
import { Plus, Clock } from 'lucide-react';
import type { MenuItem } from '@/lib/menu/data';
import { formatTaka } from '@/lib/money';
import { formatPrepTime } from '@/lib/menu/sort';
import { pick } from '@/lib/i18n';
import { VenueIcon, useTheme } from '@/themes/ThemeContext';

interface ItemCardProps {
  item: MenuItem;
  locale: 'en' | 'bn';
  packageTier?: number;
  onSelect?: (item: MenuItem) => void;
  onAddDirectly?: (item: MenuItem) => void;
}

export const SPICE_WORDS: Record<'en' | 'bn', string[]> = {
  en: ['Not spicy', 'Mild', 'Medium', 'Hot', 'Naga hot'],
  bn: ['ঝাল নেই', 'মৃদু', 'মাঝারি', 'ঝাল', 'নাগা ঝাল'],
};

export function ItemCard({
  item,
  locale,
  packageTier = 3,
  onSelect,
  onAddDirectly,
}: ItemCardProps) {
  const theme = useTheme();
  const isBold = theme.layout.itemCard === 'bold';

  const isSoldOut = !item.is_available;
  const canAdd = !isSoldOut && packageTier > 1;

  const name = pick(item, 'name', locale);
  const desc = pick(item, 'description', locale) || '';
  const priceFormatted = formatTaka(item.price, locale);
  const compareAtFormatted = item.compare_at_price
    ? formatTaka(item.compare_at_price, locale)
    : null;
  const prepFormatted = formatPrepTime(item.prep_minutes, locale);

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

  // ---------------------------------------------------------------------------
  // BOLD VARIANT (Grill Ghar / fast food style)
  // ---------------------------------------------------------------------------
  if (isBold) {
    let boldBadge: { label: string; className: string } | null = null;
    if (item.tags.includes('bestseller')) {
      boldBadge = {
        label: locale === 'bn' ? 'জনপ্রিয়' : 'Bestseller',
        className: 'bg-brand text-brand-ink',
      };
    } else if (item.tags.includes('new')) {
      boldBadge = {
        label: locale === 'bn' ? 'নতুন' : 'New',
        className: 'bg-accent text-accent-ink',
      };
    } else if (item.tags.includes('seasonal')) {
      boldBadge = {
        label: locale === 'bn' ? 'মৌসুমি' : 'Seasonal',
        className: 'bg-brand text-brand-ink',
      };
    }

    const hasSpice = item.spice_level !== null && item.spice_level !== undefined;
    const spiceLevel = hasSpice ? Math.max(0, Math.min(4, item.spice_level!)) : 0;
    const chiliCount = Math.max(0, Math.min(3, spiceLevel === 4 ? 3 : spiceLevel));
    const spiceText = hasSpice ? SPICE_WORDS[locale][spiceLevel] : '';

    return (
      <article
        data-testid={`item-card-${item.id}`}
        onClick={handleCardClick}
        className={`card group cursor-pointer bg-white rounded-[20px] border border-line shadow-[0_6px_18px_rgb(var(--shadow-rgb)/0.07)] overflow-hidden flex flex-col transition-all hover:shadow-[0_8px_24px_rgb(var(--shadow-rgb)/0.12)] min-w-0 ${
          isSoldOut ? 'opacity-55' : ''
        }`}
      >
        {/* Photo with top badges */}
        <div className="relative aspect-[1/0.82] bg-surface-2 overflow-hidden flex items-center justify-center">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, 220px"
              className={`${
                item.image_url.includes('/grill-ghar/') &&
                (item.image_url.includes('combo') ||
                  item.image_url.includes('duo') ||
                  item.image_url.includes('bucket'))
                  ? 'object-contain p-2.5'
                  : 'object-cover'
              } transition-transform group-hover:scale-105 duration-300`}
              unoptimized={item.image_url.includes('/grill-ghar/')}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 opacity-70">
              <VenueIcon className="w-10 h-10 stroke-[1.4]" />
            </div>
          )}

          {/* Badge top-left */}
          {boldBadge && (
            <span
              className={`absolute top-2 left-2 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs ${boldBadge.className}`}
            >
              {boldBadge.label}
            </span>
          )}

          {/* Prep time top-right */}
          {prepFormatted && (
            <span className="absolute top-2 right-2 bg-white/95 text-ink text-[10.5px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
              <Clock className="w-3 h-3 stroke-[2.2] text-brand-muted" />
              <span>{prepFormatted}</span>
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-2.5 pt-2 flex flex-col gap-1 flex-1">
          <h3 className="font-bold text-[13.5px] leading-tight text-ink line-clamp-1">
            {name}
          </h3>

          {/* Chili spice row */}
          {hasSpice && (
            <div
              className="flex items-center gap-1 text-brand text-[11px]"
              aria-label={`Spice: ${spiceText}`}
            >
              <div className="flex items-center gap-0.5">
                {Array.from({ length: chiliCount }).map((_, i) => (
                  <svg
                    key={i}
                    aria-hidden="true"
                    className="w-3 h-3 fill-current shrink-0"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17 3c-.6 1-.5 2 .2 2.7C14 6 11 9 9.5 13 8 16.8 5.5 19 3 20c4.5 1.3 10.3.2 13.9-4 2.6-3 3.5-6.5 2.6-9.2.9-.4 1.4-1.1 1.5-2-.9.4-1.9.3-2.6-.3C18 4 17.5 3.6 17 3z" />
                  </svg>
                ))}
              </div>
              <span className="text-[11px] text-ink-2 font-medium ml-0.5">
                {spiceText}
              </span>
            </div>
          )}

          {/* Price & Action */}
          <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-line/30">
            <span className="font-extrabold text-[15px] text-ink tabular-nums">
              {priceFormatted}
            </span>

            {isSoldOut ? (
              <span className="text-[11px] font-bold text-ink-3">
                {locale === 'bn' ? 'শেষ' : 'Sold out'}
              </span>
            ) : canAdd ? (
              <button
                type="button"
                data-testid="item-card-add-button"
                aria-label={`Add ${name}`}
                onClick={handlePlusClick}
                className="w-8 h-8 rounded-full bg-brand text-brand-ink flex items-center justify-center shadow-xs transition-transform hover:scale-105 active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.8]" />
              </button>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  // ---------------------------------------------------------------------------
  // STANDARD VARIANT (Brew Bari / café style)
  // ---------------------------------------------------------------------------
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
