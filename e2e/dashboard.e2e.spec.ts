import { test, expect } from '@playwright/test'

test.describe('Dashboard smoke', () => {
  test('kan dashboard hoofdpagina openen', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/dashboard/i)
  })
})

