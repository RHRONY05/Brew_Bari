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
  type LucideIcon,
} from 'lucide-react';
import { VenueIcon } from '@/themes/ThemeContext';

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

  // By English category name
  'hot coffee': Coffee,
  'cold coffee': Snowflake,
  'fresh juice': Citrus,
  'shakes & smoothies': CupSoda,
  'shakes': CupSoda,
  'smoothies': CupSoda,
  'tea': Leaf,
  'bites & desserts': Cookie,
  'bakery': Cookie,
  'desserts': Cookie,
  'combos': Gift,
  'quick': Zap,
  'all': LayoutGrid,
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
