import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

function getGGStaffCredentials() {
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
    adminEmail: process.env.TEST_GG_ADMIN_EMAIL || 'admin@grillghar.test',
    adminPassword: process.env.TEST_GG_ADMIN_PASSWORD || '',
    counterEmail: process.env.TEST_GG_COUNTER_EMAIL || 'counter@grillghar.test',
    counterPassword: process.env.TEST_GG_COUNTER_PASSWORD || '',
  };
}

test.describe('Grill Ghar: Staff Authentication & Package Locking (gg-staff.spec.ts)', () => {
  const creds = getGGStaffCredentials();

  test('GG admin logs in, redirects to /staff/admin, sees Grill Ghar brand and theme', async ({
    page,
  }) => {
    test.skip(!creds.adminPassword, 'TEST_GG_ADMIN_PASSWORD not set');

    await page.goto('/staff/login');

    await page.getByTestId('staff-email-input').fill(creds.adminEmail);
    await page.getByTestId('staff-password-input').fill(creds.adminPassword);
    await page.getByTestId('staff-login-button').click();

    // Redirects to /staff/admin -> /staff/admin/menu
    await expect(page).toHaveURL(/\/staff\/admin/, { timeout: 15000 });

    // Verify Grill Ghar branding in AdminNav (in whichever nav header/aside is currently visible)
    await expect(page.locator('header:visible, aside:visible').getByText('Grill Ghar').first()).toBeVisible({ timeout: 10000 });

    // Navigate to Settings
    await page.goto('/staff/admin/settings');
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible({ timeout: 10000 });

    // Package Level section must NOT be rendered because package_locked is true
    const packageSection = page.locator('section[aria-label="Package"]');
    await expect(packageSection).toHaveCount(0);
  });

  test('GG counter logs in, redirects to /staff/counter, sees Grill Ghar theme', async ({
    page,
  }) => {
    test.skip(!creds.counterPassword, 'TEST_GG_COUNTER_PASSWORD not set');

    await page.goto('/staff/login');

    await page.getByTestId('staff-email-input').fill(creds.counterEmail);
    await page.getByTestId('staff-password-input').fill(creds.counterPassword);
    await page.getByTestId('staff-login-button').click();

    // Land on /staff/counter
    await expect(page).toHaveURL(/\/staff\/counter/, { timeout: 15000 });

    // Verify Grill Ghar branding
    await expect(page.locator('header:visible, aside:visible, main:visible').getByText('Grill Ghar').first()).toBeVisible({ timeout: 10000 });
  });
});
