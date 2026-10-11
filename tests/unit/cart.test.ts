import { describe, it, expect, beforeEach } from 'vitest';
import {
  addToCart,
  updateCartQuantity,
  removeFromCart,
  getCartTotals,
  saveCartToStorage,
  loadCartFromStorage,
  type CartItem,
} from '@/lib/cart/store';
import type { MenuItem } from '@/lib/menu/data';

const mockItem: MenuItem = {
  id: 'item-1',
  restaurant_id: 'rest-1',
  category_id: 'cat-1',
  name_en: 'Espresso',
  name_bn: 'এসপ্রেসো',
  description_en: 'Single shot espresso.',
  description_bn: 'এক শট এসপ্রেসো।',
  price: 180,
  compare_at_price: null,
  image_url: null,
  prep_minutes: 2,
  tags: ['hot'],
  options: [
    {
      id: 'shot',
      name_en: 'Shot',
      type: 'single',
      required: false,
      choices: [
        { id: 'single', name_en: 'Single', price_delta: 0 },
        { id: 'double', name_en: 'Double', price_delta: 50 },
      ],
    },
  ],
  is_available: true,
  is_active: true,
  sort_order: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('Cart state and operations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds new line and merges identical lines (same item, choices, and note)', () => {
    let cart: CartItem[] = [];

    // Add first item
    cart = addToCart(cart, mockItem, 1, ['shot:double'], 'extra hot');
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(1);
    expect(cart[0].unitPrice).toBe(230); // 180 + 50
    expect(cart[0].lineTotal).toBe(230);

    // Add same item with different note -> should be separate line
    cart = addToCart(cart, mockItem, 1, ['shot:double'], 'normal');
    expect(cart).toHaveLength(2);

    // Add identical item (same choices and same note) -> should merge
    cart = addToCart(cart, mockItem, 2, ['shot:double'], 'extra hot');
    expect(cart).toHaveLength(2);
    expect(cart[0].quantity).toBe(3);
    expect(cart[0].lineTotal).toBe(230 * 3);
  });

  it('respects quantity limits (1 to 20 per line)', () => {
    let cart: CartItem[] = [];
    cart = addToCart(cart, mockItem, 15);
    cart = addToCart(cart, mockItem, 10); // 15 + 10 = 25 -> capped at 20
    expect(cart[0].quantity).toBe(20);

    cart = updateCartQuantity(cart, cart[0].id, 25);
    expect(cart[0].quantity).toBe(20);

    // update to 0 removes the item
    cart = updateCartQuantity(cart, cart[0].id, 0);
    expect(cart).toHaveLength(0);
  });

  it('removes item properly', () => {
    let cart: CartItem[] = [];
    cart = addToCart(cart, mockItem, 1);
    const lineId = cart[0].id;

    cart = removeFromCart(cart, lineId);
    expect(cart).toHaveLength(0);
  });

  it('calculates totals correctly with option deltas', () => {
    let cart: CartItem[] = [];
    cart = addToCart(cart, mockItem, 2, ['shot:double']); // (180 + 50) * 2 = 460
    cart = addToCart(cart, mockItem, 1, ['shot:single']); // (180 + 0) * 1 = 180

    const { count, subtotal } = getCartTotals(cart);
    expect(count).toBe(3);
    expect(subtotal).toBe(640);
  });

  it('persists and loads from storage (round-trip)', () => {
    let cart: CartItem[] = [];
    cart = addToCart(cart, mockItem, 2);

    saveCartToStorage('session-123', cart);
    const loaded = loadCartFromStorage('session-123');

    expect(loaded).toHaveLength(1);
    expect(loaded[0].item.name_en).toBe('Espresso');
    expect(loaded[0].quantity).toBe(2);
  });

  it('clears cart when session ID changes', () => {
    let cart: CartItem[] = [];
    cart = addToCart(cart, mockItem, 2);
    saveCartToStorage('session-old', cart);

    // New session opened on same device
    const loadedNewSession = loadCartFromStorage('session-new');
    expect(loadedNewSession).toHaveLength(0);
  });
});
