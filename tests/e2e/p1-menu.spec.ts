import { test, expect } from '@playwright/test';

test.describe('M2: Guest menu P1 (p1-menu.spec.ts)', () => {
  test('browse, search, sold-out, quick section, and language toggle in P1', async ({ page }) => {
    // 1. Open guest menu with package 1 override
    await page.goto('/brew-bari?pkg=1');

    // Verify Header & restaurant name
    await expect(page.locator('h1')).toContainText('Brew Bari');
    await expect(page.getByRole('img', { name: 'Brew Bari logo' })).toBeVisible();

    // Verify Offers Carousel is visible
    await expect(page.getByTestId('offer-carousel')).toBeVisible();

    // Verify Category Navigation is present
    await expect(page.getByTestId('chip-quick')).toBeVisible();

    // 2. Search "latte"
    const searchInput = page.locator('#search-menu');
    await searchInput.fill('latte');

    // Should find Café Latte and Iced Latte
    await expect(page.getByRole('heading', { name: 'Café Latte' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Iced Latte' })).toBeVisible();


    // Clear search
    await page.getByRole('button', { name: 'Clear' }).click();

    // 3. Item sheet in P1 has no Add button
    const espressoCard = page.getByText('Espresso').first();
    await espressoCard.click();

    // Item sheet opens
    await expect(page.getByTestId('item-detail-sheet')).toBeVisible();
    // Add button should NOT be present in P1
    await expect(page.getByTestId('item-sheet-add-button')).not.toBeVisible();

    // Close sheet
    await page.getByLabel('Close').click();

    // 4. Sold-out Baked Cheesecake is visible with sold-out styling and placed LAST in its category
    const cheesecakeCard = page.locator('article', { hasText: 'Baked Cheesecake' });
    await expect(cheesecakeCard).toBeVisible();
    await expect(cheesecakeCard.getByText('Sold out')).toBeVisible();
    // Plus button not visible on sold-out item
    await expect(cheesecakeCard.getByTestId('item-card-add-button')).not.toBeVisible();

    // 5. Quick section: items <= 5 min, sold-out excluded
    await page.getByTestId('chip-quick').click();
    const quickSection = page.locator('#section-quick');
    await expect(quickSection).toBeVisible();
    // Cheesecake is NOT in Quick section
    await expect(quickSection.locator('text=Baked Cheesecake')).not.toBeVisible();

    // 6. Language toggle: switch to Bengali (বাং)
    const bnToggle = page.getByRole('button', { name: 'বাং' });
    await bnToggle.click();

    // Verify Bengali numerals and names rendered
    await expect(page.locator('h1')).toContainText('ব্রু বাড়ি');
    await expect(page.getByText('৳২৫০').first()).toBeVisible();

    // 7. Reload keeps Bengali via cookie persistence
    await page.reload();
    await expect(page.locator('h1')).toContainText('ব্রু বাড়ি');
  });
});
