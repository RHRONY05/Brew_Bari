'use client';

import React, { useRef, useEffect } from 'react';
import { Zap } from 'lucide-react';
import type { Category } from '@/lib/menu/data';
import { pick } from '@/lib/i18n';

interface CategoryNavProps {
  categories: Category[];
  activeCategoryId: string;
  hasQuickSection?: boolean;
  locale: 'en' | 'bn';
  onSelectCategory: (id: string) => void;
}

export function CategoryNav({
  categories,
  activeCategoryId,
  hasQuickSection = false,
  locale,
  onSelectCategory,
}: CategoryNavProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the active chip into view horizontally
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const activeEl = scrollContainerRef.current.querySelector<HTMLElement>(
      `[data-category-id="${activeCategoryId}"]`
    );
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeCategoryId]);

  return (
    <nav
      aria-label="Categories"
      className="sticky top-0 z-20 w-full bg-[#FFF7EE]/95 backdrop-blur-md py-3 border-b border-[#F0DFCB]/50"
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
                ? 'bg-[#6B4226] text-[#FFF7EE] shadow-[0_4px_12px_rgba(107,66,38,0.25)]'
                : 'bg-white border border-[#F0DFCB] text-[#24170F] hover:border-[#6B4226]/40'
            }`}
          >
            <Zap className={`w-4 h-4 fill-current stroke-[2] ${activeCategoryId === 'quick' ? 'text-[#F2C27D]' : 'text-[#6B4226]'}`} />
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
                  ? 'bg-[#6B4226] text-[#FFF7EE] shadow-[0_4px_12px_rgba(107,66,38,0.25)]'
                  : 'bg-white border border-[#F0DFCB] text-[#24170F] hover:border-[#6B4226]/40'
              }`}
            >
              {cat.icon && <span className="text-base leading-none">{cat.icon}</span>}
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
