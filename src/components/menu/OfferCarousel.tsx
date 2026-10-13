'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Sparkles, ArrowRight } from 'lucide-react';
import type { Offer, MenuItem } from '@/lib/menu/data';
import { pick } from '@/lib/i18n';
import { formatTaka } from '@/lib/money';
import { useTheme } from '@/themes/ThemeContext';
import type { Theme } from '@/themes';

interface OfferCarouselProps {
  offers: Offer[];
  items?: MenuItem[];
  locale: 'en' | 'bn';
  onSelectOffer?: (offer: Offer) => void;
  /** Artwork behind the offer image, chosen by the restaurant's theme. */
  decoration?: Theme['layout']['offerDecoration'];
}

function LiquidSplashCrown() {
  return (
    <svg
      viewBox="0 0 210 210"
      className="absolute right-[-14px] top-1/2 -translate-y-1/2 w-[156px] h-[156px] sm:w-[172px] sm:h-[172px] pointer-events-none select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Rich glossy melted chocolate / mocha gradient */}
        <linearGradient id="liquidChocGrad" x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" style={{ stopColor: 'var(--deco-1)' }} />
          <stop offset="35%" style={{ stopColor: 'var(--deco-2)' }} />
          <stop offset="70%" style={{ stopColor: 'var(--deco-3)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--deco-4)' }} />
        </linearGradient>
        {/* Golden caramel specular edge shine */}
        <linearGradient id="chocShineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--deco-5)' }} stopOpacity="0.95" />
          <stop offset="45%" style={{ stopColor: 'var(--deco-6)' }} stopOpacity="0.8" />
          <stop offset="100%" style={{ stopColor: 'var(--deco-7)' }} stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Main Liquid Chocolate Splash Crown & Radiating Splatter Tendrils */}
      <path
        d="M 105 28
           C 114 14, 126 12, 130 25
           C 134 36, 142 42, 152 38
           C 166 32, 176 42, 172 56
           C 168 67, 176 75, 186 80
           C 200 87, 198 102, 190 112
           C 183 120, 187 130, 194 138
           C 202 150, 194 165, 179 168
           C 168 171, 164 180, 166 191
           C 168 204, 153 211, 141 202
           C 132 195, 122 199, 116 207
           C 105 218, 91 213, 87 200
           C 83 189, 73 187, 65 191
           C 50 198, 38 185, 43 170
           C 47 159, 40 151, 30 146
           C 16 139, 14 124, 25 114
           C 33 105, 31 95, 22 87
           C 12 75, 23 60, 37 63
           C 48 65, 56 57, 56 46
           C 56 31, 73 24, 85 35
           C 93 42, 100 39, 105 28 Z"
        fill="url(#liquidChocGrad)"
        stroke="url(#chocShineGrad)"
        strokeWidth="2"
      />

      {/* Glossy Edge Specular Rim Accents */}
      <path
        d="M 108 30 C 115 18, 125 16, 129 27
           M 152 40 C 163 34, 172 44, 170 55
           M 187 82 C 197 88, 195 99, 188 109
           M 166 189 C 166 200, 153 207, 143 200
           M 86 198 C 82 190, 72 189, 65 192
           M 31 144 C 18 138, 18 126, 27 118
           M 56 48 C 58 35, 73 28, 83 37"
        style={{ stroke: 'var(--deco-5)' }}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Radiating Splash Droplets with Glossy Reflection Glints */}
      {/* Top Droplets */}
      <circle cx="106" cy="12" r="3.5" style={{ fill: 'var(--deco-2)' }} />
      <circle cx="105" cy="11" r="1.2" style={{ fill: 'var(--bg)' }} opacity="0.9" />
      <circle cx="124" cy="7" r="2.4" style={{ fill: 'var(--deco-8)' }} />
      <circle cx="90" cy="17" r="1.8" style={{ fill: 'var(--deco-3)' }} />

      {/* Top-Right Droplets */}
      <circle cx="186" cy="30" r="3.8" style={{ fill: 'var(--deco-2)' }} />
      <circle cx="185" cy="29" r="1.3" style={{ fill: 'var(--bg)' }} opacity="0.9" />
      <circle cx="198" cy="46" r="2.5" style={{ fill: 'var(--deco-8)' }} />
      <circle cx="172" cy="20" r="1.8" style={{ fill: 'var(--deco-3)' }} />

      {/* Right Droplets */}
      <circle cx="204" cy="106" r="4.2" style={{ fill: 'var(--deco-3)' }} />
      <circle cx="203" cy="105" r="1.5" style={{ fill: 'var(--bg)' }} opacity="0.9" />
      <circle cx="198" cy="124" r="2.4" style={{ fill: 'var(--deco-8)' }} />
      <circle cx="206" cy="74" r="1.9" style={{ fill: 'var(--deco-2)' }} />

      {/* Bottom-Right Droplets */}
      <circle cx="190" cy="174" r="3.8" style={{ fill: 'var(--deco-3)' }} />
      <circle cx="189" cy="173" r="1.3" style={{ fill: 'var(--bg)' }} opacity="0.9" />
      <circle cx="176" cy="198" r="2.6" style={{ fill: 'var(--deco-2)' }} />
      <circle cx="200" cy="154" r="1.8" style={{ fill: 'var(--deco-8)' }} />

      {/* Bottom Droplets */}
      <circle cx="116" cy="205" r="3.6" style={{ fill: 'var(--deco-2)' }} />
      <circle cx="115" cy="204" r="1.2" style={{ fill: 'var(--bg)' }} opacity="0.9" />
      <circle cx="80" cy="208" r="2.6" style={{ fill: 'var(--deco-3)' }} />
      <circle cx="98" cy="209" r="1.7" style={{ fill: 'var(--deco-8)' }} />

      {/* Bottom-Left Droplets */}
      <circle cx="32" cy="184" r="3.8" style={{ fill: 'var(--deco-3)' }} />
      <circle cx="31" cy="183" r="1.3" style={{ fill: 'var(--bg)' }} opacity="0.9" />
      <circle cx="48" cy="200" r="2.4" style={{ fill: 'var(--deco-2)' }} />
      <circle cx="18" cy="164" r="1.9" style={{ fill: 'var(--deco-8)' }} />

      {/* Left Droplets */}
      <circle cx="6" cy="112" r="4.2" style={{ fill: 'var(--deco-3)' }} />
      <circle cx="5" cy="111" r="1.5" style={{ fill: 'var(--bg)' }} opacity="0.9" />
      <circle cx="12" cy="92" r="2.5" style={{ fill: 'var(--deco-2)' }} />
      <circle cx="10" cy="130" r="2" style={{ fill: 'var(--deco-8)' }} />

      {/* Top-Left Droplets */}
      <circle cx="26" cy="46" r="3.8" style={{ fill: 'var(--deco-2)' }} />
      <circle cx="25" cy="45" r="1.3" style={{ fill: 'var(--bg)' }} opacity="0.9" />
      <circle cx="44" cy="22" r="2.6" style={{ fill: 'var(--deco-3)' }} />
      <circle cx="14" cy="66" r="1.9" style={{ fill: 'var(--deco-8)' }} />
    </svg>
  );
}

export function OfferCarousel({ offers, items, locale, onSelectOffer, decoration = 'none' }: OfferCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (offers.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % offers.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [offers.length, activeIndex]);

  const theme = useTheme();
  const isHero = theme.layout.offerStyle === 'hero';

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

  if (isHero) {
    return (
      <div className="w-full px-4" data-testid="offer-carousel">
        {/* Hero offer card */}
        <div
          onClick={() => onSelectOffer?.(current)}
          className="relative min-h-[210px] h-[210px] rounded-[24px] bg-gradient-to-r from-[var(--offer-from,#D2291C)] via-[var(--offer-via,#B32116)] to-[var(--offer-to,#8E1A12)] overflow-hidden shadow-[0_14px_30px_rgb(var(--offer-shadow-rgb,142_26_18)/0.35)] cursor-pointer group text-brand-ink"
        >
          {/* Photo slot (bleeds off right side) */}
          <div className="absolute -right-7 top-[18px] w-[210px] h-[210px] rounded-full bg-[var(--offer-image-bg,#F7C9A8)] border-[6px] border-white/20 overflow-hidden pointer-events-none transition-transform duration-500 group-hover:scale-105 shadow-inner">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={title}
                fill
                sizes="210px"
                className="object-cover"
                priority={activeIndex === 0}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brand-dark">
                <Sparkles className="w-12 h-12 stroke-[1.8]" />
              </div>
            )}
          </div>

          {/* Content (Left Column) */}
          <div className="relative p-5 pt-5 pb-4 flex flex-col justify-between h-full z-10 w-[210px] sm:w-[240px]">
            <div className="flex flex-col gap-2 min-w-0">
              {badge && (
                <span className="self-start h-5 px-2.5 rounded-full bg-accent text-accent-ink text-[11px] font-bold uppercase tracking-wider flex items-center shadow-xs">
                  {badge}
                </span>
              )}
              <h3 className="font-heading font-black text-[23px] sm:text-[26px] leading-[1.02] tracking-wide text-brand-ink uppercase whitespace-pre-line">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[12px] leading-snug text-brand-ink/90 line-clamp-2">
                  {subtitle}
                </p>
              )}
            </div>

            <div className="pt-2">
              <span className="inline-flex items-center gap-2 bg-brand-ink text-brand font-bold text-[13px] py-1.5 pl-3.5 pr-2 rounded-full shadow-sm">
                <span>{linkedItem ? formatTaka(linkedItem.price, locale) : ctaText}</span>
                {linkedItem?.compare_at_price && (
                  <span className="line-through text-ink-3 text-[12px] font-medium">
                    {formatTaka(linkedItem.compare_at_price, locale)}
                  </span>
                )}
                <span className="w-6 h-6 rounded-full bg-brand text-brand-ink inline-flex items-center justify-center shrink-0">
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.6]" />
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Pagination dots */}
        {offers.length > 1 && (
          <div className="flex justify-center items-center gap-1.5 pt-2.5 pb-0.5">
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
                      ? 'w-[22px] bg-brand'
                      : 'w-1.5 bg-line group-hover:bg-brand-muted'
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full px-4" data-testid="offer-carousel">
      {/* Active offer card */}
      <div
        onClick={() => onSelectOffer?.(current)}
        className="relative min-h-[178px] h-[178px] sm:h-[188px] rounded-3xl bg-gradient-to-r from-[var(--offer-from)] via-[var(--offer-via)] to-[var(--offer-to)] border border-line/15 overflow-hidden flex shadow-[0_10px_28px_rgb(var(--offer-shadow-rgb)/0.22)] cursor-pointer group"
      >
        {/* Circular Liquid Chocolate Splash Crown & Droplets (Zero Blur, Crisp Splash) */}
        {decoration === 'liquid-splash' && <LiquidSplashCrown />}

        {/* Foreground Organic Fluid Blob Image Container */}
        {imageUrl ? (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-[124px] h-[124px] sm:w-[136px] sm:h-[136px] rounded-[64%_36%_66%_34%/36%_62%_38%_64%] overflow-hidden border-[2.5px] border-accent shadow-[0_12px_28px_rgb(var(--offer-shadow-rgb)/0.55)] bg-[var(--offer-image-bg)] pointer-events-none transition-transform duration-500 group-hover:scale-105">
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
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-[124px] h-[124px] sm:w-[136px] sm:h-[136px] rounded-[64%_36%_66%_34%/36%_62%_38%_64%] bg-gradient-to-tr from-brand to-accent flex items-center justify-center text-ink shadow-lg pointer-events-none">
            <Sparkles className="w-12 h-12 stroke-[1.8]" />
          </div>
        )}

        {/* Content (Left Column) */}
        <div className="relative p-5 pr-2 flex flex-col justify-between flex-1 min-w-0 max-w-[calc(100%-144px)] sm:max-w-[calc(100%-160px)] z-10">
          <div className="flex flex-col gap-1.5 min-w-0">
            {badge && (
              <span className="self-start h-5 px-2.5 rounded-full bg-accent text-ink text-[10px] font-extrabold uppercase tracking-wider flex items-center shadow-xs">
                {badge}
              </span>
            )}
            <h3 className="font-extrabold text-[18.5px] sm:text-[21px] leading-tight text-bg tracking-tight [text-wrap:balance] break-normal line-clamp-2">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[12px] sm:text-[13px] leading-snug text-surface-2/90 line-clamp-1 break-normal">
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
              className="h-8.5 px-3.5 rounded-full bg-accent hover:bg-accent-strong text-ink text-[12.5px] font-extrabold flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
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
                    ? 'w-[20px] bg-brand'
                    : 'w-1.5 bg-line group-hover:bg-brand-muted'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
