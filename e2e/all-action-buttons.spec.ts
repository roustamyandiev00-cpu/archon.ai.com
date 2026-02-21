import { test, expect, type Page } from '@playwright/test'

test.describe('All Action Buttons', () => {
  async function gotoPage(page: Page, pageId: string, heading: string) {
    await page.goto(`/?page=${pageId}`)
    await expect(page.locator('[data-mounted="true"]')).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1, name: new RegExp(`^${heading}$`, 'i') })).toBeVisible({
      timeout: 10_000,
    })
  }

  const CASES: Array<{
    pageId: string
    heading: string
    primaryAction: string
    expectDialogTitle?: string
  }> = [
    {
      pageId: 'bedrijven',
      heading: 'Bedrijven',
      primaryAction: 'Nieuw Bedrijf',
      expectDialogTitle: 'Nieuw Bedrijf',
    },
    {
      pageId: 'contacten',
      heading: 'Contacten',
      primaryAction: 'Nieuw Contact',
      expectDialogTitle: 'Nieuw Contact Aanmaken',
    },
    {
      pageId: 'deals',
      heading: 'Deals',
      primaryAction: 'Nieuwe Deal',
      expectDialogTitle: 'Nieuwe Deal',
    },
    { pageId: 'timesheets', heading: 'Timesheets', primaryAction: 'Nieuwe Entry' },
    { pageId: 'artikelen', heading: 'Artikelen', primaryAction: 'Nieuw Artikel' },
    {
      pageId: 'offertes',
      heading: 'Offertes',
      primaryAction: 'Nieuwe Offerte',
      expectDialogTitle: 'Nieuwe Offerte',
    },
    {
      pageId: 'projecten',
      heading: 'Projecten',
      primaryAction: 'Nieuw Project',
      expectDialogTitle: 'Nieuw Project',
    },
    {
      pageId: 'agenda',
      heading: 'Agenda',
      primaryAction: 'Nieuwe Afspraak',
      expectDialogTitle: 'Nieuwe Afspraak',
    },
    {
      pageId: 'inkomsten',
      heading: 'Inkomsten',
      primaryAction: 'Nieuwe Factuur',
      expectDialogTitle: 'Nieuwe Factuur',
    },
    {
      pageId: 'uitgaven',
      heading: 'Uitgaven',
      primaryAction: 'Nieuwe Uitgave',
      expectDialogTitle: 'Nieuwe Uitgave',
    },
  ]

  for (const c of CASES) {
    test(`${c.heading} - ${c.primaryAction} button triggers a toast`, async ({ page }) => {
      await gotoPage(page, c.pageId, c.heading)

      // Some pages contain multiple actions with the same label (e.g. "Nieuwe Deal").
      // We just require at least one visible primary action to work.
      const button = page.getByRole('button', { name: new RegExp(`^${c.primaryAction}$`, 'i') }).first()
      await expect(button).toBeVisible()
      await expect(button).toBeEnabled()

      // Use keyboard activation to avoid sticky headers/overlays intercepting pointer clicks on mobile.
      await button.focus()
      await page.keyboard.press('Enter')

      if (c.expectDialogTitle) {
        await expect(page.getByRole('dialog')).toContainText(c.expectDialogTitle)
        return
      }

      const toastRoot = page.locator('[toast-close]').locator('..').first()
      await expect(toastRoot).toContainText(c.primaryAction)
    })
  }
})
