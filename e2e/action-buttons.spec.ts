import { expect, test, type Page } from '@playwright/test'

async function gotoPage(page: Page, pageId: string, heading: string) {
  await page.goto(`/?page=${pageId}`)
  await expect(page.locator('[data-mounted="true"]')).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 1, name: new RegExp(`^${heading}$`, 'i') })).toBeVisible({
    timeout: 10_000,
  })
}

test.describe('Action Buttons - Create New Records', () => {
  const cases: Array<{
    pageId: string
    heading: string
    action: string
    expectDialogTitle: string
  }> = [
    { pageId: 'offertes', heading: 'Offertes', action: 'Nieuwe Offerte', expectDialogTitle: 'Nieuwe Offerte' },
    { pageId: 'projecten', heading: 'Projecten', action: 'Nieuw Project', expectDialogTitle: 'Nieuw Project' },
    { pageId: 'agenda', heading: 'Agenda', action: 'Nieuwe Afspraak', expectDialogTitle: 'Nieuwe Afspraak' },
    { pageId: 'inkomsten', heading: 'Inkomsten', action: 'Nieuwe Factuur', expectDialogTitle: 'Nieuwe Factuur' },
    { pageId: 'uitgaven', heading: 'Uitgaven', action: 'Nieuwe Uitgave', expectDialogTitle: 'Nieuwe Uitgave' },
  ]

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Alleen relevant op desktop viewport')
    await page.goto('/')
    await expect(page.locator('[data-mounted="true"]')).toHaveCount(1)
  })

  for (const c of cases) {
    test(`${c.heading} page - ${c.action} button opens dialog`, async ({ page }) => {
      await gotoPage(page, c.pageId, c.heading)

      // Some pages have multiple buttons with the same label; any primary action is acceptable.
      const newButton = page.getByRole('button', { name: new RegExp(`^${c.action}$`, 'i') }).first()
      await expect(newButton).toBeVisible()
      await expect(newButton).toBeEnabled()

      await newButton.focus()
      await page.keyboard.press('Enter')

      await expect(page.getByRole('dialog')).toContainText(c.expectDialogTitle)
    })
  }
})
