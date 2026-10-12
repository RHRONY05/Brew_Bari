'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Sparkles, ArrowRight } from 'lucide-react';
import type { Offer, MenuItem } from '@/lib/menu/data';
import { pick } from '@/lib/i18n';

interface OfferCarouselProps {
  offers: Offer[];
  items?: MenuItem[];
  locale: 'en' | 'bn';
  onSelectOffer?: (offer: Offer) => void;
}

export function OfferCarousel({ offers, items, locale, onSelectOffer }: OfferCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (offers.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % offers.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [offers.length, activeIndex]);

  if (!offers || offers.length === 0) {
    return null;
  }

  const current = offers[activeIndex];
  const title = pick(current, 'title', locale);
  const subtitle = pick(current, 'subtitle', locale);
  const badge = pick(current, 'badge', locale);
  const ctaText = locale === 'bn' ? 'দেখুন' : 'View offer';

  const linkedItem = items?.find((it) => it.id === current.menu_item_id);
  const imageUrl = current.image_url || linkedItem?.image_url;

  return (
    <div className="w-full px-4" data-testid="offer-carousel">
      {/* Active offer card */}
      <div
        onClick={() => onSelectOffer?.(current)}
        className="relative min-h-[178px] h-[178px] sm:h-[188px] rounded-3xl bg-gradient-to-r from-[#4A2814] via-[#543019] to-[#3D2010] border border-[#F0DFCB]/15 overflow-hidden flex shadow-[0_10px_28px_rgba(59,34,19,0.22)] cursor-pointer group"
      >
        {/* Ambient Color Spray Glows */}
        <div className="absolute -right-6 -top-8 w-48 h-48 rounded-full bg-[#F2C27D]/30 blur-2xl pointer-events-none" />
        <div className="absolute right-6 -bottom-8 w-40 h-40 rounded-full bg-[#D97706]/20 blur-2xl pointer-events-none" />
        <div className="absolute right-28 top-6 w-24 h-24 rounded-full bg-[#FFF7EE]/10 blur-xl pointer-events-none" />

        {/* Ambient Organic Aura / Backplate Blob */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-[138px] h-[138px] sm:w-[152px] sm:h-[152px] rounded-[44%_56%_65%_35%/38%_62%_38%_62%] bg-gradient-to-tr from-[#8A5A37]/80 via-[#C48858]/40 to-[#F2C27D]/50 blur-[3px] pointer-events-none" />

        {/* Foreground Organic Blob Image Container */}
        {imageUrl ? (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-[124px] h-[124px] sm:w-[138px] sm:h-[138px] rounded-[48%_52%_58%_42%/42%_58%_42%_58%] overflow-hidden border-2 border-[#F2C27D]/85 shadow-[0_12px_28px_rgba(20,10,5,0.45)] bg-[#1F120A] pointer-events-none transition-transform duration-500 group-hover:scale-105">
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 140px, 160px"
              className="object-cover scale-105"
              priority={activeIndex === 0}
            />
            {/* Top specular highlight sheen */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/20 pointer-events-none" />
          </div>
        ) : (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-[124px] h-[124px] sm:w-[138px] sm:h-[138px] rounded-[48%_52%_58%_42%/42%_58%_42%_58%] bg-gradient-to-tr from-[#6B4226] to-[#F2C27D] flex items-center justify-center text-[#24170F] shadow-lg pointer-events-none">
            <Sparkles className="w-12 h-12 stroke-[1.8]" />
          </div>
        )}

        {/* Content (Left Column) */}
        <div className="relative p-5 pr-2 flex flex-col justify-between flex-1 min-w-0 max-w-[calc(100%-144px)] sm:max-w-[calc(100%-160px)] z-10">
          <div className="flex flex-col gap-1.5 min-w-0">
            {badge && (
              <span className="self-start h-5 px-2.5 rounded-full bg-[#F2C27D] text-[#24170F] text-[10px] font-extrabold uppercase tracking-wider flex items-center shadow-xs">
                {badge}
              </span>
            )}
            <h3 className="font-extrabold text-[18.5px] sm:text-[21px] leading-tight text-[#FFF7EE] tracking-tight [text-wrap:balance] break-normal line-clamp-2">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[12px] sm:text-[13px] leading-snug text-[#F3E3CF]/90 line-clamp-1 break-normal">
                {subtitle}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectOffer?.(current);
              }}
              className="h-8.5 px-3.5 rounded-full bg-[#F2C27D] hover:bg-[#ffe0ad] text-[#24170F] text-[12.5px] font-extrabold flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Pagination dots */}
      {offers.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 pt-2 pb-0.5">
          {offers.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Go to offer ${idx + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(idx);
              }}
              className="h-7 px-1 flex items-center justify-center cursor-pointer group"
            >
              <span
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeIndex
                    ? 'w-[20px] bg-[#6B4226]'
                    : 'w-1.5 bg-[#D9BF9E] group-hover:bg-[#8A5A37]'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
