import { test, expect } from '@playwright/test'

const routesWithButtons: Array<{ path: string; description: string }> = [
  { path: '/', description: 'dashboard home' },
  { path: '/deals', description: 'deals pagina' },
  { path: '/register', description: 'registratie pagina' },
  { path: '/contacten', description: 'contacten pagina' },
]

test.describe('Buttons all pages', () => {
  for (const route of routesWithButtons) {
    test(`kan knoppen laden op ${route.description} (${route.path})`, async ({ page }) => {
      await page.goto(route.path)
      const buttons = page.getByRole('button')
      await expect(buttons.first()).toBeVisible()
    })
  }
})

