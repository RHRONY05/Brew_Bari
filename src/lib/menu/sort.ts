export interface MenuSortableItem {

  id: string;
  is_available: boolean;
  sort_order: number;
  prep_minutes?: number | null;
  [key: string]: unknown;
}

/**
 * Puts sold-out items last while maintaining their relative sort_order.
 */
export function sortForGuest<T extends { is_available: boolean; sort_order: number }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    if (a.is_available === b.is_available) {
      return a.sort_order - b.sort_order;
    }
    return a.is_available ? -1 : 1;
  });
}

/**
 * Quick picks section: items with prep_minutes <= 5 that are available.
 * Excludes sold-out, null prep_minutes, and > 5 mins.
 * Sorts fastest first (prep_minutes ascending, then sort_order).
 */
export function quickPicks<T extends { is_available: boolean; prep_minutes?: number | null; sort_order: number }>(
  items: T[]
): T[] {
  return items
    .filter((it) => it.is_available && it.prep_minutes !== null && it.prep_minutes !== undefined && it.prep_minutes <= 5)
    .sort((a, b) => {
      const prepA = a.prep_minutes ?? 999;
      const prepB = b.prep_minutes ?? 999;
      if (prepA !== prepB) {
        return prepA - prepB;
      }
      return a.sort_order - b.sort_order;
    });
}

function toBnDigits(num: number): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (d) => bnDigits[Number(d)]);
}

/**
 * Formats approximate prep time for guest display:
 * - null/undefined -> null (no label)
 * - <= 1 -> "Ready now" / "এখনই রেডি"
 * - 2..120 -> "~X min" / "~X মিনিট"
 */
export function formatPrepTime(
  prepMinutes: number | null | undefined,
  locale: 'en' | 'bn' = 'en'
): string | null {
  if (prepMinutes === null || prepMinutes === undefined) {
    return null;
  }

  if (prepMinutes <= 1) {
    return locale === 'bn' ? 'এখনই রেডি' : 'Ready now';
  }

  return locale === 'bn' ? `~${toBnDigits(prepMinutes)} মিনিট` : `~${prepMinutes} min`;
}
