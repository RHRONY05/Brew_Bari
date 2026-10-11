import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { LanguageToggle } from '@/components/menu/LanguageToggle';

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

describe('LanguageToggle component', () => {
  it('highlights current locale', () => {
    render(<LanguageToggle locale="en" />);

    const enBtn = screen.getByText('EN');
    const bnBtn = screen.getByText('বাং');

    expect(enBtn).toHaveAttribute('aria-pressed', 'true');
    expect(bnBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('triggers onLocaleChange and cookie set when clicking opposite locale', () => {
    const onLocaleChange = vi.fn();
    render(<LanguageToggle locale="en" onLocaleChange={onLocaleChange} />);

    const bnBtn = screen.getByText('বাং');
    fireEvent.click(bnBtn);

    expect(onLocaleChange).toHaveBeenCalledWith('bn');
    expect(document.cookie).toContain('lang=bn');
  });
});
