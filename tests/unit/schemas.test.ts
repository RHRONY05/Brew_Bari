import { describe, it, expect } from 'vitest';
import { OptionGroup, ItemOptions, CartLine, Cart } from '@/lib/schemas';

describe('schemas validation', () => {
  it('validates valid OptionGroup', () => {
    const validGroup = {
      id: 'size',
      name_en: 'Size',
      name_bn: 'সাইজ',
      type: 'single',
      required: true,
      choices: [
        { id: 'regular', name_en: 'Regular', name_bn: 'রেগুলার', price_delta: 0 },
        { id: 'large', name_en: 'Large', name_bn: 'লার্জ', price_delta: 50 },
      ],
    };

    const res = OptionGroup.safeParse(validGroup);
    expect(res.success).toBe(true);
  });

  it('rejects invalid OptionGroup with empty choices or bad id', () => {
    const invalidGroup = {
      id: 'INVALID ID WITH SPACES',
      name_en: 'Size',
      type: 'single',
      required: true,
      choices: [],
    };

    const res = OptionGroup.safeParse(invalidGroup);
    expect(res.success).toBe(false);
  });

  it('validates ItemOptions with at most 6 groups', () => {
    const group = {
      id: 'group-1',
      name_en: 'Group 1',
      type: 'single' as const,
      required: false,
      choices: [{ id: 'choice-1', name_en: 'Choice 1', price_delta: 0 }],
    };

    const validOptions = [group, { ...group, id: 'group-2' }];
    expect(ItemOptions.safeParse(validOptions).success).toBe(true);

    const tooMany = Array.from({ length: 7 }, (_, i) => ({
      ...group,
      id: `group-${i}`,
    }));
    expect(ItemOptions.safeParse(tooMany).success).toBe(false);
  });

  it('validates CartLine with proper bounds', () => {
    const validLine = {
      item_id: '123e4567-e89b-12d3-a456-426614174000',
      qty: 2,
      choices: ['size:large', 'milk:oat'],
      note: 'extra foam',
    };
    expect(CartLine.safeParse(validLine).success).toBe(true);

    // Invalid item_id (not uuid)
    expect(CartLine.safeParse({ ...validLine, item_id: 'not-a-uuid' }).success).toBe(false);

    // Invalid qty (0 or > 20)
    expect(CartLine.safeParse({ ...validLine, qty: 0 }).success).toBe(false);
    expect(CartLine.safeParse({ ...validLine, qty: 21 }).success).toBe(false);

    // Invalid choice pattern (needs group:choice)
    expect(CartLine.safeParse({ ...validLine, choices: ['invalid_choice_format'] }).success).toBe(false);
  });

  it('validates Cart with maximum 30 lines', () => {
    const validLine = {
      item_id: '123e4567-e89b-12d3-a456-426614174000',
      qty: 1,
      choices: [],
    };

    const cart30 = Array.from({ length: 30 }, () => validLine);
    expect(Cart.safeParse(cart30).success).toBe(true);

    const cart31 = Array.from({ length: 31 }, () => validLine);
    expect(Cart.safeParse(cart31).success).toBe(false);
  });

  describe('Options model v2', () => {
    it('parses Brew Bari options without v2 fields seamlessly', () => {
      const brewBariOptions = [
        {
          id: 'size',
          name_en: 'Size',
          name_bn: 'সাইজ',
          type: 'single' as const,
          required: true,
          choices: [
            { id: 'regular', name_en: 'Regular', name_bn: 'রেগুলার', price_delta: 0 },
            { id: 'large', name_en: 'Large', name_bn: 'লার্জ', price_delta: 60 },
          ],
        },
      ];
      expect(ItemOptions.safeParse(brewBariOptions).success).toBe(true);
    });

    it('validates valid v2 options with display, show_if, compare_delta, and heat', () => {
      const v2Options = [
        {
          id: 'meal',
          name_en: 'Meal?',
          type: 'single' as const,
          required: true,
          display: 'cards' as const,
          choices: [
            { id: 'solo', name_en: 'Solo', price_delta: 0, description_en: 'No sides' },
            { id: 'meal', name_en: 'Meal', price_delta: 150, compare_delta: 200, description_en: 'Fries + drink' },
          ],
        },
        {
          id: 'drink',
          name_en: 'Drink',
          type: 'single' as const,
          required: true,
          display: 'list' as const,
          show_if: { group: 'meal', choice: 'meal' },
          choices: [
            { id: 'cola', name_en: 'Cola', price_delta: 0 },
            { id: 'lassi', name_en: 'Lassi', price_delta: 30 },
          ],
        },
        {
          id: 'spice',
          name_en: 'Spice',
          type: 'single' as const,
          required: true,
          display: 'chips' as const,
          choices: [
            { id: 'mild', name_en: 'Mild', price_delta: 0, heat: 1 },
            { id: 'hot', name_en: 'Hot', price_delta: 0, heat: 3 },
          ],
        },
      ];
      expect(ItemOptions.safeParse(v2Options).success).toBe(true);
    });

    it('rejects compare_delta <= price_delta', () => {
      const badChoice = {
        id: 'meal',
        name_en: 'Meal',
        type: 'single' as const,
        required: true,
        choices: [
          { id: 'bad', name_en: 'Bad', price_delta: 150, compare_delta: 100 },
        ],
      };
      expect(OptionGroup.safeParse(badChoice).success).toBe(false);
    });

    it('rejects cards display on multi type or with >3 choices', () => {
      const cardsMulti = {
        id: 'multi-cards',
        name_en: 'Multi Cards',
        type: 'multi' as const,
        required: false,
        display: 'cards' as const,
        choices: [
          { id: 'c1', name_en: 'C1', price_delta: 0 },
        ],
      };
      expect(OptionGroup.safeParse(cardsMulti).success).toBe(false);

      const fourChoices = {
        id: 'four-cards',
        name_en: 'Four Cards',
        type: 'single' as const,
        required: true,
        display: 'cards' as const,
        choices: [
          { id: 'c1', name_en: 'C1', price_delta: 0 },
          { id: 'c2', name_en: 'C2', price_delta: 0 },
          { id: 'c3', name_en: 'C3', price_delta: 0 },
          { id: 'c4', name_en: 'C4', price_delta: 0 },
        ],
      };
      expect(OptionGroup.safeParse(fourChoices).success).toBe(false);
    });

    it('rejects invalid show_if referencing future or non-existent group/choice', () => {
      // References non-existent group
      const nonExistentGroup = [
        {
          id: 'drink',
          name_en: 'Drink',
          type: 'single' as const,
          required: true,
          show_if: { group: 'non-existent', choice: 'c1' },
          choices: [{ id: 'cola', name_en: 'Cola', price_delta: 0 }],
        },
      ];
      expect(ItemOptions.safeParse(nonExistentGroup).success).toBe(false);

      // References future group (not earlier)
      const forwardRef = [
        {
          id: 'drink',
          name_en: 'Drink',
          type: 'single' as const,
          required: true,
          show_if: { group: 'meal', choice: 'meal' },
          choices: [{ id: 'cola', name_en: 'Cola', price_delta: 0 }],
        },
        {
          id: 'meal',
          name_en: 'Meal',
          type: 'single' as const,
          required: true,
          choices: [{ id: 'meal', name_en: 'Meal', price_delta: 0 }],
        },
      ];
      expect(ItemOptions.safeParse(forwardRef).success).toBe(false);

      // References non-existent choice in parent group
      const badChoiceRef = [
        {
          id: 'meal',
          name_en: 'Meal',
          type: 'single' as const,
          required: true,
          choices: [{ id: 'solo', name_en: 'Solo', price_delta: 0 }],
        },
        {
          id: 'drink',
          name_en: 'Drink',
          type: 'single' as const,
          required: true,
          show_if: { group: 'meal', choice: 'not-a-choice' },
          choices: [{ id: 'cola', name_en: 'Cola', price_delta: 0 }],
        },
      ];
      expect(ItemOptions.safeParse(badChoiceRef).success).toBe(false);
    });
  });
});
