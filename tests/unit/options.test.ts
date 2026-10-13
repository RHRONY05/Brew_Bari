import { describe, it, expect } from 'vitest';
import {
  calculateItemPrice,
  validateOptionRequirements,
  formatSelectedChoicesForCart,
  activeGroups,
  cleanSelections,
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

  describe('options model v2 conditional active groups and show_if', () => {
    const v2BurgerGroups: OptionGroup[] = [
      {
        id: 'meal',
        name_en: 'Make it a meal?',
        name_bn: 'মিল করবেন?',
        type: 'single',
        required: true,
        display: 'cards',
        choices: [
          { id: 'solo', name_en: 'Just the burger', price_delta: 0 },
          { id: 'meal', name_en: 'Meal', price_delta: 150, compare_delta: 200 },
        ],
      },
      {
        id: 'drink',
        name_en: 'Your meal drink',
        name_bn: 'মিলের ড্রিংক',
        type: 'single',
        required: true,
        display: 'list',
        show_if: { group: 'meal', choice: 'meal' },
        choices: [
          { id: 'cola', name_en: 'Cola', price_delta: 0 },
          { id: 'lassi', name_en: 'Lassi', price_delta: 30 },
        ],
      },
      {
        id: 'extras',
        name_en: 'Extras',
        type: 'multi',
        required: false,
        choices: [
          { id: 'cheese', name_en: 'Cheese', price_delta: 40 },
        ],
      },
    ];

    it('inactive group is not required when parent choice is not selected', () => {
      const soloValidation = validateOptionRequirements(v2BurgerGroups, { meal: 'solo' });
      expect(soloValidation.isValid).toBe(true);
      expect(soloValidation.missingGroupIds).toEqual([]);

      const active = activeGroups(v2BurgerGroups, { meal: 'solo' });
      expect(active.map((g) => g.id)).toEqual(['meal', 'extras']);
    });

    it('child group becomes active and required when parent choice matches show_if', () => {
      const active = activeGroups(v2BurgerGroups, { meal: 'meal' });
      expect(active.map((g) => g.id)).toEqual(['meal', 'drink', 'extras']);

      const missingDrink = validateOptionRequirements(v2BurgerGroups, { meal: 'meal' });
      expect(missingDrink.isValid).toBe(false);
      expect(missingDrink.missingGroupIds).toEqual(['drink']);

      const withDrink = validateOptionRequirements(v2BurgerGroups, { meal: 'meal', drink: 'cola' });
      expect(withDrink.isValid).toBe(true);
    });

    it('calculates price correctly with/without meal and active choices', () => {
      const basePrice = 280;

      // Solo: 280 + 0 = 280
      const soloPrice = calculateItemPrice(basePrice, v2BurgerGroups, { meal: 'solo' });
      expect(soloPrice.totalPrice).toBe(280);

      // Meal + lassi (+150 + 30) = 460
      const mealPrice = calculateItemPrice(basePrice, v2BurgerGroups, {
        meal: 'meal',
        drink: 'lassi',
      });
      expect(mealPrice.totalPrice).toBe(460);

      // Inactive choices (e.g. stale drink with solo) are ignored in pricing
      const staleDrink = calculateItemPrice(basePrice, v2BurgerGroups, {
        meal: 'solo',
        drink: 'lassi',
      });
      expect(staleDrink.totalPrice).toBe(280);
    });

    it('cleanSelections clears child selection when parent changes away from show_if choice', () => {
      const selected = { meal: 'meal', drink: 'lassi', extras: ['cheese'] };
      const updated = { ...selected, meal: 'solo' };
      const cleaned = cleanSelections(v2BurgerGroups, updated);
      expect(cleaned).toEqual({ meal: 'solo', extras: ['cheese'] });
      expect(cleaned.drink).toBeUndefined();
    });

    it('formatSelectedChoicesForCart excludes inactive choices', () => {
      const selected = { meal: 'solo', drink: 'lassi', extras: ['cheese'] };
      const formatted = formatSelectedChoicesForCart(v2BurgerGroups, selected);
      expect(formatted).toEqual(['meal:solo', 'extras:cheese']);
    });
  });
});
