import { test, expect } from '@playwright/test'

test('homepage loads demo launcher', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('text=Brew Bari')).toBeVisible()
})
