import type { OptionGroup } from '@/lib/schemas';

export interface SelectedOptions {
  [groupId: string]: string | string[]; // groupId -> choiceId or array of choiceIds
}

/**
 * Returns only the option groups that are currently active based on selected options.
 * A group without `show_if` is always active.
 * A group with `show_if` is active only if its referenced parent group is active AND
 * the parent group's referenced choice is selected.
 */
export function activeGroups(
  groups: OptionGroup[],
  selected: SelectedOptions
): OptionGroup[] {
  const active: OptionGroup[] = [];
  const activeIds = new Set<string>();

  for (const group of groups) {
    if (!group.show_if) {
      active.push(group);
      activeIds.add(group.id);
      continue;
    }
    const parentId = group.show_if.group;
    if (!activeIds.has(parentId)) {
      continue;
    }
    const parentSel = selected[parentId];
    const isParentSelected =
      parentSel === group.show_if.choice ||
      (Array.isArray(parentSel) && parentSel.includes(group.show_if.choice));

    if (isParentSelected) {
      active.push(group);
      activeIds.add(group.id);
    }
  }

  return active;
}

/**
 * Strips out selections for groups that are no longer active (e.g. when parent choice changes).
 */
export function cleanSelections(
  groups: OptionGroup[],
  selected: SelectedOptions
): SelectedOptions {
  const active = activeGroups(groups, selected);
  const activeIds = new Set(active.map((g) => g.id));
  const cleaned: SelectedOptions = {};

  for (const [gid, val] of Object.entries(selected)) {
    if (activeIds.has(gid)) {
      cleaned[gid] = val;
    }
  }

  return cleaned;
}

/**
 * Calculates line price: (base_price + sum of price_deltas of active groups) * quantity.
 */
export function calculateItemPrice(
  basePrice: number,
  groups: OptionGroup[],
  selected: SelectedOptions,
  quantity = 1
): { unitPrice: number; totalPrice: number; delta: number } {
  const liveGroups = activeGroups(groups, selected);
  let delta = 0;

  for (const group of liveGroups) {
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
 * Validates that all required active option groups have a selection.
 */
export function validateOptionRequirements(
  groups: OptionGroup[],
  selected: SelectedOptions
): { isValid: boolean; missingGroupIds: string[] } {
  const liveGroups = activeGroups(groups, selected);
  const missingGroupIds: string[] = [];

  for (const group of liveGroups) {
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
 * Formats active choices into "groupId:choiceId" string array for cart line.
 */
export function formatSelectedChoicesForCart(
  groups: OptionGroup[],
  selected: SelectedOptions
): string[] {
  const liveGroups = activeGroups(groups, selected);
  const result: string[] = [];

  for (const group of liveGroups) {
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
