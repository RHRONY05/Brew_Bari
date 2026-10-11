import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BillSheet } from '@/components/table/BillSheet';
import { ReviewSheet } from '@/components/table/ReviewSheet';
import * as rpc from '@/lib/table/rpc';

vi.mock('@/lib/table/rpc', () => ({
  getBillRpc: vi.fn(),
  requestBillRpc: vi.fn(),
  submitFeedbackRpc: vi.fn(),
}));

describe('BillSheet Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bill receipt breakdown and calls request bill', async () => {
    const mockBillData = {
      lines: [
        {
          name_en: 'Cappuccino',
          name_bn: 'ক্যাপুচিনো',
          quantity: 2,
          unit_price: 240,
          options: [],
          line_total: 480,
          order_status: 'ready' as const,
        },
      ],
      subtotal: 480,
      service_charge_percent: 0,
      service_charge: 0,
      vat_percent: 5,
      vat: 24,
      total: 504,
    };

    (rpc.getBillRpc as any).mockResolvedValue({
      data: mockBillData,
      error: null,
    });

    (rpc.requestBillRpc as any).mockResolvedValue({
      data: { request_id: 'req-bill-1', duplicate: false, session: {} },
      error: null,
    });

    const onRequestBillComplete = vi.fn();
    const onClose = vi.fn();

    render(
      <BillSheet
        token="token-123"
        tableNumber={99}
        isOpen={true}
        locale="en"
        onRequestBillComplete={onRequestBillComplete}
        onClose={onClose}
      />
    );

    // Bill loads and displays lines
    await waitFor(() => {
      expect(screen.getByText(/2×/)).toBeInTheDocument();
      expect(screen.getByText('Cappuccino')).toBeInTheDocument();
      expect(screen.getByText('৳504')).toBeInTheDocument();
    });

    // Subtotal and VAT
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('VAT (5%)')).toBeInTheDocument();

    // Click request bill CTA
    const requestBtn = screen.getByTestId('request-bill-button');
    fireEvent.click(requestBtn);

    await waitFor(() => {
      expect(rpc.requestBillRpc).toHaveBeenCalledWith('token-123', expect.any(String));
      expect(onRequestBillComplete).toHaveBeenCalled();
    });
  });
});

describe('ReviewSheet Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('allows star selection and submitting feedback with ungated Google review button', async () => {
    (rpc.submitFeedbackRpc as any).mockResolvedValue({
      data: { ok: true },
      error: null,
    });

    const onClose = vi.fn();

    render(
      <ReviewSheet
        token="token-123"
        isOpen={true}
        locale="en"
        googleReviewUrl="https://g.page/r/brewbari/review"
        onClose={onClose}
      />
    );

    // Initial state: 5 stars selected ("Loved it")
    expect(screen.getByText('Loved it')).toBeInTheDocument();

    // Fill in comment
    const commentInput = screen.getByLabelText('Tell us more (optional)');
    fireEvent.change(commentInput, { target: { value: 'Incredible flat white!' } });

    // Click Submit feedback
    const submitBtn = screen.getByTestId('submit-feedback-button');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(rpc.submitFeedbackRpc).toHaveBeenCalledWith(
        'token-123',
        5,
        'Incredible flat white!'
      );
    });

    // Thank you view is shown
    await waitFor(() => {
      expect(screen.getByText('Thank you!')).toBeInTheDocument();
      expect(screen.getByTestId('google-review-button')).toBeInTheDocument();
      expect(screen.getByTestId('google-review-button')).toHaveAttribute(
        'href',
        'https://g.page/r/brewbari/review'
      );
    });

    // Clipboard copy check
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Incredible flat white!');
  });

  it('shows Google review button even for 1-star reviews (UNGATED POLICY)', async () => {
    (rpc.submitFeedbackRpc as any).mockResolvedValue({
      data: { ok: true },
      error: null,
    });

    render(
      <ReviewSheet
        token="token-123"
        isOpen={true}
        locale="en"
        googleReviewUrl="https://g.page/r/brewbari/review"
        onClose={vi.fn()}
      />
    );

    // Select 1 star
    const star1 = screen.getByRole('radio', { name: '1 star' });
    fireEvent.click(star1);
    expect(screen.getByText('Not good')).toBeInTheDocument();

    // Submit
    const submitBtn = screen.getByTestId('submit-feedback-button');
    fireEvent.click(submitBtn);

    // Verify Google review button is STILL present (UNCONDITIONAL / UNGATED)
    await waitFor(() => {
      expect(screen.getByTestId('google-review-button')).toBeInTheDocument();
    });
  });
});
