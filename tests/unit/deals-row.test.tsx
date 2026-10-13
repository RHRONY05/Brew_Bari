import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DealsRow } from '@/components/menu/DealsRow';
import { ThemeProvider } from '@/themes/ThemeContext';
import { grillGharTheme } from '@/themes/grill-ghar';
import type { MenuItem } from '@/lib/menu/data';

const baseItem: MenuItem = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  restaurant_id: '123e4567-e89b-12d3-a456-426614174001',
  category_id: '123e4567-e89b-12d3-a456-426614174002',
  name_en: 'Solo Combo',
  name_bn: 'সোলো কম্বো',
  description_en: 'Any burger + fries + drink',
  description_bn: 'পছন্দের বার্গার, ফ্রাইজ ও ড্রিংক',
  price: 390,
  compare_at_price: 470,
  image_url: '/images/menu/grill-ghar/solo-combo.webp',
  prep_minutes: 12,
  spice_level: 1,
  tags: ['bestseller'],
  options: [],
  is_available: true,
  is_active: true,
  sort_order: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('DealsRow component', () => {
  it('returns null and does not render when items have no deals', () => {
    const regularItems: MenuItem[] = [
      { ...baseItem, compare_at_price: null },
      { ...baseItem, id: 'item-2', compare_at_price: 390 }, // equal, no discount
    ];

    const { container } = render(
      <ThemeProvider value={grillGharTheme}>
        <DealsRow
          items={regularItems}
          locale="en"
          packageTier={3}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders meal deals slider with correct SAVE % math in English', () => {
    const dealItems: MenuItem[] = [
      baseItem, // 390 was 470 -> (470 - 390) / 470 = 17%
      {
        ...baseItem,
        id: 'item-duo',
        name_en: 'Duo Feast',
        name_bn: 'ডুও ফিস্ট',
        price: 750,
        compare_at_price: 890, // (890 - 750) / 890 = 16%
      },
    ];

    render(
      <ThemeProvider value={grillGharTheme}>
        <DealsRow
          items={dealItems}
          locale="en"
          packageTier={3}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId('deals-row-section')).toBeInTheDocument();
    expect(screen.getByText('Meal deals')).toBeInTheDocument();
    expect(screen.getByText('SAVE 17%')).toBeInTheDocument();
    expect(screen.getByText('SAVE 16%')).toBeInTheDocument();
    expect(screen.getByText('৳390')).toBeInTheDocument();
    expect(screen.getByText('৳470')).toBeInTheDocument();
  });

  it('renders Bengali headers, badges, and numerals in bn locale', () => {
    const dealItems: MenuItem[] = [baseItem];

    render(
      <ThemeProvider value={grillGharTheme}>
        <DealsRow
          items={dealItems}
          locale="bn"
          packageTier={3}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('মিল ডিলস')).toBeInTheDocument();
    expect(screen.getByText('সোলো কম্বো')).toBeInTheDocument();
    expect(screen.getByText('সেভ 17%')).toBeInTheDocument();
    expect(screen.getByText('৳৩৯০')).toBeInTheDocument();
    expect(screen.getByText('৳৪৭০')).toBeInTheDocument();
  });

  it('invokes onSelect when card is clicked and onAddDirectly on button click', () => {
    const onSelect = vi.fn();
    const onAddDirectly = vi.fn();

    render(
      <ThemeProvider value={grillGharTheme}>
        <DealsRow
          items={[baseItem]}
          locale="en"
          packageTier={3}
          onSelect={onSelect}
          onAddDirectly={onAddDirectly}
        />
      </ThemeProvider>
    );

    // Click card
    fireEvent.click(screen.getByTestId(`deal-card-${baseItem.id}`));
    expect(onSelect).toHaveBeenCalledWith(baseItem);

    // Click add button
    const addBtn = screen.getByTestId(`deal-add-${baseItem.id}`);
    fireEvent.click(addBtn);
    expect(onAddDirectly).toHaveBeenCalledWith(baseItem);
  });
});
