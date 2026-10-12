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

test.describe('M4: Table Sessions Drawer S3 (session-approval.spec.ts)', () => {
  let table99Token: string;
  let restaurantId: string;

  test.beforeAll(async () => {
    const supabase = getStaffClient();
    const email = process.env.TEST_STAFF_COUNTER_EMAIL || 'counter@brewbari.com';
    const password = process.env.TEST_STAFF_COUNTER_PASSWORD || 'BrewBari#Counter2026!';

    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
    expect(loginErr).toBeNull();

    const { data: table, error: tableErr } = await supabase
      .from('tables')
      .select('qr_token, restaurant_id')
      .eq('number', 99)
      .single();

    expect(tableErr).toBeNull();
    table99Token = table!.qr_token;
    restaurantId = table!.restaurant_id;
  });

  test('staff opens table 99 drawer, inspects running bill and session requests', async ({ page }) => {
    // 1. Log in counter staff
    await page.goto('/staff/login');
    await page.getByTestId('staff-email-input').fill(process.env.TEST_STAFF_COUNTER_EMAIL || 'counter@brewbari.com');
    await page.getByTestId('staff-password-input').fill(process.env.TEST_STAFF_COUNTER_PASSWORD || 'BrewBari#Counter2026!');
    await page.getByTestId('staff-login-button').click();
    await expect(page).toHaveURL(/\/staff\/counter/, { timeout: 15000 });

    // 2. Open counter board with ?showTest=1
    await page.goto('/staff/counter?showTest=1');
    await expect(page).toHaveURL(/\/staff\/counter/, { timeout: 15000 });

    const startBtn = page.getByTestId('start-shift-button');
    try {
      await startBtn.waitFor({ state: 'visible', timeout: 5000 });
      await startBtn.click();
      await expect(page.getByTestId('start-shift-overlay')).not.toBeVisible();
    } catch {
      // Already started
    }

    // 3. Click Table 99 tile to open S3 drawer
    const tile99 = page.locator('[data-testid="table-tile-99"]:visible');
    await expect(tile99).toBeVisible({ timeout: 10000 });
    await tile99.click();

    // 4. Verify S3 Drawer is visible
    await expect(page.getByTestId('table-drawer')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Table 99').first()).toBeVisible();
    await expect(page.getByText('Running Bill')).toBeVisible();

    // 5. Close drawer
    await page.getByTestId('close-table-drawer').click();
    await expect(page.getByTestId('table-drawer')).not.toBeVisible();
  });
});
