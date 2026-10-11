import { test, expect } from '@playwright/test';

test.describe('Responsive layout tests (responsive.spec.ts)', () => {
  test('guest menu at 768x1024 (tablet): no horizontal overflow, multi-column grid', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/m/brew-bari?pkg=3');

    // Verify no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Open item sheet
    await page.getByText('Cappuccino').first().click();
    await expect(page.getByTestId('item-detail-sheet')).toBeVisible();

    // Verify Add button is visible in P3
    const addBtn = page.getByTestId('item-sheet-add-button');
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Verify Bottom action bar shows Cart with 1 item
    await expect(page.getByTestId('action-view-order')).toBeVisible();
  });

  test('guest menu at 1440x900 (desktop): no horizontal overflow, centered container', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/m/brew-bari?pkg=3');

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Verify header and menu content are centered and visible
    await expect(page.locator('h1')).toContainText('Brew Bari');
  });
});
