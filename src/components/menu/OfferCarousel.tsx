'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
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

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % offers.length);
  }, [offers.length]);

  useEffect(() => {
    if (offers.length <= 1) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [offers.length, nextSlide]);

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
        className="relative h-[172px] rounded-3xl bg-[#6B4226] overflow-hidden flex shadow-[0_8px_24px_rgba(107,66,38,0.18)] cursor-pointer group"
      >
        {/* Background decorative circles & image frame */}
        <div className="absolute right-[-40px] top-[-30px] w-[230px] h-[230px] rounded-full bg-[#8A5A37] pointer-events-none" />
        {imageUrl ? (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-[124px] h-[124px] sm:w-[136px] sm:h-[136px] rounded-full overflow-hidden border-[3.5px] border-[#F2C27D] shadow-[0_8px_24px_rgba(36,23,15,0.4)] bg-[#24170F] pointer-events-none">
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 130px, 150px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority={activeIndex === 0}
            />
          </div>
        ) : (
          <div className="absolute right-[18px] top-[26px] w-[120px] h-[120px] rounded-full bg-[#F2C27D] flex items-center justify-center text-[#6B4226] shadow-md pointer-events-none">
            <Sparkles className="w-14 h-14 stroke-[1.5]" />
          </div>
        )}

        {/* Content */}
        <div className="relative p-5 flex flex-col justify-between max-w-[210px] sm:max-w-[240px] z-10">
          <div className="flex flex-col gap-1.5">
            {badge && (
              <span className="self-start h-[22px] px-2.5 rounded-full bg-[#F2C27D] text-[#24170F] text-[10.5px] font-extrabold uppercase tracking-wider flex items-center">
                {badge}
              </span>
            )}
            <h3 className="font-extrabold text-[20px] leading-tight text-[#FFF7EE] tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[12.5px] leading-snug text-[#F3E3CF] line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectOffer?.(current);
            }}
            className="self-start h-9 px-4 rounded-full bg-[#FFF7EE] text-[#24170F] text-[13px] font-bold flex items-center hover:bg-white active:scale-95 transition-all shadow-xs"
          >
            {ctaText}
          </button>
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
