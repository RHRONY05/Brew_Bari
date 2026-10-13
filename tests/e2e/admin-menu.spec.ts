import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

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
  };
}

test.describe('M6: Admin Menu Editor (admin-menu.spec.ts)', () => {
  const creds = getAdminCredentials();

  test('admin logs in, views menu list, and toggles item availability', async ({ page }) => {
    // 1. Log in as admin
    await page.goto('/staff/login');
    await page.getByTestId('staff-email-input').fill(creds.adminEmail);
    await page.getByTestId('staff-password-input').fill(creds.adminPassword);
    await page.getByTestId('staff-login-button').click();

    await expect(page).toHaveURL(/\/staff\/admin/, { timeout: 15000 });

    // Navigate to /staff/admin/menu
    await page.goto('/staff/admin/menu');
    await expect(page).toHaveURL(/\/staff\/admin\/menu/, { timeout: 15000 });

    // Verify Menu heading
    await expect(page.getByRole('heading', { name: 'Menu', exact: true })).toBeVisible({
      timeout: 10000,
    });

    // Verify categories chips exist
    await expect(page.getByText('All ·')).toBeVisible();

    // Verify Americano row is present
    await expect(page.getByText('Americano').first()).toBeVisible();

    // Find and toggle Americano availability switch
    const row = page.locator('div[data-testid^="menu-item-row-"]:has-text("Americano")').first();
    await expect(row).toBeVisible();

    const switchBtn = row.locator('button[role="switch"]');
    await expect(switchBtn).toBeVisible();
    const initialChecked = await switchBtn.getAttribute('aria-checked');

    // Click switch
    await switchBtn.click();
    await expect(switchBtn).toHaveAttribute(
      'aria-checked',
      initialChecked === 'true' ? 'false' : 'true',
      { timeout: 5000 }
    );

    // Toggle back to original state
    await switchBtn.click();
    await expect(switchBtn).toHaveAttribute('aria-checked', initialChecked!, {
      timeout: 5000,
    });
  });

  test('admin edits Americano price 200 -> 210, adds BN name, and saves', async ({
    page,
    browser,
  }) => {
    // 1. Log in as admin
    await page.goto('/staff/login');
    await page.getByTestId('staff-email-input').fill(creds.adminEmail);
    await page.getByTestId('staff-password-input').fill(creds.adminPassword);
    await page.getByTestId('staff-login-button').click();
    await expect(page).toHaveURL(/\/staff\/admin/, { timeout: 15000 });

    await page.goto('/staff/admin/menu');
    await expect(page).toHaveURL(/\/staff\/admin\/menu/, { timeout: 15000 });

    // Find Americano row and click edit button (exact match using item-name-en)
    const row = page
      .locator('div[data-testid^="menu-item-row-"]')
      .filter({ has: page.locator('[data-testid="item-name-en"]', { hasText: /^Americano$/ }) })
      .first();
    await expect(row).toBeVisible();

    await row.locator('button[aria-label*="Edit"]').click();

    // Editor aside panel is opened
    await expect(page.getByTestId('item-editor-panel')).toBeVisible({ timeout: 5000 });

    // Update Price to 210
    const priceInput = page.getByTestId('item-price-input');
    await priceInput.fill('210');

    // Update / verify Bangla name
    const nameBnInput = page.getByTestId('item-name-bn-input');
    await nameBnInput.fill('আমেরিকানো');

    // Click Save
    await page.getByTestId('save-item-button').click();

    // Editor panel closes
    await expect(page.getByTestId('item-editor-panel')).not.toBeVisible({ timeout: 10000 });

    // Check Americano row now displays ৳210
    await expect(row.getByText('৳210')).toBeVisible({ timeout: 10000 });

    // 2. Open Guest Menu in a separate context to verify guest sees ৳210
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();

    await guestPage.goto('/brew-bari');
    await guestPage.reload();
    const americanoCard = guestPage
      .locator('[data-testid^="item-card-"]')
      .filter({ has: guestPage.getByRole('heading', { name: 'Americano', exact: true }) })
      .first();
    await expect(americanoCard.getByText('৳210')).toBeVisible({ timeout: 10000 });

    await guestContext.close();
  });

  test('admin creates a new item with options group', async ({ page }) => {
    // 1. Log in as admin
    await page.goto('/staff/login');
    await page.getByTestId('staff-email-input').fill(creds.adminEmail);
    await page.getByTestId('staff-password-input').fill(creds.adminPassword);
    await page.getByTestId('staff-login-button').click();
    await expect(page).toHaveURL(/\/staff\/admin/, { timeout: 15000 });

    await page.goto('/staff/admin/menu');
    await expect(page).toHaveURL(/\/staff\/admin\/menu/, { timeout: 15000 });

    // Click Add item button
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('item-editor-panel')).toBeVisible();

    // Fill new item info
    const testItemName = `Test Cortado ${Date.now() % 1000}`;
    await page.getByTestId('item-name-en-input').fill(testItemName);
    await page.getByTestId('item-name-bn-input').fill('টেস্ট কর্টাডো');
    await page.getByTestId('item-price-input').fill('280');

    // Add option group
    await page.getByTestId('add-option-group-button').click();
    await expect(page.getByPlaceholder('Group title (e.g. Size, Milk)').first()).toBeVisible();

    // Click Save
    await page.getByTestId('save-item-button').click();
    await expect(page.getByTestId('item-editor-panel')).not.toBeVisible({ timeout: 10000 });

    // Verify newly created item appears in the list
    await expect(page.getByText(testItemName).first()).toBeVisible({ timeout: 10000 });

    // Clean up: delete test item so it does not persist in the menu
    page.once('dialog', (dialog) => dialog.accept());
    const newRow = page
      .locator('div[data-testid^="menu-item-row-"]')
      .filter({ has: page.locator('[data-testid="item-name-en"]', { hasText: testItemName }) })
      .first();
    await newRow.locator('button[aria-label*="Edit"]').click();
    await expect(page.getByTestId('item-editor-panel')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('delete-item-button').click();
    await expect(page.getByTestId('item-editor-panel')).not.toBeVisible({ timeout: 10000 });
  });
});
