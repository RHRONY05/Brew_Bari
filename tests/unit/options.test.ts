import { describe, it, expect } from 'vitest';
import {
  calculateItemPrice,
  validateOptionRequirements,
  formatSelectedChoicesForCart,
} from '@/lib/menu/options';
import type { OptionGroup } from '@/lib/schemas';

const mockGroups: OptionGroup[] = [
  {
    id: 'size',
    name_en: 'Size',
    name_bn: 'সাইজ',
    type: 'single',
    required: true,
    choices: [
      { id: 'regular', name_en: 'Regular', name_bn: 'রেগুলার', price_delta: 0 },
      { id: 'large', name_en: 'Large', name_bn: 'লার্জ', price_delta: 60 },
    ],
  },
  {
    id: 'milk',
    name_en: 'Milk',
    name_bn: 'দুধ',
    type: 'single',
    required: false,
    choices: [
      { id: 'regular', name_en: 'Regular milk', name_bn: 'নরমাল দুধ', price_delta: 0 },
      { id: 'oat', name_en: 'Oat milk', name_bn: 'ওট মিল্ক', price_delta: 80 },
    ],
  },
  {
    id: 'extras',
    name_en: 'Extras',
    name_bn: 'এক্সট্রা',
    type: 'multi',
    required: false,
    choices: [
      { id: 'shot', name_en: 'Extra shot', name_bn: 'এক্সট্রা শট', price_delta: 50 },
      { id: 'caramel', name_en: 'Caramel syrup', name_bn: 'ক্যারামেল সিরাপ', price_delta: 40 },
    ],
  },
];

describe('menu options logic', () => {
  it('client price preview: calculates base + deltas * qty', () => {
    // base 300 + large (+60) + oat (+80) + shot (+50) = 490 * 2 = 980
    const calc = calculateItemPrice(
      300,
      mockGroups,
      {
        size: 'large',
        milk: 'oat',
        extras: ['shot'],
      },
      2
    );

    expect(calc.delta).toBe(190);
    expect(calc.unitPrice).toBe(490);
    expect(calc.totalPrice).toBe(980);
  });

  it('required single group: blocks validation if missing', () => {
    const invalid = validateOptionRequirements(mockGroups, {});
    expect(invalid.isValid).toBe(false);
    expect(invalid.missingGroupIds).toContain('size');

    const valid = validateOptionRequirements(mockGroups, { size: 'regular' });
    expect(valid.isValid).toBe(true);
    expect(valid.missingGroupIds).toEqual([]);
  });

  it('multi group: allows 0..n choices', () => {
    const calcEmpty = calculateItemPrice(200, mockGroups, { size: 'regular', extras: [] }, 1);
    expect(calcEmpty.totalPrice).toBe(200);

    const calcTwo = calculateItemPrice(
      200,
      mockGroups,
      { size: 'regular', extras: ['shot', 'caramel'] },
      1
    );
    expect(calcTwo.delta).toBe(90);
    expect(calcTwo.totalPrice).toBe(290);
  });

  it('formats selected choices into cart-compatible format', () => {
    const formatted = formatSelectedChoicesForCart(mockGroups, {
      size: 'large',
      milk: 'oat',
      extras: ['shot', 'caramel'],
    });

    expect(formatted).toEqual(['size:large', 'milk:oat', 'extras:shot', 'extras:caramel']);
  });
});
