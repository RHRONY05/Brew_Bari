import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CategoryNav } from '@/components/menu/CategoryNav';
import { ThemeProvider } from '@/themes/ThemeContext';
import { grillGharTheme } from '@/themes/grill-ghar';
import { brewBariTheme } from '@/themes/brew-bari';
import type { Category } from '@/lib/menu/data';

const mockCategories: Category[] = [
  {
    id: 'cat-burgers',
    restaurant_id: 'rest-1',
    name_en: 'Burgers',
    name_bn: 'বার্গার',
    icon: 'burger',
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-chicken',
    restaurant_id: 'rest-1',
    name_en: 'Fried Chicken',
    name_bn: 'ফ্রাইড চিকেন',
    icon: 'chicken',
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe('CategoryNav component', () => {
  describe('round-icons variant (Grill Ghar / fast food)', () => {
    it('renders "All", "Deals", and round category icon buttons', () => {
      const onSelectCategory = vi.fn();

      render(
        <ThemeProvider value={grillGharTheme}>
          <CategoryNav
            categories={mockCategories}
            activeCategoryId="all"
            hasDeals={true}
            locale="en"
            onSelectCategory={onSelectCategory}
          />
        </ThemeProvider>
      );

      // Verify "All" button exists
      const allBtn = screen.getByTestId('chip-all');
      expect(allBtn).toBeInTheDocument();
      expect(screen.getByText('All')).toBeInTheDocument();

      // Verify "Deals" button exists
      const dealsBtn = screen.getByTestId('chip-deals');
      expect(dealsBtn).toBeInTheDocument();
      expect(screen.getByText('Deals')).toBeInTheDocument();

      // Verify categories exist
      expect(screen.getByTestId('chip-cat-burgers')).toBeInTheDocument();
      expect(screen.getByText('Burgers')).toBeInTheDocument();
      expect(screen.getByTestId('chip-cat-chicken')).toBeInTheDocument();

      // Click callback
      fireEvent.click(dealsBtn);
      expect(onSelectCategory).toHaveBeenCalledWith('deals');
    });

    it('highlights active category with brand styling', () => {
      render(
        <ThemeProvider value={grillGharTheme}>
          <CategoryNav
            categories={mockCategories}
            activeCategoryId="cat-burgers"
            hasDeals={false}
            locale="en"
            onSelectCategory={vi.fn()}
          />
        </ThemeProvider>
      );

      const activeLabel = screen.getByText('Burgers');
      expect(activeLabel).toHaveClass('font-bold', 'text-brand');

      const inactiveLabel = screen.getByText('All');
      expect(inactiveLabel).toHaveClass('font-medium', 'text-ink');
    });

    it('renders Bengali labels when locale is bn', () => {
      render(
        <ThemeProvider value={grillGharTheme}>
          <CategoryNav
            categories={mockCategories}
            activeCategoryId="all"
            hasDeals={true}
            locale="bn"
            onSelectCategory={vi.fn()}
          />
        </ThemeProvider>
      );

      expect(screen.getByText('সবগুলো')).toBeInTheDocument();
      expect(screen.getByText('ডিলস')).toBeInTheDocument();
      expect(screen.getByText('বার্গার')).toBeInTheDocument();
      expect(screen.getByText('ফ্রাইড চিকেন')).toBeInTheDocument();
    });
  });

  describe('chips variant (Brew Bari / café standard)', () => {
    it('renders horizontal chips with quick chip when hasQuickSection is true', () => {
      const onSelectCategory = vi.fn();

      render(
        <ThemeProvider value={brewBariTheme}>
          <CategoryNav
            categories={mockCategories}
            activeCategoryId="quick"
            hasQuickSection={true}
            locale="en"
            onSelectCategory={onSelectCategory}
          />
        </ThemeProvider>
      );

      expect(screen.getByTestId('chip-quick')).toBeInTheDocument();
      expect(screen.getByText('Quick')).toBeInTheDocument();
      expect(screen.getByTestId('chip-cat-burgers')).toBeInTheDocument();
      expect(screen.queryByTestId('chip-all')).not.toBeInTheDocument();
    });
  });
});
