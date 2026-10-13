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

test.describe('M5: Sold-out Race Condition (sold-out-race.spec.ts)', () => {
  test.describe.configure({ mode: 'serial' });
  let table99Token: string;
  let supabase: ReturnType<typeof getStaffClient>;
  let americanoId: string;

  test.beforeAll(async () => {
    supabase = getStaffClient();
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

    const { data: item, error: itemErr } = await supabase
      .from('menu_items')
      .select('id')
      .eq('name_en', 'Americano')
      .single();

    expect(itemErr).toBeNull();
    americanoId = item!.id;

    // Ensure available before test
    await supabase.from('menu_items').update({ is_available: true }).eq('id', americanoId);
  });

  test.afterAll(async () => {
    // Restore availability
    if (americanoId && supabase) {
      await supabase.from('menu_items').update({ is_available: true }).eq('id', americanoId);
    }
  });

  test('marks sold-out item in cart, keeps other items, and re-enables after item removal', async ({
    page,
  }) => {
    // 1. Guest scans table 99
    await page.goto(`/brew-bari/t/${table99Token}`);
    await expect(page.getByText('Table 99')).toBeVisible();

    // 2. Add Americano to cart
    await page.getByRole('heading', { name: 'Americano', exact: true }).first().click();
    await expect(page.getByTestId('item-detail-sheet')).toBeVisible();
    await page.getByTestId('item-sheet-add-button').click();

    // 3. Add Espresso to cart
    await page.getByRole('heading', { name: 'Espresso', exact: true }).first().click();
    await expect(page.getByTestId('item-detail-sheet')).toBeVisible();
    await page.getByTestId('item-sheet-add-button').click();

    // 4. In background, staff marks Americano as sold out
    const { data: updated, error: updateErr } = await supabase
      .from('menu_items')
      .update({ is_available: false })
      .eq('id', americanoId)
      .select();
    expect(updateErr).toBeNull();
    expect(updated).toHaveLength(1);
    expect(updated![0].is_available).toBe(false);

    // 5. Guest opens cart
    await page.getByTestId('action-view-order').click();
    await expect(page.getByTestId('cart-sheet')).toBeVisible();

    // 6. Guest tries to place order
    const placeOrderBtn = page.getByTestId('place-order-button');
    await expect(placeOrderBtn).toBeEnabled();
    await placeOrderBtn.click();

    // 7. Sold out error is received: alert shown, badge on Americano, button disabled
    await expect(page.getByTestId('sold-out-alert')).toBeVisible();
    await expect(page.getByTestId(`sold-out-badge-${americanoId}`)).toBeVisible();
    await expect(placeOrderBtn).toBeDisabled();

    // Verify other item (Espresso) is STILL in cart
    await expect(page.getByTestId('cart-sheet').getByText('Espresso', { exact: true })).toBeVisible();

    // 8. Guest decreases Americano to 0 to remove it
    const decreaseAmericanoBtn = page.getByRole('button', { name: 'Decrease quantity of Americano' });
    await decreaseAmericanoBtn.click();

    // 9. Sold-out alert disappears, Place order becomes enabled again
    await expect(page.getByTestId('sold-out-alert')).not.toBeVisible();
    await expect(placeOrderBtn).toBeEnabled();

    // 10. Guest can now place order with remaining items
    await placeOrderBtn.click();
    await expect(page.getByTestId('table-status-sheet')).toBeVisible({ timeout: 10000 });
  });
});
