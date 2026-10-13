import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

function getGgAdminCredentials() {
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
  };
}

test.describe('Grill Ghar: Admin Options Builder (gg-admin-options.spec.ts)', () => {
  const creds = getGgAdminCredentials();

  test('GG admin creates Naga Smash options from scratch in UI and guest sheet behaves like design', async ({
    page,
    browser,
  }) => {
    // 1. Log in as Grill Ghar admin
    await page.goto('/staff/login');
    await page.getByTestId('staff-email-input').fill(creds.adminEmail);
    await page.getByTestId('staff-password-input').fill(creds.adminPassword);
    await page.getByTestId('staff-login-button').click();

    await expect(page).toHaveURL(/\/staff\/admin/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // 2. Navigate to menu editor
    await page.goto('/staff/admin/menu');
    await expect(page).toHaveURL(/\/staff\/admin\/menu/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Menu', exact: true })).toBeVisible({
      timeout: 10000,
    });

    // 3. Open Add item form
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('item-editor-panel')).toBeVisible();

    const uniqueId = Date.now() % 10000;
    const itemName = `Naga Test Burger ${uniqueId}`;

    await page.getByTestId('item-name-en-input').fill(itemName);
    await page.getByTestId('item-name-bn-input').fill('নাগা টেস্ট বার্গার');
    await page.getByTestId('item-price-input').fill('340');

    // Spice level dropdown
    await page.getByTestId('item-spice-level-select').selectOption('4');

    // Tags: select pairs-well
    await page.getByRole('button', { name: 'pairs-well', exact: true }).click();

    // 4. Build Options Group 1: Make it a meal (cards, single)
    await page.getByTestId('add-option-group-button').click();
    await page.getByTestId('option-group-title-0').fill('Make it a meal');
    await page.getByTestId('option-group-title-bn-0').fill('মিল করুন');
    await page.getByTestId('option-group-id-0').fill('combo');
    await page.getByTestId('option-group-display-0').selectOption('cards');

    // Choice 1: Solo burger
    await page.getByTestId('choice-name-en-0-0').fill('Solo burger');
    await page.getByTestId('choice-name-bn-0-0').fill('শুধু বার্গার');
    await page.getByTestId('choice-price-0-0').fill('0');
    await page.getByTestId('choice-desc-en-0-0').fill('Burger only');

    // Choice 2: Combo meal
    await page.getByTestId('choice-name-en-0-1').fill('Combo meal');
    await page.getByTestId('choice-name-bn-0-1').fill('কম্বো মিল');
    await page.getByTestId('choice-price-0-1').fill('150');
    await page.getByTestId('choice-desc-en-0-1').fill('+ Fries & drink');
    await page.getByTestId('choice-compare-0-1').fill('200');

    // 5. Build Options Group 2: Choose drink (list, conditional show_if combo === meal)
    await page.getByTestId('add-option-group-button').click();
    await page.getByTestId('option-group-title-1').fill('Choose drink');
    await page.getByTestId('option-group-title-bn-1').fill('পানীয় পছন্দ করুন');
    await page.getByTestId('option-group-id-1').fill('drink');
    await page.getByTestId('option-group-display-1').selectOption('list');

    // Conditional visibility: parent combo, choice combo-meal (slug from name is combo-meal or choice-2)
    await page.getByTestId('option-group-show-if-group-1').selectOption('combo');
    // Select the combo meal choice
    const choiceValue = await page.getByTestId('option-group-show-if-choice-1').locator('option').nth(1).getAttribute('value');
    if (choiceValue) {
      await page.getByTestId('option-group-show-if-choice-1').selectOption(choiceValue);
    }

    // Set drink choices
    await page.getByTestId('choice-name-en-1-0').fill('Coca-Cola');
    await page.getByTestId('choice-price-1-0').fill('0');
    await page.getByTestId('choice-name-en-1-1').fill('Sprite');
    await page.getByTestId('choice-price-1-1').fill('0');

    // 6. Build Options Group 3: Heat (chips)
    await page.getByTestId('add-option-group-button').click();
    await page.getByTestId('option-group-title-2').fill('Spice level');
    await page.getByTestId('option-group-id-2').fill('heat');
    await page.getByTestId('option-group-display-2').selectOption('chips');
    await page.getByTestId('choice-name-en-2-0').fill('Mild');
    await page.getByTestId('choice-heat-2-0').selectOption('1');
    await page.getByTestId('choice-name-en-2-1').fill('Naga blast');
    await page.getByTestId('choice-heat-2-1').selectOption('4');

    // 7. Save item
    await page.getByTestId('save-item-button').click();
    await expect(page.getByTestId('item-editor-panel')).not.toBeVisible({ timeout: 10000 });

    // Item appears in menu list
    const newRow = page.locator(`div[data-testid^="menu-item-row-"]:has-text("${itemName}")`).first();
    await expect(newRow).toBeVisible({ timeout: 10000 });

    // 8. Open Guest page to verify guest sheet renders cards, chips, and conditional logic
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    await guestPage.setViewportSize({ width: 375, height: 812 });
    await guestPage.goto('/grill-ghar/t/token_gg_99');
    await guestPage.reload();

    // Use search to find new item directly
    const search = guestPage.locator('input#search-menu');
    await expect(search).toBeVisible({ timeout: 10000 });
    await search.fill(itemName);

    // Find and open test item
    const itemCard = guestPage.locator(`[data-testid^="item-card-"]:has-text("${itemName}")`).first();
    await expect(itemCard).toBeVisible({ timeout: 10000 });
    await itemCard.click();

    // Verify ItemDetailSheet opened
    const sheet = guestPage.locator('[data-testid="item-detail-sheet"]');
    await expect(sheet).toBeVisible({ timeout: 10000 });
    await expect(sheet.getByRole('heading', { name: itemName, exact: true })).toBeVisible();

    // Cards display for "Make it a meal"
    await expect(sheet.getByText('Make it a meal')).toBeVisible();
    await expect(sheet.getByText('Solo burger')).toBeVisible();
    await expect(sheet.getByText('Combo meal')).toBeVisible();
    await expect(sheet.getByText('Burger only')).toBeVisible();
    await expect(sheet.getByText('+ Fries & drink')).toBeVisible();
    await expect(sheet.getByText('SAVE ৳50')).toBeVisible();

    // Chips display for "Spice level"
    await expect(sheet.getByText('Spice level')).toBeVisible();
    await expect(sheet.getByText('Mild')).toBeVisible();
    await expect(sheet.getByText('Naga blast')).toBeVisible();

    // Initially "Solo burger" is active, so "Choose drink" should NOT be visible
    await expect(sheet.getByText('Choose drink')).not.toBeVisible();

    // Tap "Combo meal" -> "Choose drink" should appear
    await sheet.getByText('Combo meal').click();
    await expect(sheet.getByText('Choose drink')).toBeVisible({ timeout: 5000 });
    await expect(sheet.getByText('Coca-Cola')).toBeVisible();
    await expect(sheet.getByText('Sprite')).toBeVisible();

    // Tap back to "Solo burger" -> "Choose drink" should hide
    await sheet.getByText('Solo burger').click();
    await expect(sheet.getByText('Choose drink')).not.toBeVisible({ timeout: 5000 });

    await guestContext.close();

    // 9. Clean up: Delete created test item from menu editor
    page.once('dialog', (dialog) => dialog.accept());
    await newRow.locator('button[aria-label*="Edit"]').click();
    await expect(page.getByTestId('item-editor-panel')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('delete-item-button').click();
    await expect(page.getByTestId('item-editor-panel')).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator(`div[data-testid^="menu-item-row-"]:has-text("${itemName}")`)).not.toBeVisible({ timeout: 10000 });
  });
});
