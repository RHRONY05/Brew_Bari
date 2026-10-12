import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TableStatusSheet } from '@/components/table/TableStatusSheet';
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
});
