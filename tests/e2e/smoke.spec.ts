import { test, expect } from '@playwright/test'

test('homepage loads the Menuwala platform page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Menuwala').first()).toBeVisible()
})
