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

test.describe('M4: Live Counter Board (counter-board.spec.ts)', () => {
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

  test('staff signs in, starts shift, views counter board, and toggles sound & sold-out', async ({
    page,
  }) => {
    page.on('pageerror', (err) => console.log('BROWSER CRASH:', err));
    page.on('console', (msg) => console.log('BROWSER LOG:', msg.text()));

    // 1. Log in as counter staff
    await page.goto('/staff/login');
    await page.getByTestId('staff-email-input').fill(process.env.TEST_STAFF_COUNTER_EMAIL || 'counter@brewbari.com');
    await page.getByTestId('staff-password-input').fill(process.env.TEST_STAFF_COUNTER_PASSWORD || 'BrewBari#Counter2026!');
    await page.getByTestId('staff-login-button').click();

    // 2. Land on /staff/counter
    await expect(page).toHaveURL(/\/staff\/counter/, { timeout: 15000 });

    // 3. Start shift overlay is visible if not yet started
    const startShiftBtn = page.getByTestId('start-shift-button');
    try {
      await startShiftBtn.waitFor({ state: 'visible', timeout: 5000 });
      await startShiftBtn.click();
      await expect(page.getByTestId('start-shift-overlay')).not.toBeVisible();
    } catch {
      // Already started or overlay not displayed
    }

    // 4. Verify counter header & live indicator
    await expect(page.getByText('Brew Bari · Counter')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('connection-indicator')).toBeVisible();

    // 5. Toggle sound button
    const soundBtn = page.getByTestId('toggle-sound-button');
    await expect(soundBtn).toBeVisible();
    await soundBtn.click(); // Sound off
    await soundBtn.click(); // Sound on

    // 6. Quick sold out menu dialog
    await page.getByTestId('open-sold-out-button').click();
    await expect(page.getByTestId('sold-out-dialog')).toBeVisible();

    // Search an item
    await page.getByTestId('sold-out-search-input').fill('Espresso');
    await expect(page.getByText('Espresso').first()).toBeVisible();

    // Close sold out dialog
    await page.getByTestId('close-sold-out-dialog').click();
    await expect(page.getByTestId('sold-out-dialog')).not.toBeVisible();
  });

  test('counter board live flow: guest calls waiter on table 99 -> counter processes Waiter sent -> Done', async ({
    browser,
  }) => {
    // Context 1: Staff on Counter Board (desktop)
    const staffContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const staffPage = await staffContext.newPage();

    // Log in staff
    await staffPage.goto('/staff/login');
    await staffPage.getByTestId('staff-email-input').fill(process.env.TEST_STAFF_COUNTER_EMAIL || 'counter@brewbari.com');
    await staffPage.getByTestId('staff-password-input').fill(process.env.TEST_STAFF_COUNTER_PASSWORD || 'BrewBari#Counter2026!');
    await staffPage.getByTestId('staff-login-button').click();

    // Wait until logged in on /staff/counter
    await expect(staffPage).toHaveURL(/\/staff\/counter/, { timeout: 15000 });

    // Go to counter board with ?showTest=1 to see Table 99
    await staffPage.goto('/staff/counter?showTest=1');
    await expect(staffPage).toHaveURL(/\/staff\/counter\?showTest=1/, { timeout: 15000 });

    const startBtn = staffPage.getByTestId('start-shift-button');
    try {
      await startBtn.waitFor({ state: 'visible', timeout: 5000 });
      await startBtn.click();
      await expect(staffPage.getByTestId('start-shift-overlay')).not.toBeVisible();
    } catch {
      // Already started or overlay not displayed
    }

    // Context 2: Guest on Table 99 (Pixel 7 phone)
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();

    await guestPage.goto(`/t/${table99Token}`);
    await expect(guestPage.getByText('Table 99')).toBeVisible();

    // Guest calls waiter
    await guestPage.getByTestId('action-call-waiter').click();
    await expect(guestPage.locator('text=Waiter called!').or(guestPage.locator('text=Waiter notified'))).toBeVisible({
      timeout: 10000,
    });

    // Back to Staff Page: Table 99 request appears in requests feed
    await expect(staffPage.locator('[data-testid="table-tile-99"]:visible')).toBeVisible({ timeout: 10000 });
    const waiterSentBtn = staffPage.locator('button:has-text("Waiter sent"), button:has-text("Approve & send")').first();
    await expect(waiterSentBtn).toBeVisible({ timeout: 15000 });

    // Staff clicks "Waiter sent"
    await waiterSentBtn.click();

    // Then "Done" button appears
    const doneBtn = staffPage.locator('button:has-text("Done")').first();
    await expect(doneBtn).toBeVisible({ timeout: 10000 });
    await doneBtn.click();

    // Request is moved out of active feed
    await expect(waiterSentBtn).not.toBeVisible();

    await guestContext.close();
    await staffContext.close();
  });
});
