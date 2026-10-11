import { test, expect } from '@playwright/test';
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

test.describe('M3: Table service P2 (p2-call-waiter.spec.ts)', () => {
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
  });

  test('guest opens table 99, adds items, calls waiter, nudges waiter, verifies P2 constraints', async ({
    page,
  }) => {
    // 1. Guest scans/opens table 99 URL
    await page.goto(`/t/${table99Token}`);

    // Verify Table 99 indicator chip
    await expect(page.getByText('Table 99')).toBeVisible();

    // 2. Open Cappuccino item sheet
    await page.getByText('Cappuccino').first().click();
    await expect(page.getByTestId('item-detail-sheet')).toBeVisible();

    // Select options (Large + Oat milk if available)
    const largeOption = page.getByRole('button', { name: 'Large' });
    if (await largeOption.isVisible()) {
      await largeOption.click();
    }

    // Add to order
    await page.getByTestId('item-sheet-add-button').click();

    // 3. Verify Bottom action bar shows Call waiter button and View order button
    await expect(page.getByTestId('action-call-waiter')).toBeVisible();
    await expect(page.getByTestId('action-view-order')).toBeVisible();

    // 4. In P2, verify Place order direct button does NOT exist on the main page
    await expect(page.getByRole('button', { name: 'Place order' })).not.toBeVisible();

    // 5. Tap Call waiter
    await page.getByTestId('action-call-waiter').click();

    // Verify toast or notification confirming waiter call
    await expect(page.locator('text=Waiter called!').or(page.locator('text=Waiter notified'))).toBeVisible({
      timeout: 10000,
    });

    // 6. Tap Call waiter again (nudge)
    await page.getByTestId('action-call-waiter').click();
    await expect(page.locator('text=Waiter notified again')).toBeVisible({ timeout: 10000 });
  });

  test('invalid table token renders G8 not-found page', async ({ page }) => {
    await page.goto('/t/invalid_token_999999999999');

    await expect(page.getByText('Table Not Found')).toBeVisible();
    await expect(page.getByText('View menu instead')).toBeVisible();
  });
});
