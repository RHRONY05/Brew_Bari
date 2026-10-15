'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { Zap } from 'lucide-react';
import type { Category } from '@/lib/menu/data';
import { pick } from '@/lib/i18n';
import { CategoryIcon } from '@/components/ui/category-icon';
import { useTheme } from '@/themes/ThemeContext';

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  meal: '/images/categories/grill-ghar/meals.webp',
  'set meals': '/images/categories/grill-ghar/meals.webp',
  burger: '/images/categories/grill-ghar/burger.webp',
  burgers: '/images/categories/grill-ghar/burger.webp',
  chicken: '/images/categories/grill-ghar/chicken.webp',
  'fried chicken': '/images/categories/grill-ghar/chicken.webp',
  shawarma: '/images/categories/grill-ghar/shawarma.webp',
  'shawarma & wraps': '/images/categories/grill-ghar/shawarma.webp',
  fries: '/images/categories/grill-ghar/fries.webp',
  'fries & sides': '/images/categories/grill-ghar/fries.webp',
  shake: '/images/categories/grill-ghar/shakes.webp',
  shakes: '/images/categories/grill-ghar/shakes.webp',
  'shakes & drinks': '/images/categories/grill-ghar/shakes.webp',
};

interface CategoryNavProps {
  categories: Category[];
  activeCategoryId: string;
  hasQuickSection?: boolean;
  hasDeals?: boolean;
  locale: 'en' | 'bn';
  onSelectCategory: (id: string) => void;
}

export function CategoryNav({
  categories,
  activeCategoryId,
  hasQuickSection = false,
  hasDeals = false,
  locale,
  onSelectCategory,
}: CategoryNavProps) {
  const theme = useTheme();
  const isRoundIcons = theme.layout.categoryNav === 'round-icons';
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the active chip/button into view horizontally
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const activeEl = scrollContainerRef.current.querySelector<HTMLElement>(
      `[data-category-id="${activeCategoryId}"]`
    );
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeCategoryId]);

  // ---------------------------------------------------------------------------
  // ROUND ICONS VARIANT (Grill Ghar / fast food)
  // ---------------------------------------------------------------------------
  if (isRoundIcons) {
    const allLabel = locale === 'bn' ? 'সবগুলো' : 'All';
    const dealsLabel = locale === 'bn' ? 'ডিলস' : 'Deals';
    const isAllActive = activeCategoryId === 'all';
    const isDealsActive = activeCategoryId === 'deals';

    return (
      <nav
        aria-label="Categories"
        className="sticky top-0 z-20 w-full bg-bg/95 backdrop-blur-md py-3 border-b border-line/50"
      >
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-3.5 overflow-x-auto px-4 no-scrollbar scroll-smooth"
        >
          {/* First item: "All" (scroll to top) */}
          <button
            type="button"
            data-category-id="all"
            data-testid="chip-all"
            onClick={() => onSelectCategory('all')}
            className="flex flex-col items-center gap-1.5 shrink-0 w-[64px] cursor-pointer group"
          >
            <span
              className={`p-[3px] rounded-full border-2 transition-all ${
                isAllActive
                  ? 'border-brand'
                  : 'border-line group-hover:border-line-soft'
              }`}
            >
              <span
                className={`w-[54px] h-[54px] rounded-full flex items-center justify-center transition-all overflow-hidden ${
                  isAllActive
                    ? 'bg-surface-2 ring-2 ring-brand/20 shadow-xs'
                    : 'bg-white text-brand-dark group-hover:bg-surface-2/60'
                }`}
              >
                <div className="relative w-[38px] h-[38px] transition-transform duration-300 group-hover:scale-110">
                  <Image
                    src="/images/categories/grill-ghar/all.webp"
                    alt={allLabel}
                    fill
                    sizes="38px"
                    className="object-contain drop-shadow-2xs"
                    unoptimized
                  />
                </div>
              </span>
            </span>
            <span
              className={`text-[12px] truncate max-w-full text-center transition-colors ${
                isAllActive ? 'font-bold text-brand' : 'font-medium text-ink'
              }`}
            >
              {allLabel}
            </span>
          </button>

          {/* Deals icon if dealsRow is enabled */}
          {hasDeals && (
            <button
              type="button"
              data-category-id="deals"
              data-testid="chip-deals"
              onClick={() => onSelectCategory('deals')}
              className="flex flex-col items-center gap-1.5 shrink-0 w-[64px] cursor-pointer group"
            >
              <span
                className={`p-[3px] rounded-full border-2 transition-all ${
                  isDealsActive
                    ? 'border-brand'
                    : 'border-line group-hover:border-line-soft'
                }`}
              >
                <span
                  className={`w-[54px] h-[54px] rounded-full flex items-center justify-center transition-all overflow-hidden ${
                    isDealsActive
                      ? 'bg-surface-2 ring-2 ring-brand/20 shadow-xs'
                      : 'bg-white text-brand-dark group-hover:bg-surface-2/60'
                  }`}
                >
                  <div className="relative w-[38px] h-[38px] transition-transform duration-300 group-hover:scale-110">
                    <Image
                      src="/images/categories/grill-ghar/deals.webp"
                      alt={dealsLabel}
                      fill
                      sizes="38px"
                      className="object-contain drop-shadow-2xs"
                      unoptimized
                    />
                  </div>
                </span>
              </span>
              <span
                className={`text-[12px] truncate max-w-full text-center transition-colors ${
                  isDealsActive ? 'font-bold text-brand' : 'font-medium text-ink'
                }`}
              >
                {dealsLabel}
              </span>
            </button>
          )}

          {/* Categories list */}
          {categories.map((cat) => {
            const isActive = cat.id === activeCategoryId;
            const label = pick(cat, 'name', locale);
            const categoryImg =
              CATEGORY_IMAGE_MAP[cat.icon?.toLowerCase() || ''] ||
              CATEGORY_IMAGE_MAP[cat.name_en?.toLowerCase() || ''];

            return (
              <button
                key={cat.id}
                type="button"
                data-category-id={cat.id}
                data-testid={`chip-${cat.id}`}
                onClick={() => onSelectCategory(cat.id)}
                className="flex flex-col items-center gap-1.5 shrink-0 w-[64px] cursor-pointer group"
              >
                <span
                  className={`p-[3px] rounded-full border-2 transition-all ${
                    isActive
                      ? 'border-brand ring-2 ring-brand/20 shadow-xs'
                      : 'border-line group-hover:border-line-soft'
                  }`}
                >
                  <span
                    className={`w-[54px] h-[54px] rounded-full flex items-center justify-center transition-all overflow-hidden ${
                      isActive
                        ? categoryImg ? 'bg-surface-2' : 'bg-brand text-brand-ink shadow-sm'
                        : 'bg-white text-brand-dark group-hover:bg-surface-2/60'
                    }`}
                  >
                    {categoryImg ? (
                      <div className="relative w-[40px] h-[40px] transition-transform duration-300 group-hover:scale-110">
                        <Image
                          src={categoryImg}
                          alt={cat.name_en}
                          fill
                          sizes="40px"
                          className="object-contain drop-shadow-2xs"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <CategoryIcon
                        icon={cat.icon}
                        name={cat.name_en}
                        className="w-[26px] h-[26px] stroke-[1.8] shrink-0"
                      />
                    )}
                  </span>
                </span>
                <span
                  className={`text-[12px] truncate max-w-full text-center transition-colors ${
                    isActive ? 'font-bold text-brand' : 'font-medium text-ink'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // ---------------------------------------------------------------------------
  // CHIPS VARIANT (Brew Bari / café standard)
  // ---------------------------------------------------------------------------
  return (
    <nav
      aria-label="Categories"
      className="sticky top-0 z-20 w-full bg-bg/95 backdrop-blur-md py-3 border-b border-line/50"
    >
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto px-4 no-scrollbar scroll-smooth"
      >
        {/* Quick chip */}
        {hasQuickSection && (
          <button
            type="button"
            data-category-id="quick"
            data-testid="chip-quick"
            onClick={() => onSelectCategory('quick')}
            className={`h-10 px-4 rounded-full font-bold text-[14px] whitespace-nowrap flex items-center gap-2 transition-all shrink-0 ${
              activeCategoryId === 'quick'
                ? 'bg-brand text-bg shadow-[0_4px_12px_rgb(var(--shadow-rgb)/0.25)]'
                : 'bg-white border border-line text-ink hover:border-brand/40'
            }`}
          >
            <Zap className={`w-4 h-4 fill-current stroke-[2] ${activeCategoryId === 'quick' ? 'text-accent' : 'text-brand'}`} />
            <span>{locale === 'bn' ? 'ঝটপট' : 'Quick'}</span>
          </button>
        )}

        {/* Categories list */}
        {categories.map((cat) => {
          const isActive = cat.id === activeCategoryId;
          const label = pick(cat, 'name', locale);

          return (
            <button
              key={cat.id}
              type="button"
              data-category-id={cat.id}
              data-testid={`chip-${cat.id}`}
              onClick={() => onSelectCategory(cat.id)}
              className={`h-10 px-4 rounded-full font-bold text-[14px] whitespace-nowrap flex items-center gap-2 transition-all shrink-0 ${
                isActive
                  ? 'bg-brand text-bg shadow-[0_4px_12px_rgb(var(--shadow-rgb)/0.25)]'
                  : 'bg-white border border-line text-ink hover:border-brand/40'
              }`}
            >
              <CategoryIcon
                icon={cat.icon}
                name={cat.name_en}
                className={`w-4 h-4 stroke-[2.2] shrink-0 ${isActive ? 'text-accent' : 'text-brand'}`}
              />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
