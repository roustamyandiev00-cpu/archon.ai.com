import { test, expect } from '@playwright/test'

test.describe('Offertes pagina', () => {
  test('kan offertes pagina openen zonder fouten', async ({ page }) => {
    await page.goto('/offertes')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

