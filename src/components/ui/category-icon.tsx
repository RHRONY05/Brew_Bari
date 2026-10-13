'use client';

import React from 'react';
import {
  Coffee,
  Snowflake,
  Citrus,
  CupSoda,
  Leaf,
  Cookie,
  Gift,
  Zap,
  LayoutGrid,
  Flame,
  Sparkles,
  ChefHat,
  Hamburger,
  Drumstick,
  Sandwich,
  type LucideIcon,
} from 'lucide-react';
import { VenueIcon } from '@/themes/ThemeContext';

export function FriesIcon({
  className,
  size = 24,
  ...props
}: React.ComponentProps<'svg'> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M5 10h14l-2 11H7L5 10zM7 10 6 3M10 10V2M14 10V2M17 10l1-7" />
    </svg>
  );
}

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  // Emojis from database seed
  '☕': Coffee,
  '🧊': Snowflake,
  '🍹': Citrus,
  '🥤': CupSoda,
  '🍵': Leaf,
  '🥐': Cookie,
  '🎁': Gift,
  '⚡': Zap,
  '🔥': Flame,
  '✨': Sparkles,
  '🍔': Hamburger,
  '🍗': Drumstick,
  '🍟': FriesIcon as unknown as LucideIcon,
  '🌯': Sandwich,

  // Icon keys
  coffee: Coffee,
  snowflake: Snowflake,
  citrus: Citrus,
  cupsoda: CupSoda,
  leaf: Leaf,
  cookie: Cookie,
  gift: Gift,
  zap: Zap,
  flame: Flame,
  sparkles: Sparkles,
  meal: ChefHat,
  burger: Hamburger,
  burgers: Hamburger,
  chicken: Drumstick,
  shawarma: Sandwich,
  fries: FriesIcon as unknown as LucideIcon,
  shake: CupSoda,
  shakes: CupSoda,

  // By English category name
  'hot coffee': Coffee,
  'cold coffee': Snowflake,
  'fresh juice': Citrus,
  'shakes & smoothies': CupSoda,
  'tea': Leaf,
  'bites & desserts': Cookie,
  'bakery': Cookie,
  'desserts': Cookie,
  'combos': Gift,
  'quick': Zap,
  'all': LayoutGrid,
  'set meals': ChefHat,
  'fried chicken': Drumstick,
  'shawarma & wraps': Sandwich,
  'fries & sides': FriesIcon as unknown as LucideIcon,
  'shakes & drinks': CupSoda,
};

export const CATEGORY_ICON_PRESETS = [
  { icon: '☕', label: 'Coffee', key: 'coffee' },
  { icon: '🧊', label: 'Cold / Ice', key: 'snowflake' },
  { icon: '🍹', label: 'Juice', key: 'citrus' },
  { icon: '🥤', label: 'Shakes', key: 'cupsoda' },
  { icon: '🍵', label: 'Tea', key: 'leaf' },
  { icon: '🥐', label: 'Bakery / Bites', key: 'cookie' },
  { icon: '🎁', label: 'Combos', key: 'gift' },
  { icon: '⚡', label: 'Quick', key: 'zap' },
  { icon: '🔥', label: 'Hot / Spicy', key: 'flame' },
  { icon: '✨', label: 'Special', key: 'sparkles' },
];

interface CategoryIconProps {
  icon?: string | null;
  name?: string | null;
  className?: string;
  fallbackEmoji?: boolean;
}

export function CategoryIcon({
  icon,
  name,
  className = 'w-4 h-4',
  fallbackEmoji = true,
}: CategoryIconProps) {
  const iconTrimmed = (icon || '').trim();
  const nameTrimmed = (name || '').trim().toLowerCase();

  const MatchedIcon =
    CATEGORY_ICON_MAP[iconTrimmed] ||
    CATEGORY_ICON_MAP[nameTrimmed] ||
    CATEGORY_ICON_MAP[iconTrimmed.toLowerCase()];

  if (MatchedIcon) {
    return <MatchedIcon className={className} />;
  }

  // If icon is an unmapped emoji, render emoji glyph safely
  if (iconTrimmed && fallbackEmoji) {
    return <span className="text-[15px] leading-none select-none">{iconTrimmed}</span>;
  }

  return <VenueIcon className={className} />;
}
