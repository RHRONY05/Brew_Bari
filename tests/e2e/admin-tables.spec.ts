import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import WebSocket from 'ws';

if (typeof (globalThis as unknown as { WebSocket: unknown }).WebSocket === 'undefined') {
  (globalThis as unknown as { WebSocket: unknown }).WebSocket = WebSocket;
}

function getAdminCredentials() {
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
    adminEmail: process.env.TEST_STAFF_ADMIN_EMAIL || 'admin@brewbari.com',
    adminPassword: process.env.TEST_STAFF_ADMIN_PASSWORD || 'BrewBari#Admin2026!',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
  };
}

test.describe('M6: Admin Tables and QR Codes (admin-tables.spec.ts)', () => {
  const creds = getAdminCredentials();

  test('regenerate table 99 token -> old URL shows invalid-QR page, new URL works', async ({
    page,
    browser,
  }) => {
    // 1. Log in as admin
    await page.goto('/staff/login');
    await page.getByTestId('staff-email-input').fill(creds.adminEmail);
    await page.getByTestId('staff-password-input').fill(creds.adminPassword);
    await page.getByTestId('staff-login-button').click();
    await expect(page).toHaveURL(/\/staff\/admin/, { timeout: 15000 });

    // 2. Go to Tables & QR page
    await page.goto('/staff/admin/tables');
    await expect(page).toHaveURL(/\/staff\/admin\/tables/, { timeout: 15000 });

    await expect(page.getByRole('heading', { name: 'Tables & QR' })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId('table-row-99')).toBeVisible({ timeout: 10000 });

    // Read initial token link
    const oldLink = await page.getByTestId('view-table-link-99').getAttribute('href');
    expect(oldLink).not.toBeNull();
    const oldToken = oldLink!.split('/t/')[1];

    // 3. Click New QR on Table 99
    await page.getByTestId('regen-token-99').click();
    await expect(page.getByTestId('regen-confirm-modal')).toBeVisible({ timeout: 5000 });

    // Confirm regenerate
    await page.getByTestId('confirm-regen-button').click();
    await expect(page.getByTestId('regen-confirm-modal')).not.toBeVisible({ timeout: 10000 });

    // 4. Wait for token to update in UI
    await expect(page.getByTestId('view-table-link-99')).not.toHaveAttribute('href', oldLink!, {
      timeout: 10000,
    });

    const newLink = await page.getByTestId('view-table-link-99').getAttribute('href');
    const newToken = newLink!.split('/t/')[1];
    expect(newToken).not.toBe(oldToken);

    // 5. Context 2: Guest navigates to old token URL -> G8 not-found page
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();

    await guestPage.goto(`/brew-bari/t/${oldToken}`);
    await expect(
      guestPage.locator('text=Table not found').or(guestPage.locator('text=Invalid table QR'))
    ).toBeVisible({ timeout: 10000 });

    // Guest navigates to new token URL -> valid table page
    await guestPage.goto(`/brew-bari/t/${newToken}`);
    await expect(guestPage.getByText('Table 99')).toBeVisible({ timeout: 10000 });

    await guestContext.close();
  });

  test('print page renders 9 cards for 8+1 tables with showTest=1', async ({ page }) => {
    // 1. Log in as admin
    await page.goto('/staff/login');
    await page.getByTestId('staff-email-input').fill(creds.adminEmail);
    await page.getByTestId('staff-password-input').fill(creds.adminPassword);
    await page.getByTestId('staff-login-button').click();
    await expect(page).toHaveURL(/\/staff\/admin/, { timeout: 15000 });

    // 2. Open print page with showTest=1
    await page.goto('/staff/admin/tables/print?showTest=1');
    await expect(page).toHaveURL(/\/staff\/admin\/tables\/print\?showTest=1/, { timeout: 15000 });

    await expect(page.getByTestId('print-sheet-container')).toBeVisible({ timeout: 10000 });

    // Assert cards 1 through 8 are present
    for (let i = 1; i <= 8; i++) {
      await expect(page.getByTestId(`qr-card-${i}`)).toBeVisible();
    }

    // Assert table 99 is also present
    await expect(page.getByTestId('qr-card-99')).toBeVisible();

    // Verify QR code images are rendered inside cards
    const qrImages = page.locator('[data-testid^="qr-card-"] img[alt$="QR code"]');
    await expect(qrImages).toHaveCount(9);
  });
});
