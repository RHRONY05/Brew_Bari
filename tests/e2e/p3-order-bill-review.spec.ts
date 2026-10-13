import { test, expect } from '@playwright/test';
import { resetTable99 } from './helpers';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import WebSocket from 'ws';
import fs from 'node:fs';
import path from 'node:path';

if (typeof (globalThis as unknown as { WebSocket: unknown }).WebSocket === 'undefined') {
  (globalThis as unknown as { WebSocket: unknown }).WebSocket = WebSocket;
}

function getStaffClient() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key);
}

test.describe('M5: Order, Bill, and Review Flow (p3-order-bill-review.spec.ts)', () => {
  let table99Token: string;

  test.beforeAll(async () => {
    const supabase = getStaffClient();
    const email = process.env.TEST_STAFF_ADMIN_EMAIL!;
    const password = process.env.TEST_STAFF_ADMIN_PASSWORD!;

    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
    expect(loginErr).toBeNull();

    const { data: table, error: tableErr } = await supabase
      .from('tables')
      .select('qr_token')
      .eq('number', 99)
      .single();

    expect(tableErr).toBeNull();
    table99Token = table!.qr_token;
    await resetTable99(supabase);
  });

  test('complete guest premium flow: place order -> view status -> view bill -> request bill -> submit review & see Google button', async ({
    page,
    context,
  }) => {
    // Grant clipboard permissions for review comment copy
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // 1. Open table 99
    await page.goto(`/brew-bari/t/${table99Token}`);
    await expect(page.getByText('Table 99')).toBeVisible();

    // 2. Add Cappuccino to cart
    await page.getByRole('heading', { name: 'Cappuccino' }).first().click();
    await expect(page.getByTestId('item-detail-sheet')).toBeVisible();
    await page.getByTestId('item-sheet-add-button').click();

    // 3. Open cart sheet
    await page.getByTestId('action-view-order').click();
    await expect(page.getByTestId('cart-sheet')).toBeVisible();

    // 4. Enter kitchen note
    const noteInput = page.locator('#kitchen-note');
    await noteInput.fill('Extra hot, please');

    // 5. Place order
    const placeOrderBtn = page.getByTestId('place-order-button');
    await placeOrderBtn.click();

    // 6. Table status sheet should open showing the order
    await expect(page.getByTestId('table-status-sheet')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Order #/i).first()).toBeVisible();
    await expect(page.getByText('Received').first()).toBeVisible();

    // 7. Click View bill
    await page.getByRole('button', { name: 'View bill' }).click();

    // 8. Bill sheet is visible with breakdown
    await expect(page.getByTestId('bill-sheet')).toBeVisible();
    await expect(page.getByTestId('bill-sheet').getByText('Subtotal')).toBeVisible();
    await expect(page.getByTestId('bill-sheet').getByText(/VAT/i)).toBeVisible();

    // 9. Request bill
    const requestBillBtn = page.getByTestId('request-bill-button');
    await requestBillBtn.click();

    // 10. Review sheet opens automatically
    await expect(page.getByTestId('review-sheet')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('How was your visit?')).toBeVisible();

    // Fill review comment
    const commentInput = page.locator('#feedback-comment');
    await commentInput.fill('Amazing coffee and lovely ambience!');

    // Submit feedback
    await page.getByTestId('submit-feedback-button').click();

    // 11. Thank you view with ungated Google review button
    await expect(page.getByText('Thank you!')).toBeVisible({ timeout: 10000 });
    const googleBtn = page.getByTestId('google-review-button');
    await expect(googleBtn).toBeVisible();
    await expect(googleBtn).toHaveAttribute('href', /g\.page|google/i);
  });
});
