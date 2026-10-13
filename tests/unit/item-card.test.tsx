import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ItemCard } from '@/components/menu/ItemCard';
import type { MenuItem } from '@/lib/menu/data';

const mockItem: MenuItem = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  restaurant_id: '123e4567-e89b-12d3-a456-426614174001',
  category_id: '123e4567-e89b-12d3-a456-426614174002',
  name_en: 'Cappuccino',
  name_bn: 'ক্যাপুচিনো',
  description_en: 'Rich espresso with steamed milk foam.',
  description_bn: 'এসপ্রেসো আর ঘন দুধের ফেনা।',
  price: 250,
  compare_at_price: null,
  image_url: null,
  prep_minutes: 4,
  spice_level: null,
  tags: ['bestseller'],
  options: [],
  is_available: true,
  is_active: true,
  sort_order: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('ItemCard component', () => {
  it('renders item title and formatted price in English', () => {
    render(<ItemCard item={mockItem} locale="en" packageTier={3} />);

    expect(screen.getByText('Cappuccino')).toBeInTheDocument();
    expect(screen.getByText('৳250')).toBeInTheDocument();
    expect(screen.getByText('~4 min')).toBeInTheDocument();
    expect(screen.getByText('Bestseller')).toBeInTheDocument();
    expect(screen.getByTestId('item-card-add-button')).toBeInTheDocument();
  });

  it('renders item title in Bengali when locale is bn', () => {
    render(<ItemCard item={mockItem} locale="bn" packageTier={3} />);

    expect(screen.getByText('ক্যাপুচিনো')).toBeInTheDocument();
    expect(screen.getByText('৳২৫০')).toBeInTheDocument();
    expect(screen.getByText('~৪ মিনিট')).toBeInTheDocument();
    expect(screen.getByText('জনপ্রিয়')).toBeInTheDocument();
  });

  it('hides add button when item is sold out', () => {
    const soldOutItem = { ...mockItem, is_available: false };
    render(<ItemCard item={soldOutItem} locale="en" packageTier={3} />);

    expect(screen.queryByTestId('item-card-add-button')).not.toBeInTheDocument();
    expect(screen.getByText('Sold out')).toBeInTheDocument();
  });

  it('hides add button when package tier is 1 (P1 digital menu only)', () => {
    render(<ItemCard item={mockItem} locale="en" packageTier={1} />);

    expect(screen.queryByTestId('item-card-add-button')).not.toBeInTheDocument();
  });

  it('calls onSelect when card is clicked', () => {
    const onSelect = vi.fn();
    render(<ItemCard item={mockItem} locale="en" packageTier={3} onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId(`item-card-${mockItem.id}`));
    expect(onSelect).toHaveBeenCalledWith(mockItem);
  });
});
