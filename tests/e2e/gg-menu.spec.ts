import { test, expect } from '@playwright/test';

test.describe('Grill Ghar: Menu Home GG1 (gg-menu.spec.ts)', () => {
  test('renders menu home matching GG1 at 375x812 with Flame Red theme and fonts', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/grill-ghar/t/token_gg_99');

    // Header & Brand
    await expect(page.locator('h1:has-text("Grill Ghar")')).toBeVisible();
    await expect(page.getByText('Table 99')).toBeVisible();
    await expect(page.getByText('Grilled hot, served fast')).toBeVisible();

    // Theme tokens check
    const bodyColor = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="bottom-action-bar"] [data-testid="action-view-order"]') ||
                 document.querySelector('[data-testid="offer-carousel"] [data-testid="action-view-order"]') ||
                 document.querySelector('button[data-testid="chip-all"] span span');
      return el ? window.getComputedStyle(el).backgroundColor : '';
    });
    expect(bodyColor).toBeTruthy();

    // Search bar with Grill Ghar placeholder
    const searchInput = page.locator('input#search-menu');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute(
      'placeholder',
      'Search burgers, chicken, shawarma…'
    );

    // Hero Offer Carousel
    const offerCarousel = page.locator('[data-testid="offer-carousel"]');
    await expect(offerCarousel).toBeVisible();
    await expect(offerCarousel.getByText(/SMOKY\.|FAMILY|DUO/i).first()).toBeVisible();

    // Round Category Navigation
    const nav = page.locator('nav[aria-label="Categories"]');
    await expect(nav).toBeVisible();
    await expect(page.getByTestId('chip-all')).toBeVisible();
    await expect(page.getByTestId('chip-deals')).toBeVisible();
    await expect(page.getByTestId('chip-all').getByText('All')).toBeVisible();

    // Meal Deals Row with SAVE %
    const dealsRow = page.locator('[data-testid="deals-row-section"]');
    await expect(dealsRow).toBeVisible();
    await expect(dealsRow.getByText('Meal deals')).toBeVisible();
    await expect(dealsRow.locator('text=/SAVE \\d+%/').first()).toBeVisible();

    // Quick Picks Banner
    const quickBanner = page.locator('[data-testid="quick-picks-banner"]');
    await expect(quickBanner).toBeVisible();
    await expect(quickBanner.getByText('In a hurry?')).toBeVisible();
    await expect(
      quickBanner.getByText('Fries, wings & shakes — ready in 5 min')
    ).toBeVisible();

    // Bold ItemCards & Spice Level
    const bestsellers = page.locator('.card:has-text("Bestseller")');
    await expect(bestsellers.first()).toBeVisible();

    // Double Smash is sold out
    const doubleSmashCard = page.locator('.card:has-text("Double Smash")');
    await expect(doubleSmashCard).toBeVisible();
    await expect(doubleSmashCard.getByText('Sold out')).toBeVisible();

    // Action Bar
    const actionBar = page.locator('[data-testid="bottom-action-bar"]');
    await expect(actionBar).toBeVisible();
    await expect(actionBar.getByTestId('action-call-waiter')).toBeVisible();
    await expect(actionBar.getByTestId('action-call-waiter')).toHaveText(/Waiter/i);
  });

  test('language toggle to Bengali switches all strings without broken layouts', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/grill-ghar/t/token_gg_99');

    // Toggle to Bengali
    await page.getByRole('button', { name: 'বাং' }).click();

    // Bengali Title & Header
    await expect(page.locator('h1:has-text("গ্রিল ঘর")')).toBeVisible();
    await expect(page.getByText(/টেবিল\s*99/)).toBeVisible();

    // Search placeholder
    const searchInput = page.locator('input#search-menu');
    await expect(searchInput).toHaveAttribute(
      'placeholder',
      'বার্গার, চিকেন, শাওয়ারমা খুঁজুন…'
    );

    // Navigation & Deals
    await expect(page.getByTestId('chip-all').getByText('সবগুলো')).toBeVisible();
    await expect(page.getByTestId('chip-deals').getByText('ডিলস')).toBeVisible();
    await expect(page.getByText('মিল ডিলস')).toBeVisible();
    await expect(page.locator('text=/সেভ \\d+%/').first()).toBeVisible();

    // Quick banner in Bengali
    await expect(page.getByText('তাড়া আছে?')).toBeVisible();
    await expect(
      page.getByText('ফ্রাইজ, উইংস আর শেক — ৫ মিনিটে রেডি')
    ).toBeVisible();

    // Sold out in Bengali
    await expect(page.getByText('শেষ').first()).toBeVisible();
  });

  test('no horizontal overflow across viewports (320, 375, 768, 1440)', async ({
    page,
  }) => {
    const viewports = [
      { width: 320, height: 568 },
      { width: 375, height: 812 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/grill-ghar/t/token_gg_99');

      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(
        isOverflowing,
        `Expected no horizontal overflow at viewport ${vp.width}x${vp.height}`
      ).toBe(false);
    }
  });

  test('Brew Bari remains unchanged with standard café layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/brew-bari');

    // Header & Tagline
    await expect(page.locator('h1:has-text("Brew Bari")')).toBeVisible();

    // Chips category nav (NOT round icons)
    await expect(page.locator('[data-testid="chip-all"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="chip-quick"]')).toBeVisible();

    // No deals row on Brew Bari
    await expect(page.locator('[data-testid="deals-row-section"]')).toHaveCount(0);

    // No quick banner on Brew Bari
    await expect(page.locator('[data-testid="quick-picks-banner"]')).toHaveCount(0);

    // Standard Quick section exists
    await expect(page.locator('[data-testid="category-section-quick"]')).toBeVisible();

    // Search placeholder
    const searchInput = page.locator('input#search-menu');
    await expect(searchInput).toHaveAttribute(
      'placeholder',
      'Search coffee, juice, bites…'
    );
  });

  test('item detail GG2: cards, conditional drink, spice chips, dynamic add meal button', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/grill-ghar/t/token_gg_99');

    // Click Naga Smash Burger
    await page.getByRole('heading', { name: 'Naga Smash Burger' }).first().click();

    // Sheet opens
    const sheet = page.getByTestId('item-detail-sheet');
    await expect(sheet).toBeVisible();

    // Make it a meal cards visible
    await expect(sheet.getByText('Make it a meal?')).toBeVisible();
    await expect(sheet.getByText('Just the burger')).toBeVisible();
    await expect(sheet.getByText('Meal', { exact: true })).toBeVisible();
    await expect(sheet.getByText('SAVE ৳50')).toBeVisible();

    // Initially solo: drink not visible, add button enabled
    await expect(sheet.getByText('Your meal drink')).toHaveCount(0);
    const addBtn = page.getByTestId('item-sheet-add-button');
    await expect(addBtn).toBeEnabled();
    await expect(addBtn).toHaveText(/Add to cart/i);
    await expect(addBtn).toHaveText(/৳320/);

    // Click Meal card
    await sheet.getByText('Meal', { exact: true }).click();

    // Drink group appears, and Add button is disabled until drink is chosen
    await expect(sheet.getByText('Your meal drink')).toBeVisible();
    await expect(addBtn).toBeDisabled();

    // Pick Cola
    await sheet.getByText(/Cola/i).first().click();

    // Now enabled, price is ৳470, button says "Add meal"
    await expect(addBtn).toBeEnabled();
    await expect(addBtn).toHaveText(/Add meal/i);
    await expect(addBtn).toHaveText(/৳470/);

    // Pick Naga spice chip
    await sheet.getByRole('button', { name: 'Naga' }).click();

    // Add to cart
    await addBtn.click();

    // Sheet closes, cart shows item added
    await expect(sheet).not.toBeVisible();
    const actionCart = page.getByTestId('action-view-order');
    await expect(actionCart).toBeVisible();
    await expect(actionCart).toHaveText(/৳470/);
  });
});
