import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ActionBar } from '@/components/menu/ActionBar';

describe('ActionBar component', () => {
  it('renders nothing in package 1 (digital menu)', () => {
    const { container } = render(
      <ActionBar
        packageTier={1}
        locale="en"
        cartCount={3}
        cartSubtotal={750}
        onCallWaiter={vi.fn()}
        onOpenCart={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders Call Waiter button in package 2', () => {
    render(
      <ActionBar
        packageTier={2}
        locale="en"
        cartCount={0}
        cartSubtotal={0}
        onCallWaiter={vi.fn()}
        onOpenCart={vi.fn()}
      />
    );

    expect(screen.getByTestId('action-call-waiter')).toBeInTheDocument();
    expect(screen.queryByTestId('action-view-order')).not.toBeInTheDocument();
  });

  it('renders View Order button when cart has items in package 3', () => {
    const onOpenCart = vi.fn();
    render(
      <ActionBar
        packageTier={3}
        locale="en"
        cartCount={2}
        cartSubtotal={530}
        onCallWaiter={vi.fn()}
        onOpenCart={onOpenCart}
      />
    );

    const viewOrderBtn = screen.getByTestId('action-view-order');
    expect(viewOrderBtn).toBeInTheDocument();
    expect(viewOrderBtn).toHaveTextContent('View order · ৳530');

    fireEvent.click(viewOrderBtn);
    expect(onOpenCart).toHaveBeenCalled();
  });

  it('renders floating status pill when activeStatusText is provided', () => {
    const onOpenStatus = vi.fn();
    render(
      <ActionBar
        packageTier={3}
        locale="en"
        cartCount={0}
        cartSubtotal={0}
        activeStatusText="Order received"
        onCallWaiter={vi.fn()}
        onOpenCart={vi.fn()}
        onOpenStatus={onOpenStatus}
      />
    );

    const statusPill = screen.getByTestId('floating-status-pill');
    expect(statusPill).toBeInTheDocument();
    expect(statusPill).toHaveTextContent('Order received');

    fireEvent.click(statusPill);
    expect(onOpenStatus).toHaveBeenCalled();
  });
});
