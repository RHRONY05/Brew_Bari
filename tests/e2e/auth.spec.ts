import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

function getStaffCredentials() {
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
    adminPassword: process.env.TEST_STAFF_ADMIN_PASSWORD || 'CoffeeBari2026!',
    counterEmail: process.env.TEST_STAFF_COUNTER_EMAIL || 'counter@brewbari.com',
    counterPassword: process.env.TEST_STAFF_COUNTER_PASSWORD || 'CoffeeBari2026!',
  };
}

test.describe('M4: Staff Authentication & Role Routing (auth.spec.ts)', () => {
  const creds = getStaffCredentials();

  test('unauthenticated visit to /staff/counter or /staff/admin redirects to /staff/login', async ({
    page,
  }) => {
    await page.goto('/staff/counter');
    await expect(page).toHaveURL(/\/staff\/login/);

    await page.goto('/staff/admin');
    await expect(page).toHaveURL(/\/staff\/login/);
  });

  test('invalid login credentials displays error alert', async ({ page }) => {
    await page.goto('/staff/login');

    await page.getByTestId('staff-email-input').fill('unknown@brewbari.com');
    await page.getByTestId('staff-password-input').fill('WrongPassword123!');
    await page.getByTestId('staff-login-button').click();

    await expect(page.getByTestId('login-error-alert')).toBeVisible({ timeout: 10000 });
  });

  test('counter staff signs in and is directed to /staff/counter; denied from /staff/admin', async ({
    page,
  }) => {
    await page.goto('/staff/login');

    await page.getByTestId('staff-email-input').fill(creds.counterEmail);
    await page.getByTestId('staff-password-input').fill(creds.counterPassword);
    await page.getByTestId('staff-login-button').click();

    // Land on /staff/counter
    await expect(page).toHaveURL(/\/staff\/counter/, { timeout: 15000 });

    // Counter staff attempting to access /staff/admin gets redirected back to /staff/counter
    await page.goto('/staff/admin').catch(() => {});
    await expect(page).toHaveURL(/\/staff\/counter/, { timeout: 15000 });
  });

  test('admin signs in and is directed to /staff/admin; can also access /staff/counter', async ({
    page,
  }) => {
    await page.goto('/staff/login');

    await page.getByTestId('staff-email-input').fill(creds.adminEmail);
    await page.getByTestId('staff-password-input').fill(creds.adminPassword);
    await page.getByTestId('staff-login-button').click();

    // Land on /staff/admin (or /staff/admin/menu)
    await expect(page).toHaveURL(/\/staff\/admin/, { timeout: 15000 });

    // Admin can also access counter board
    await page.goto('/staff/counter').catch(() => {});
    await expect(page).toHaveURL(/\/staff\/counter/, { timeout: 15000 });
  });
});
