import type { OptionGroup } from '@/lib/schemas';

export interface SelectedOptions {
  [groupId: string]: string | string[]; // groupId -> choiceId or array of choiceIds
}

/**
 * Calculates line price: (base_price + sum of price_deltas) * quantity.
 */
export function calculateItemPrice(
  basePrice: number,
  groups: OptionGroup[],
  selected: SelectedOptions,
  quantity = 1
): { unitPrice: number; totalPrice: number; delta: number } {
  let delta = 0;

  for (const group of groups) {
    const sel = selected[group.id];
    if (!sel) continue;

    if (group.type === 'single' && typeof sel === 'string') {
      const choice = group.choices.find((c) => c.id === sel);
      if (choice) delta += choice.price_delta;
    } else if (group.type === 'multi' && Array.isArray(sel)) {
      for (const choiceId of sel) {
        const choice = group.choices.find((c) => c.id === choiceId);
        if (choice) delta += choice.price_delta;
      }
    }
  }

  const unitPrice = Math.max(0, basePrice + delta);
  const totalPrice = unitPrice * Math.max(1, quantity);

  return { unitPrice, totalPrice, delta };
}

/**
 * Validates that all required option groups have a selection.
 */
export function validateOptionRequirements(
  groups: OptionGroup[],
  selected: SelectedOptions
): { isValid: boolean; missingGroupIds: string[] } {
  const missingGroupIds: string[] = [];

  for (const group of groups) {
    if (group.required) {
      const sel = selected[group.id];
      if (!sel || (Array.isArray(sel) && sel.length === 0)) {
        missingGroupIds.push(group.id);
      }
    }
  }

  return {
    isValid: missingGroupIds.length === 0,
    missingGroupIds,
  };
}

/**
 * Formats choices into "groupId:choiceId" string array for cart line.
 */
export function formatSelectedChoicesForCart(
  groups: OptionGroup[],
  selected: SelectedOptions
): string[] {
  const result: string[] = [];

  for (const group of groups) {
    const sel = selected[group.id];
    if (!sel) continue;

    if (group.type === 'single' && typeof sel === 'string') {
      result.push(`${group.id}:${sel}`);
    } else if (group.type === 'multi' && Array.isArray(sel)) {
      for (const choiceId of sel) {
        result.push(`${group.id}:${choiceId}`);
      }
    }
  }

  return result;
}
