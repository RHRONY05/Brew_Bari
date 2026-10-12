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

test.describe('M6: Admin Additional Pages (admin-pages.spec.ts)', () => {
  const creds = getAdminCredentials();

  test.beforeEach(async ({ page }) => {
    // Log in as admin
    await page.goto('/staff/login');
    await page.getByTestId('staff-email-input').fill(creds.adminEmail);
    await page.getByTestId('staff-password-input').fill(creds.adminPassword);
    await page.getByTestId('staff-login-button').click();

    // Admin lands on /staff/admin
    await expect(page).toHaveURL(/\/staff\/admin/, { timeout: 15000 });
  });

  test('admin visits /staff/admin/feedback and views ratings summary and comments', async ({ page }) => {
    await page.goto('/staff/admin/feedback');
    await expect(page.getByRole('heading', { name: 'Feedback', exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('section[aria-label="Summary"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('section[aria-label="Recent feedback"]')).toBeVisible({ timeout: 10000 });
  });

  test('admin visits /staff/admin/offers and sees active offers list', async ({ page }) => {
    await page.goto('/staff/admin/offers');
    await expect(page.getByRole('heading', { name: 'Offers', exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('add-offer-button')).toBeVisible({ timeout: 10000 });
  });

  test('admin visits /staff/admin/settings and views package switcher and cafe info', async ({ page }) => {
    await page.goto('/staff/admin/settings');
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible({ timeout: 10000 });
    // Package selector cards P1, P2, P3
    await expect(page.getByTestId('package-card-p1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('package-card-p2')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('package-card-p3')).toBeVisible({ timeout: 10000 });
    // Save button
    await expect(page.getByTestId('save-settings-button')).toBeVisible({ timeout: 10000 });
  });
});
