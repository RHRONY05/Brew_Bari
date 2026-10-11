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
});
