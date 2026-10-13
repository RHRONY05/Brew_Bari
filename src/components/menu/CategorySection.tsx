'use client';

import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, SlidersHorizontal } from 'lucide-react';
import type { Category, MenuItem } from '@/lib/menu/data';
import { ItemCard } from './ItemCard';
import { pick } from '@/lib/i18n';
import { CategoryIcon } from '@/components/ui/category-icon';
import { useTheme } from '@/themes/ThemeContext';

interface CategorySectionProps {
  category: Category;
  items: MenuItem[];
  locale: 'en' | 'bn';
  packageTier: number;
  onSelect: (item: MenuItem) => void;
  onAddDirectly: (item: MenuItem) => void;
  sectionRef?: (el: HTMLElement | null) => void;
}

export function CategorySection({
  category,
  items,
  locale,
  packageTier,
  onSelect,
  onAddDirectly,
  sectionRef,
}: CategorySectionProps) {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const sliderItemWidth =
    theme.layout.itemCard === 'bold' ? 'w-[158px]' : 'w-[165px] sm:w-[185px]';

  const catTitle = pick(category, 'name', locale);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const scrollAmount = direction === 'left' ? -260 : 260;
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <section
      id={`section-${category.id}`}
      ref={sectionRef}
      className="flex flex-col gap-3.5 scroll-mt-20"
      data-testid={`category-section-${category.id}`}
    >
      {/* Category Header with Title, Count, Navigation Arrows & View Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <CategoryIcon
            icon={category.icon}
            name={category.name_en}
            className="w-5 h-5 text-brand stroke-[2.2] shrink-0"
          />
          <h2 className="text-[17px] sm:text-[20px] font-extrabold text-ink tracking-tight truncate">
            {catTitle}
          </h2>
          <span
            className="h-5.5 px-2.5 rounded-full bg-surface-2 text-brand-muted text-[12px] font-extrabold flex items-center justify-center shrink-0"
            title={`${items.length} items`}
          >
            {locale === 'bn' ? `${items.length}টি` : `${items.length}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Slider Prev/Next Controls (when in slider view) */}
          {!isExpanded && items.length > 2 && (
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                aria-label={`Previous ${catTitle}`}
                onClick={() => scrollSlider('left')}
                className="w-7.5 h-7.5 rounded-full border border-line bg-white text-ink-2 flex items-center justify-center hover:bg-bg hover:text-ink active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
              </button>
              <button
                type="button"
                aria-label={`Next ${catTitle}`}
                onClick={() => scrollSlider('right')}
                className="w-7.5 h-7.5 rounded-full border border-line bg-white text-ink-2 flex items-center justify-center hover:bg-bg hover:text-ink active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>
          )}

          {/* View Toggle: View all (grid) vs Slider */}
          <button
            type="button"
            data-testid={`toggle-view-${category.id}`}
            onClick={() => setIsExpanded((prev) => !prev)}
            className="h-7.5 px-2.5 rounded-full bg-surface-2 border border-line/60 text-brand-muted hover:bg-accent hover:text-ink text-[12px] font-extrabold flex items-center gap-1 active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            {isExpanded ? (
              <>
                <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>{locale === 'bn' ? 'স্লাইডার' : 'Slider'}</span>
              </>
            ) : (
              <>
                <span>{locale === 'bn' ? 'সবগুলো' : 'View all'}</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Items Container: Slider vs Expanded Grid */}
      {isExpanded ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 animate-in fade-in duration-200">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              locale={locale}
              packageTier={packageTier}
              onSelect={onSelect}
              onAddDirectly={onAddDirectly}
            />
          ))}
        </div>
      ) : (
        <div
          ref={sliderRef}
          className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-2 snap-x -mx-4 px-4"
        >
          {items.map((item) => (
            <div key={item.id} className={`${sliderItemWidth} shrink-0 snap-start`}>
              <ItemCard
                item={item}
                locale={locale}
                packageTier={packageTier}
                onSelect={onSelect}
                onAddDirectly={onAddDirectly}
              />
            </div>
          ))}

          {/* End-of-slider quick expand card */}
          {items.length > 3 && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="w-[130px] shrink-0 snap-start rounded-3xl border-2 border-dashed border-line hover:border-brand-muted bg-white/70 hover:bg-bg p-4 flex flex-col items-center justify-center text-center gap-2 text-brand-muted transition-all cursor-pointer shadow-2xs"
            >
              <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-brand-muted font-extrabold text-[13px]">
                +{items.length}
              </div>
              <span className="text-[12px] font-extrabold text-ink">
                {locale === 'bn' ? 'সবগুলো দেখুন' : 'View all'}
              </span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
