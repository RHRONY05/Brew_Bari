import { test, expect } from '@playwright/test';

test.describe('M7: Demo Launcher (launcher.spec.ts)', () => {
  test('salesperson opens launcher at / and views all links and package switcher', async ({ page }) => {
    await page.goto('/');

    // Heading
    await expect(page.getByRole('heading', { name: /Brew Bari/i })).toBeVisible();

    // Package switcher cards
    await expect(page.getByTestId('demo-package-p1')).toBeVisible();
    await expect(page.getByTestId('demo-package-p2')).toBeVisible();
    await expect(page.getByTestId('demo-package-p3')).toBeVisible();

    // Customer links
    await expect(page.getByTestId('launcher-menu-link')).toBeVisible();
    await expect(page.getByTestId('launcher-table-1')).toBeVisible();
    await expect(page.getByTestId('launcher-table-99')).toBeVisible();

    // Staff links
    await expect(page.getByTestId('launcher-counter-link')).toBeVisible();
    await expect(page.getByTestId('launcher-admin-link')).toBeVisible();
  });
});
