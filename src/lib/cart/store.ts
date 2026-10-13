import type { MenuItem } from '@/lib/menu/data';
import { ItemOptions as ItemOptionsSchema } from '@/lib/schemas';


export interface CartItem {
  id: string; // unique line hash
  item: MenuItem;
  quantity: number;
  choices: string[]; // e.g. ["size:large", "milk:oat"]
  note?: string;
  unitPrice: number;
  lineTotal: number;
}

export interface CartState {
  items: CartItem[];
  sessionId?: string | null;
}

/**
 * Creates a unique line key based on item ID, sorted choices, and note.
 */
export function getLineKey(itemId: string, choices: string[] = [], note = ''): string {
  const sortedChoices = [...choices].sort().join('|');
  return `${itemId}::${sortedChoices}::${note.trim()}`;
}

/**
 * Computes unit price with choice price deltas.
 */
export function getUnitPrice(item: MenuItem, choices: string[] = []): number {
  let delta = 0;
  const parsedGroups = ItemOptionsSchema.safeParse(item.options);
  if (parsedGroups.success) {
    for (const choiceStr of choices) {
      const [groupId, choiceId] = choiceStr.split(':');
      const group = parsedGroups.data.find((g) => g.id === groupId);
      const choice = group?.choices.find((c) => c.id === choiceId);
      if (choice) {
        delta += choice.price_delta;
      }
    }
  }
  return Math.max(0, item.price + delta);
}

/**
 * Adds an item to the cart, merging with an identical line if already present.
 * Limits total lines to 30 and per-line quantity to 20.
 */
export function addToCart(
  currentItems: CartItem[],
  newItem: MenuItem,
  quantity = 1,
  choices: string[] = [],
  note?: string
): CartItem[] {
  const key = getLineKey(newItem.id, choices, note);
  const unitPrice = getUnitPrice(newItem, choices);
  const existingIndex = currentItems.findIndex((it) => it.id === key);

  if (existingIndex >= 0) {
    const updated = [...currentItems];
    const existing = updated[existingIndex];
    const newQty = Math.min(20, existing.quantity + quantity);
    updated[existingIndex] = {
      ...existing,
      quantity: newQty,
      lineTotal: existing.unitPrice * newQty,
    };
    return updated;
  }

  if (currentItems.length >= 30) {
    return currentItems; // Max 30 lines
  }

  const clampedQty = Math.min(20, Math.max(1, quantity));
  const newLine: CartItem = {
    id: key,
    item: newItem,
    quantity: clampedQty,
    choices,
    note: note?.trim() || undefined,
    unitPrice,
    lineTotal: unitPrice * clampedQty,
  };

  return [...currentItems, newLine];
}

/**
 * Updates quantity of a specific cart item. If quantity <= 0, item is removed.
 */
export function updateCartQuantity(
  currentItems: CartItem[],
  lineId: string,
  quantity: number
): CartItem[] {
  if (quantity <= 0) {
    return currentItems.filter((it) => it.id !== lineId);
  }

  const clampedQty = Math.min(20, quantity);
  return currentItems.map((it) => {
    if (it.id === lineId) {
      return {
        ...it,
        quantity: clampedQty,
        lineTotal: it.unitPrice * clampedQty,
      };
    }
    return it;
  });
}

/**
 * Removes an item from the cart.
 */
export function removeFromCart(currentItems: CartItem[], lineId: string): CartItem[] {
  return currentItems.filter((it) => it.id !== lineId);
}

/**
 * Computes total item count and subtotal for the cart.
 */
export function getCartTotals(items: CartItem[]): { count: number; subtotal: number } {
  const count = items.reduce((sum, it) => sum + it.quantity, 0);
  const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
  return { count, subtotal };
}

/**
 * Computes total meal savings in cart based on compare_delta of selected choices.
 */
export function calculateMealSavings(items: CartItem[]): number {
  let totalSavings = 0;
  for (const line of items) {
    if (!line.choices || line.choices.length === 0) continue;
    const parsedGroups = ItemOptionsSchema.safeParse(line.item.options);
    if (!parsedGroups.success) continue;

    let lineSavingsPerUnit = 0;
    for (const choiceStr of line.choices) {
      const [groupId, choiceId] = choiceStr.split(':');
      const group = parsedGroups.data.find((g) => g.id === groupId);
      const choice = group?.choices.find((c) => c.id === choiceId);
      if (
        choice &&
        choice.compare_delta !== undefined &&
        choice.compare_delta > choice.price_delta
      ) {
        lineSavingsPerUnit += choice.compare_delta - choice.price_delta;
      }
    }
    totalSavings += lineSavingsPerUnit * line.quantity;
  }
  return totalSavings;
}

/**
 * Returns true if a cart line is a meal (has a non-zero choice on a cards group or meal choice).
 */
export function isMealLine(line: CartItem): boolean {
  if (!line.choices || line.choices.length === 0) return false;
  const parsedGroups = ItemOptionsSchema.safeParse(line.item.options);
  if (!parsedGroups.success) return false;

  for (const choiceStr of line.choices) {
    const [groupId, choiceId] = choiceStr.split(':');
    const group = parsedGroups.data.find((g) => g.id === groupId);
    if (!group) continue;
    const choice = group.choices.find((c) => c.id === choiceId);
    if (!choice) continue;
    if (
      (group.display === 'cards' && choice.price_delta > 0) ||
      (groupId === 'meal' && choiceId === 'meal')
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Filters menu items for the 'Goes well with' cart upsell:
 * - Excludes items already in the cart
 * - Excludes sold-out items (is_available = false)
 * - Must have 'pairs-well' tag
 * - Returns at most 6 items
 */
export function filterCartUpsell(
  menuItems: MenuItem[],
  cartItems: CartItem[]
): MenuItem[] {
  const inCartItemIds = new Set(cartItems.map((c) => c.item.id));
  return menuItems
    .filter((it) => {
      if (!it.is_available) return false;
      if (inCartItemIds.has(it.id)) return false;
      const tags = Array.isArray(it.tags) ? it.tags : [];
      return tags.includes('pairs-well');
    })
    .slice(0, 6);
}

const STORAGE_PREFIX = 'brew_bari_cart';

export function saveCartToStorage(sessionId: string | null | undefined, items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${STORAGE_PREFIX}_${sessionId || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(items));
    if (sessionId) {
      localStorage.setItem(`${STORAGE_PREFIX}_last_session`, sessionId);
    }
  } catch {
    // Storage quota or private browsing error
  }
}

export function loadCartFromStorage(sessionId: string | null | undefined): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const lastSession = localStorage.getItem(`${STORAGE_PREFIX}_last_session`);
    // If table session changed, clear cart
    if (sessionId && lastSession && lastSession !== sessionId) {
      localStorage.removeItem(`${STORAGE_PREFIX}_${lastSession}`);
      localStorage.setItem(`${STORAGE_PREFIX}_last_session`, sessionId);
      return [];
    }

    const key = `${STORAGE_PREFIX}_${sessionId || 'guest'}`;
    let raw = localStorage.getItem(key);
    // If opening a table session with empty cart, import items chosen on the public guest menu
    if (!raw && sessionId) {
      const guestRaw = localStorage.getItem(`${STORAGE_PREFIX}_guest`);
      if (guestRaw) {
        raw = guestRaw;
        try {
          localStorage.setItem(key, guestRaw);
          localStorage.removeItem(`${STORAGE_PREFIX}_guest`);
        } catch {}
      }
    }
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}
