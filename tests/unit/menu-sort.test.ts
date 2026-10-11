import { describe, it, expect } from 'vitest';
import { sortForGuest, quickPicks, formatPrepTime } from '@/lib/menu/sort';

describe('menu sorting and prep time', () => {
  describe('sortForGuest', () => {
    it('places sold-out items at the end while preserving sort_order within groups', () => {
      const items = [
        { id: '1', name: 'A', is_available: true, sort_order: 1 },
        { id: '2', name: 'B', is_available: false, sort_order: 2 },
        { id: '3', name: 'C', is_available: true, sort_order: 3 },
        { id: '4', name: 'D', is_available: false, sort_order: 4 },
        { id: '5', name: 'E', is_available: true, sort_order: 5 },
      ];

      const sorted = sortForGuest(items);
      expect(sorted.map((i) => i.id)).toEqual(['1', '3', '5', '2', '4']);
    });

    it('returns empty array when given empty array', () => {
      expect(sortForGuest([])).toEqual([]);
    });
  });

  describe('quickPicks', () => {
    it('excludes sold-out, null prep time, and items > 5 minutes', () => {
      const items = [
        { id: '1', name: 'Cold Brew', is_available: true, prep_minutes: 1, sort_order: 3 },
        { id: '2', name: 'Cheesecake', is_available: false, prep_minutes: 1, sort_order: 4 },
        { id: '3', name: 'Chicken Sandwich', is_available: true, prep_minutes: 10, sort_order: 1 },
        { id: '4', name: 'Espresso', is_available: true, prep_minutes: 2, sort_order: 1 },
        { id: '5', name: 'Special Item', is_available: true, prep_minutes: null, sort_order: 5 },
        { id: '6', name: 'Caramel Macchiato', is_available: true, prep_minutes: 6, sort_order: 5 },
        { id: '7', name: 'Americano', is_available: true, prep_minutes: 3, sort_order: 2 },
      ];

      const quick = quickPicks(items);
      expect(quick.map((i) => i.id)).toEqual(['1', '4', '7']); // 1 min, 2 min, 3 min
    });

    it('breaks ties using sort_order', () => {
      const items = [
        { id: '1', name: 'Item B', is_available: true, prep_minutes: 3, sort_order: 5 },
        { id: '2', name: 'Item A', is_available: true, prep_minutes: 3, sort_order: 2 },
      ];

      const quick = quickPicks(items);
      expect(quick.map((i) => i.id)).toEqual(['2', '1']);
    });
  });

  describe('formatPrepTime', () => {
    it('returns null for null or undefined prep time', () => {
      expect(formatPrepTime(null, 'en')).toBeNull();
      expect(formatPrepTime(undefined, 'en')).toBeNull();
      expect(formatPrepTime(null, 'bn')).toBeNull();
    });

    it('returns "Ready now" / "এখনই রেডি" for prep time <= 1', () => {
      expect(formatPrepTime(1, 'en')).toBe('Ready now');
      expect(formatPrepTime(1, 'bn')).toBe('এখনই রেডি');
      expect(formatPrepTime(0, 'en')).toBe('Ready now');
    });

    it('returns "~X min" / "~X মিনিট" for prep time > 1 with Bengali numerals in bn locale', () => {
      expect(formatPrepTime(4, 'en')).toBe('~4 min');
      expect(formatPrepTime(4, 'bn')).toBe('~৪ মিনিট');
      expect(formatPrepTime(10, 'en')).toBe('~10 min');
      expect(formatPrepTime(10, 'bn')).toBe('~১০ মিনিট');
    });
  });
});
