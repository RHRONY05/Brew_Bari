import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CartSheet } from '@/components/menu/CartSheet';
import { ThemeProvider } from '@/themes/ThemeContext';
import { grillGharTheme } from '@/themes/grill-ghar';
import { brewBariTheme } from '@/themes/brew-bari';
import type { CartItem } from '@/lib/cart/store';
import type { MenuItem } from '@/lib/menu/data';

const mockBurgerItem: MenuItem = {
  id: 'burger-1',
  restaurant_id: 'rest-gg',
  category_id: 'cat-burgers',
  name_en: 'Naga Smash Burger',
  name_bn: 'নাগা স্ম্যাশ বার্গার',
  description_en: 'Spicy smash burger.',
  description_bn: 'স্পাইসি স্ম্যাশ বার্গার।',
  price: 360,
  compare_at_price: null,
  image_url: null,
  prep_minutes: 8,
  spice_level: 3,
  tags: ['bestseller'],
  options: [
    {
      id: 'meal',
      name_en: 'Make it a meal?',
      name_bn: 'মিল বানাবেন?',
      type: 'single',
      display: 'cards',
      required: true,
      choices: [
        { id: 'solo', name_en: 'Solo burger', name_bn: 'শুধু বার্গার', price_delta: 0 },
        { id: 'meal', name_en: 'Meal deal', name_bn: 'মিল ডিল', price_delta: 150, compare_delta: 200 },
      ],
    },
  ],
  is_available: true,
  is_active: true,
  sort_order: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockUpsellItem: MenuItem = {
  id: 'fries-1',
  restaurant_id: 'rest-gg',
  category_id: 'cat-sides',
  name_en: 'Masala Fries',
  name_bn: 'মাসালা ফ্রাইজ',
  description_en: 'Crispy fries with masala.',
  description_bn: 'মচমচে ফ্রাইজ।',
  price: 150,
  compare_at_price: null,
  image_url: null,
  prep_minutes: 5,
  spice_level: 1,
  tags: ['pairs-well'],
  options: [],
  is_available: true,
  is_active: true,
  sort_order: 2,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('CartSheet Component', () => {
  it('renders Brew Bari cart baseline: no MEAL badge, no upsell, Place order CTA', () => {
    const items: CartItem[] = [
      {
        id: 'line-1',
        item: mockBurgerItem,
        quantity: 1,
        choices: ['meal:solo'],
        unitPrice: 360,
        lineTotal: 360,
      },
    ];

    render(
      <ThemeProvider value={brewBariTheme}>
        <CartSheet
          items={items}
          isOpen={true}
          locale="en"
          tableNumber={1}
          kitchenNote=""
          menuItems={[mockUpsellItem]}
          onKitchenNoteChange={() => {}}
          onUpdateQuantity={() => {}}
          onPlaceOrder={() => {}}
          onClose={() => {}}
        />
      </ThemeProvider>
    );

    // No MEAL badge for solo burger
    expect(screen.queryByTestId('meal-badge-burger-1')).toBeNull();
    // No upsell slider for Brew Bari
    expect(screen.queryByText('Goes well with')).toBeNull();
    // Place order CTA
    expect(screen.getByText('Place order')).toBeDefined();
  });

  it('renders Grill Ghar cart: MEAL badge, savings row, upsell slider, Send to kitchen CTA', () => {
    const onAddUpsell = vi.fn();
    const onPlace = vi.fn();

    const items: CartItem[] = [
      {
        id: 'line-meal',
        item: mockBurgerItem,
        quantity: 2,
        choices: ['meal:meal'],
        unitPrice: 510,
        lineTotal: 1020,
      },
    ];

    const { rerender } = render(
      <ThemeProvider value={grillGharTheme}>
        <CartSheet
          items={items}
          isOpen={true}
          locale="en"
          tableNumber={7}
          kitchenNote=""
          menuItems={[mockUpsellItem]}
          onAddUpsellItem={onAddUpsell}
          onKitchenNoteChange={() => {}}
          onUpdateQuantity={() => {}}
          onPlaceOrder={onPlace}
          onClose={() => {}}
        />
      </ThemeProvider>
    );

    // MEAL badge is rendered
    expect(screen.getByTestId('meal-badge-burger-1')).toBeDefined();
    expect(screen.getByText('Meal')).toBeDefined();

    // Meal savings row is rendered (compare_delta 200 - price_delta 150 = 50 * 2 = 100)
    expect(screen.getByTestId('meal-savings-row')).toBeDefined();
    expect(screen.getByText('You save with meals')).toBeDefined();
    expect(screen.getByText('- ৳100')).toBeDefined();

    // Goes well with slider is rendered
    expect(screen.getByText('Goes well with')).toBeDefined();
    expect(screen.getByTestId('cart-upsell-item-fries-1')).toBeDefined();
    expect(screen.getByText('Masala Fries')).toBeDefined();

    // Clicking add upsell button triggers callback
    const addUpsellBtn = screen.getByTestId('add-upsell-fries-1');
    fireEvent.click(addUpsellBtn);
    expect(onAddUpsell).toHaveBeenCalledWith(mockUpsellItem);

    // Send to kitchen CTA
    expect(screen.getByText('Send to kitchen')).toBeDefined();
    const placeBtn = screen.getByTestId('place-order-button');
    fireEvent.click(placeBtn);
    expect(onPlace).toHaveBeenCalled();

    // Bengali version
    rerender(
      <ThemeProvider value={grillGharTheme}>
        <CartSheet
          items={items}
          isOpen={true}
          locale="bn"
          tableNumber={7}
          kitchenNote=""
          menuItems={[mockUpsellItem]}
          onAddUpsellItem={onAddUpsell}
          onKitchenNoteChange={() => {}}
          onUpdateQuantity={() => {}}
          onPlaceOrder={onPlace}
          onClose={() => {}}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('মিল')).toBeDefined();
    expect(screen.getByText('মিলে আপনার সঞ্চয়')).toBeDefined();
    expect(screen.getByText('সাথে দারুণ মানাবে')).toBeDefined();
    expect(screen.getByText('কিচেনে পাঠান')).toBeDefined();
  });
});
