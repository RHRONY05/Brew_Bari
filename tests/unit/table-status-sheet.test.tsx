import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TableStatusSheet } from '@/components/table/TableStatusSheet';
import { ThemeProvider } from '@/themes/ThemeContext';
import { grillGharTheme } from '@/themes/grill-ghar';
import type { SessionRequestJson } from '@/lib/schemas';

describe('TableStatusSheet Component', () => {
  it('renders order progress stepper for active orders', () => {
    const requests: SessionRequestJson[] = [
      {
        id: 'req-1',
        type: 'order',
        status: 'preparing',
        subtotal: 350,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    render(
      <TableStatusSheet
        tableNumber={3}
        requests={requests}
        isOpen={true}
        locale="en"
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Order #1')).toBeDefined();
    expect(screen.getByText('Preparing ☕')).toBeDefined();
    expect(screen.getByText('Received')).toBeDefined();
    expect(screen.getByText('Ready')).toBeDefined();
    expect(screen.getByText('Served')).toBeDefined();
  });

  it('renders cancelled badge and cancellation notice for cancelled orders', () => {
    const requests: SessionRequestJson[] = [
      {
        id: 'req-2',
        type: 'order',
        status: 'cancelled',
        subtotal: 500,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const { rerender } = render(
      <TableStatusSheet
        tableNumber={3}
        requests={requests}
        isOpen={true}
        locale="en"
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Cancelled ✕')).toBeDefined();
    expect(
      screen.getByText('This order was cancelled by staff. Please speak with staff for details.')
    ).toBeDefined();

    // Bengali version
    rerender(
      <TableStatusSheet
        tableNumber={3}
        requests={requests}
        isOpen={true}
        locale="bn"
        onClose={() => {}}
      />
    );

    expect(screen.getByText('বাতিল করা হয়েছে ✕')).toBeDefined();
    expect(
      screen.getByText(
        'এই অর্ডারটি স্টাফ দ্বারা বাতিল করা হয়েছে। বিস্তারিত জানতে অনুগ্রহ করে স্টাফের সাথে কথা বলুন।'
      )
    ).toBeDefined();
  });

  it('renders cancelled badge and notice for cancelled waiter calls', () => {
    const requests: SessionRequestJson[] = [
      {
        id: 'call-1',
        type: 'call_waiter',
        status: 'cancelled',
        subtotal: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    render(
      <TableStatusSheet
        tableNumber={5}
        requests={requests}
        isOpen={true}
        locale="en"
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Waiter call cancelled')).toBeDefined();
    expect(screen.getByText('Staff cancelled this request')).toBeDefined();
  });

  it('renders submitted and approved badges for new and acknowledged orders', () => {
    const requests: SessionRequestJson[] = [
      {
        id: 'req-new',
        type: 'order',
        status: 'new',
        subtotal: 200,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'req-ack',
        type: 'order',
        status: 'acknowledged',
        subtotal: 300,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const { rerender } = render(
      <TableStatusSheet
        tableNumber={3}
        requests={requests}
        isOpen={true}
        locale="en"
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Submitted · Pending')).toBeDefined();
    expect(screen.getByText('Approved · In queue')).toBeDefined();

    rerender(
      <TableStatusSheet
        tableNumber={3}
        requests={requests}
        isOpen={true}
        locale="bn"
        onClose={() => {}}
      />
    );

    expect(screen.getByText('জমা দেওয়া হয়েছে (অপেক্ষমাণ)')).toBeDefined();
    expect(screen.getByText('অনুমোদিত · সারিবদ্ধ')).toBeDefined();
  });

  it('renders hero status card and 5-step vertical stepper for Grill Ghar theme', () => {
    const requests: SessionRequestJson[] = [
      {
        id: 'req-gg-1',
        type: 'order',
        status: 'preparing',
        subtotal: 810,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const { rerender } = render(
      <ThemeProvider value={grillGharTheme}>
        <TableStatusSheet
          tableNumber={7}
          requests={requests}
          isOpen={true}
          locale="en"
          onCallWaiter={() => {}}
          onViewBill={() => {}}
          onClose={() => {}}
        />
      </ThemeProvider>
    );

    // Hero card renders
    expect(screen.getByTestId('hero-status-card')).toBeDefined();
    // "On the grill" appears in hero card and in stepper
    const prepTexts = screen.getAllByText('On the grill');
    expect(prepTexts.length).toBeGreaterThanOrEqual(1);

    // 5 stages in vertical stepper
    expect(screen.getByText('Received')).toBeDefined();
    expect(screen.getByText('Accepted')).toBeDefined();
    expect(screen.getByText('Ready')).toBeDefined();
    expect(screen.getByText('Served')).toBeDefined();

    // Order summary and action buttons
    expect(screen.getByText('Order total')).toBeDefined();
    expect(screen.getByTestId('status-order-more-button')).toBeDefined();
    expect(screen.getByTestId('status-call-waiter-button')).toBeDefined();
    expect(screen.getByTestId('status-request-bill-link')).toBeDefined();

    // Bengali version
    rerender(
      <ThemeProvider value={grillGharTheme}>
        <TableStatusSheet
          tableNumber={7}
          requests={requests}
          isOpen={true}
          locale="bn"
          onCallWaiter={() => {}}
          onViewBill={() => {}}
          onClose={() => {}}
        />
      </ThemeProvider>
    );

    const prepTextsBn = screen.getAllByText('গ্রিলে চলছে');
    expect(prepTextsBn.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('গৃহীত')).toBeDefined();
    expect(screen.getByText('অনুমোদিত')).toBeDefined();
    expect(screen.getByText('প্রস্তুত')).toBeDefined();
    expect(screen.getByText('খাবার উপভোগ করুন')).toBeDefined();
    expect(screen.getByText('আরও অর্ডার করুন')).toBeDefined();
    expect(screen.getByText('ওয়েটার ডাকুন')).toBeDefined();
    expect(screen.getByText('বিল চান')).toBeDefined();
  });
});
