import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ItemDetailSheet } from '@/components/menu/ItemDetailSheet';
import { ThemeProvider } from '@/themes/ThemeContext';
import { grillGharTheme } from '@/themes/grill-ghar';
import type { MenuItem } from '@/lib/menu/data';

const mockItemWithOptions: MenuItem = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  restaurant_id: '123e4567-e89b-12d3-a456-426614174001',
  category_id: '123e4567-e89b-12d3-a456-426614174002',
  name_en: 'Caramel Macchiato',
  name_bn: 'ক্যারামেল ম্যাকিয়াটো',
  description_en: 'Vanilla milk, espresso and caramel drizzle.',
  description_bn: 'ভ্যানিলা দুধ, এসপ্রেসো আর ক্যারামেল।',
  price: 300,
  compare_at_price: null,
  image_url: null,
  prep_minutes: 6,
  spice_level: null,
  tags: ['bestseller'],
  options: [
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
      id: 'extras',
      name_en: 'Extras',
      name_bn: 'এক্সট্রা',
      type: 'multi',
      required: false,
      choices: [
        { id: 'shot', name_en: 'Extra shot', name_bn: 'এক্সট্রা শট', price_delta: 50 },
      ],
    },
  ],
  is_available: true,
  is_active: true,
  sort_order: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockNagaSmashBurger: MenuItem = {
  id: '123e4567-e89b-12d3-a456-426614174010',
  restaurant_id: '123e4567-e89b-12d3-a456-426614174011',
  category_id: '123e4567-e89b-12d3-a456-426614174012',
  name_en: 'Naga Smash Burger',
  name_bn: 'নাগা স্ম্যাশ বার্গার',
  description_en: 'Two smashed beef patties, naga-chili mayo, cheddar, pickled onion.',
  description_bn: 'দুটি স্ম্যাশড বিফ প্যাটি, নাগা-মরিচ মেয়ো, চেডার ও পেঁয়াজ।',
  price: 320,
  compare_at_price: null,
  image_url: null,
  prep_minutes: 12,
  spice_level: 4,
  tags: ['new'],
  options: [
    {
      id: 'meal',
      name_en: 'Make it a meal?',
      name_bn: 'মিল করবেন?',
      type: 'single',
      required: true,
      display: 'cards',
      choices: [
        {
          id: 'solo',
          name_en: 'Just the burger',
          name_bn: 'শুধু বার্গার',
          description_en: 'No sides',
          description_bn: 'সাইড ছাড়া',
          price_delta: 0,
        },
        {
          id: 'meal',
          name_en: 'Meal',
          name_bn: 'মিল',
          description_en: 'Fries + drink',
          description_bn: 'ফ্রাইজ + ড্রিংক',
          price_delta: 150,
          compare_delta: 200,
        },
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
        { id: 'coke', name_en: 'Cola 250 ml', name_bn: 'কোলা ২৫০ মি.লি.', price_delta: 0 },
        { id: 'lassi', name_en: 'Mango lassi', name_bn: 'ম্যাংগো লাচ্ছি', price_delta: 30 },
      ],
    },
    {
      id: 'spice',
      name_en: 'Spice level',
      name_bn: 'ঝাল',
      type: 'single',
      required: true,
      display: 'chips',
      choices: [
        { id: 'mild', name_en: 'Mild', name_bn: 'মৃদু', heat: 1, price_delta: 0 },
        { id: 'naga', name_en: 'Naga', name_bn: 'নাগা', heat: 4, price_delta: 0 },
      ],
    },
    {
      id: 'extras',
      name_en: 'Add extra',
      name_bn: 'এক্সট্রা যোগ করুন',
      type: 'multi',
      required: false,
      choices: [
        { id: 'cheese', name_en: 'Extra cheese', name_bn: 'এক্সট্রা চিজ', price_delta: 40 },
      ],
    },
  ],
  is_available: true,
  is_active: true,
  sort_order: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('ItemDetailSheet component', () => {
  it('renders item title and option groups (Brew Bari baseline)', () => {
    render(
      <ItemDetailSheet
        item={mockItemWithOptions}
        isOpen={true}
        locale="en"
        packageTier={3}
        onClose={vi.fn()}
      />
    );

    expect(screen.getAllByText('Caramel Macchiato').length).toBeGreaterThan(0);
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('Extras')).toBeInTheDocument();
    expect(screen.getByText('Regular')).toBeInTheDocument();
    expect(screen.getByText('Large')).toBeInTheDocument();
    expect(screen.getByText('+৳60')).toBeInTheDocument();
  });

  it('updates total price when selecting paid option (Brew Bari)', () => {
    render(
      <ItemDetailSheet
        item={mockItemWithOptions}
        isOpen={true}
        locale="en"
        packageTier={3}
        onClose={vi.fn()}
      />
    );

    // Initial regular size: 300 in add button
    const addBtn = screen.getByTestId('item-sheet-add-button');
    expect(addBtn).toHaveTextContent('৳300');

    // Select Large (+60)
    const largeBtn = screen.getByText('Large');
    fireEvent.click(largeBtn);

    // Total should now be 360 in add button
    expect(addBtn).toHaveTextContent('৳360');
  });

  it('hides add button in package tier 1', () => {
    render(
      <ItemDetailSheet
        item={mockItemWithOptions}
        isOpen={true}
        locale="en"
        packageTier={1}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByTestId('item-sheet-add-button')).not.toBeInTheDocument();
  });

  it('calls onAddToCart with selected options and note', () => {
    const onAddToCart = vi.fn();
    render(
      <ItemDetailSheet
        item={mockItemWithOptions}
        isOpen={true}
        locale="en"
        packageTier={3}
        onClose={vi.fn()}
        onAddToCart={onAddToCart}
      />
    );

    // Select Large (+60) and Extra shot (+50)
    fireEvent.click(screen.getByText('Large'));
    fireEvent.click(screen.getByText('Extra shot'));

    // Type special note
    const noteInput = screen.getByPlaceholderText('e.g. less sweet, extra hot…');
    fireEvent.change(noteInput, { target: { value: 'extra caramel please' } });

    // Click Add
    const addBtn = screen.getByTestId('item-sheet-add-button');
    fireEvent.click(addBtn);

    expect(onAddToCart).toHaveBeenCalledWith({
      item: mockItemWithOptions,
      quantity: 1,
      choices: ['size:large', 'extras:shot'],
      note: 'extra caramel please',
    });
  });

  describe('Grill Ghar GG2 options (cards, list, chips, multi-tiles, show_if)', () => {
    it('picking Meal shows drink + raises price by 150; back to solo hides drink and drops its price; Add disabled until required active groups are chosen', () => {
      render(
        <ThemeProvider value={grillGharTheme}>
          <ItemDetailSheet
            item={mockNagaSmashBurger}
            isOpen={true}
            locale="en"
            packageTier={3}
            onClose={vi.fn()}
          />
        </ThemeProvider>
      );

      const addBtn = screen.getByTestId('item-sheet-add-button');

      // 1. Initially solo is chosen: base price ৳320, drink group is not rendered
      expect(screen.queryByText('Your meal drink')).not.toBeInTheDocument();
      expect(addBtn).toHaveTextContent('৳320');
      expect(addBtn).toHaveTextContent('Add to cart');
      expect(addBtn).not.toBeDisabled();

      // Check card display: SAVE ৳50 badge exists
      expect(screen.getByText('SAVE ৳50')).toBeInTheDocument();
      expect(screen.getByText('Fries + drink')).toBeInTheDocument();

      // 2. Click "Meal" card
      const mealCard = screen.getByText('Meal');
      fireEvent.click(mealCard);

      // Drink group is now visible
      expect(screen.getByText('Your meal drink')).toBeInTheDocument();

      // Required drink group is active but has NO selection yet => Add button must be DISABLED
      expect(addBtn).toBeDisabled();

      // 3. Pick a drink (Cola 250 ml, price delta 0)
      const colaOption = screen.getByText('Cola 250 ml');
      fireEvent.click(colaOption);

      // Now valid! Price: 320 + 150 = 470, label is "Add meal"
      expect(addBtn).not.toBeDisabled();
      expect(addBtn).toHaveTextContent('৳470');
      expect(addBtn).toHaveTextContent('Add meal');

      // 4. Upgrade to Mango lassi (+৳30)
      const lassiOption = screen.getByText('Mango lassi');
      fireEvent.click(lassiOption);

      // Price: 320 + 150 + 30 = 500
      expect(addBtn).toHaveTextContent('৳500');

      // 5. Click back to "Just the burger" (solo)
      const soloCard = screen.getByText('Just the burger');
      fireEvent.click(soloCard);

      // Drink group is hidden
      expect(screen.queryByText('Your meal drink')).not.toBeInTheDocument();

      // Price drops back to 320, Add button is enabled, label is "Add to cart"
      expect(addBtn).not.toBeDisabled();
      expect(addBtn).toHaveTextContent('৳320');
      expect(addBtn).toHaveTextContent('Add to cart');
    });

    it('toggles multi tiles for extras and chips for spice levels', () => {
      render(
        <ThemeProvider value={grillGharTheme}>
          <ItemDetailSheet
            item={mockNagaSmashBurger}
            isOpen={true}
            locale="en"
            packageTier={3}
            onClose={vi.fn()}
          />
        </ThemeProvider>
      );

      const addBtn = screen.getByTestId('item-sheet-add-button');
      expect(addBtn).toHaveTextContent('৳320');

      // Toggle Extra cheese (+40)
      const cheeseTile = screen.getByText('Extra cheese');
      fireEvent.click(cheeseTile);
      expect(addBtn).toHaveTextContent('৳360');

      // Toggle Extra cheese off
      fireEvent.click(cheeseTile);
      expect(addBtn).toHaveTextContent('৳320');

      // Click Naga chip
      const nagaChip = screen.getByText('Naga');
      fireEvent.click(nagaChip);
      expect(addBtn).toHaveTextContent('৳320');
    });
  });
});
