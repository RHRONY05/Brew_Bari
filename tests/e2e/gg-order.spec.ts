import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { resetTable99 } from './helpers';
import WebSocket from 'ws';
import fs from 'node:fs';
import path from 'node:path';

if (typeof (globalThis as unknown as { WebSocket: unknown }).WebSocket === 'undefined') {
  (globalThis as unknown as { WebSocket: unknown }).WebSocket = WebSocket;
}

function getStaffEnv() {
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

  return {
    adminEmail: process.env.TEST_GG_ADMIN_EMAIL || 'admin@grillghar.com',
    adminPassword: process.env.TEST_GG_ADMIN_PASSWORD || 'GrillGhar#Admin2026!',
    counterEmail: process.env.TEST_GG_COUNTER_EMAIL || 'counter@grillghar.com',
    counterPassword: process.env.TEST_GG_COUNTER_PASSWORD || 'GrillGhar#Counter2026!',
  };
}

function getGgSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key);
}

test.describe('Grill Ghar: Order Flow (gg-order.spec.ts)', () => {
  const env = getStaffEnv();

  test.beforeAll(async () => {
    const supabase = getGgSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: env.adminEmail,
      password: env.adminPassword,
    });
    expect(error).toBeNull();
    await resetTable99(supabase);
  });

  test('Naga Smash meal (৳510) + wings (৳300) -> Send to kitchen -> Counter lifecycle -> "On the grill" -> bill with 5% VAT', async ({
    page: guestPage,
    browser,
  }) => {
    test.setTimeout(90000);
    // -------------------------------------------------------------------------
    // 1. Guest: Open Table 99
    // -------------------------------------------------------------------------
    await guestPage.setViewportSize({ width: 375, height: 812 });
    await guestPage.goto('/grill-ghar/t/token_gg_99');
    await expect(guestPage.getByText('Table 99')).toBeVisible({ timeout: 10000 });

    // -------------------------------------------------------------------------
    // 2. Add Naga Smash Burger meal with drink + Naga + extra cheese = ৳510
    // -------------------------------------------------------------------------
    // Find Naga Smash Burger card
    await guestPage.getByRole('heading', { name: 'Naga Smash Burger' }).first().click();
    const itemSheet = guestPage.getByTestId('item-detail-sheet');
    await expect(itemSheet).toBeVisible({ timeout: 5000 });

    // Select Meal (+৳150)
    await itemSheet.getByText('Meal', { exact: true }).click();

    // Select Drink: Cola (+৳0)
    await itemSheet.getByText(/Cola/i).first().click();

    // Select Spice: Naga (+৳0)
    await itemSheet.getByRole('button', { name: 'Naga' }).click();

    // Select Extra cheese (+৳40)
    await itemSheet.getByText('Extra cheese').click();

    // Verify Add button shows ৳510 (320 + 150 + 40)
    const addBurgerBtn = guestPage.getByTestId('item-sheet-add-button');
    await expect(addBurgerBtn).toHaveText(/৳510/);
    await addBurgerBtn.click();
    await expect(itemSheet).not.toBeVisible();

    // -------------------------------------------------------------------------
    // 3. Add Hot Wings · 6 pc = ৳300
    // -------------------------------------------------------------------------
    await guestPage.getByRole('heading', { name: /Hot Wings/i }).first().click();
    await expect(itemSheet).toBeVisible({ timeout: 5000 });
    const addWingsBtn = guestPage.getByTestId('item-sheet-add-button');
    await expect(addWingsBtn).toHaveText(/৳300/);
    await addWingsBtn.click();
    await expect(itemSheet).not.toBeVisible();

    // -------------------------------------------------------------------------
    // 4. Open CartSheet and Send to kitchen
    // -------------------------------------------------------------------------
    const actionCart = guestPage.getByTestId('action-view-order');
    await expect(actionCart).toBeVisible();
    await expect(actionCart).toHaveText(/৳810/); // 510 + 300 = 810
    await actionCart.click();

    const cartSheet = guestPage.getByTestId('cart-sheet');
    await expect(cartSheet).toBeVisible();

    // Verify Send to kitchen CTA
    const placeBtn = cartSheet.getByTestId('place-order-button');
    await expect(placeBtn).toBeVisible();
    await expect(placeBtn).toHaveText(/Send to kitchen/i);
    await placeBtn.click();

    // -------------------------------------------------------------------------
    // 5. TableStatusSheet opens showing order received
    // -------------------------------------------------------------------------
    const statusSheet = guestPage.getByTestId('table-status-sheet');
    await expect(statusSheet).toBeVisible({ timeout: 10000 });
    await expect(statusSheet.getByText('Received', { exact: true })).toBeVisible();

    // -------------------------------------------------------------------------
    // 6. Staff Counter Board: Open in separate context, progress order
    // -------------------------------------------------------------------------
    const counterContext = await browser.newContext();
    const counterPage = await counterContext.newPage();
    await counterPage.setViewportSize({ width: 1280, height: 800 });

    // Login as Grill Ghar counter
    await counterPage.goto('/staff/login');
    await counterPage.getByTestId('staff-email-input').fill(env.counterEmail);
    await counterPage.getByTestId('staff-password-input').fill(env.counterPassword);
    await counterPage.getByTestId('staff-login-button').click();

    await expect(counterPage).toHaveURL(/\/staff\/counter/, { timeout: 15000 });
    await counterPage.goto('/staff/counter?showTest=1');

    // Handle shift overlay if present
    const startShiftBtn = counterPage.getByTestId('start-shift-button');
    try {
      await startShiftBtn.waitFor({ state: 'visible', timeout: 5000 });
      await startShiftBtn.click();
      await expect(counterPage.getByTestId('start-shift-overlay')).not.toBeVisible({ timeout: 5000 });
    } catch {
      // Already started or overlay not displayed
    }

    // Locate Table 99 request card
    const table99Card = counterPage.locator('article[data-testid^="request-card-"]:has-text("99")').first();
    await expect(table99Card).toBeVisible({ timeout: 15000 });

    // Step A: Approve & send (or Accept if already approved session)
    const approveBtn = table99Card.locator('button[data-testid^="action-approve-send-"], button[data-testid^="action-order-accept-"]');
    await expect(approveBtn).toBeVisible({ timeout: 10000 });
    await approveBtn.click();

    // Step B: Start preparing ("On the grill")
    const prepBtn = table99Card.locator('button[data-testid^="action-order-preparing-"]');
    await expect(prepBtn).toBeVisible({ timeout: 10000 });
    await prepBtn.click();

    // -------------------------------------------------------------------------
    // 7. Verify Guest sees "On the grill"
    // -------------------------------------------------------------------------
    await expect(
      statusSheet.getByText(/On the grill|গ্রিলে চলছে/i)
    ).toBeVisible({ timeout: 10000 });

    // -------------------------------------------------------------------------
    // 8. Staff: Set Ready and Served
    // -------------------------------------------------------------------------
    const readyBtn = table99Card.locator('button[data-testid^="action-order-ready-"]');
    await expect(readyBtn).toBeVisible({ timeout: 10000 });
    await readyBtn.click();

    const servedBtn = table99Card.locator('button[data-testid^="action-order-served-"]');
    await expect(servedBtn).toBeVisible({ timeout: 10000 });
    await servedBtn.click();

    // -------------------------------------------------------------------------
    // 9. Guest: Bill Total with 5% VAT
    // -------------------------------------------------------------------------
    // Stepper marks served
    await expect(statusSheet.getByText(/Served|পরিবেশিত/i)).toBeVisible({ timeout: 10000 });

    // Open bill
    const viewBillBtn = statusSheet.locator('[data-testid="status-request-bill-link"], button:has-text("View bill"), button:has-text("Request the bill"), button:has-text("বিল চান")');
    await expect(viewBillBtn).toBeVisible({ timeout: 10000 });
    await viewBillBtn.click();

    const billSheet = guestPage.getByTestId('bill-sheet');
    await expect(billSheet).toBeVisible({ timeout: 10000 });

    // Subtotal ৳810
    await expect(billSheet.getByText('৳810')).toBeVisible();

    // VAT 5%: ৳40.50 or ৳41
    await expect(billSheet.getByText(/VAT/i)).toBeVisible();
    await expect(billSheet.getByText(/৳40\.50|৳41/)).toBeVisible();

    // Total: ৳850.50 or ৳851
    await expect(billSheet.getByText(/৳850\.50|৳851/)).toBeVisible();

    // Request bill
    const reqBillBtn = guestPage.getByTestId('request-bill-button');
    await expect(reqBillBtn).toBeVisible();
    await reqBillBtn.click();

    // Review sheet opens
    await expect(guestPage.getByTestId('review-sheet')).toBeVisible({ timeout: 10000 });

    await counterContext.close();
  });
});
