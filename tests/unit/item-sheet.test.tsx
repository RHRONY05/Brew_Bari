import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ItemDetailSheet } from '@/components/menu/ItemDetailSheet';
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

describe('ItemDetailSheet component', () => {
  it('renders item title and option groups', () => {
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

  it('updates total price when selecting paid option', () => {
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
});
