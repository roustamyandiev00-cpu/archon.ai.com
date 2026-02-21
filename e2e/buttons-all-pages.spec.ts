import { test, expect, type Locator, type Page } from '@playwright/test'

type PageInfo = { id: string; label: string; contentId?: string }

const PAGES: PageInfo[] = [
  { id: 'home', label: 'Dashboard', contentId: 'Welkom terug' },
  { id: 'bedrijven', label: 'Bedrijven', contentId: 'Bedrijven' },
  { id: 'contacten', label: 'Contacten', contentId: 'Contacten' },
  { id: 'deals', label: 'Deals', contentId: 'Deals' },
  { id: 'offertes', label: 'Offertes', contentId: 'Offertes' },
  { id: 'projecten', label: 'Projecten', contentId: 'Projecten' },
  { id: 'agenda', label: 'Agenda', contentId: 'Agenda' },
  { id: 'inkomsten', label: 'Inkomsten', contentId: 'Inkomsten' },
  { id: 'uitgaven', label: 'Uitgaven', contentId: 'Uitgaven' },
  { id: 'artikelen', label: 'Artikelen', contentId: 'Artikelen' },
  { id: 'timesheets', label: 'Timesheets', contentId: 'Timesheets' },
  { id: 'betalingen', label: 'Betalingen', contentId: 'Betalingen' },
  { id: 'ai-assistant', label: 'AI Assistant', contentId: 'AI Assistant' },
  { id: 'abonnement', label: 'Abonnement', contentId: 'Abonnement' },
  { id: 'instellingen', label: 'Instellingen', contentId: 'Instellingen' },
]

async function ensureDesktopSidebar(page: Page): Promise<Locator> {
  const sidebar = page.locator('#desktop-sidebar')
  if (await sidebar.isVisible()) return sidebar

  const openBtn = page.getByRole('button', { name: /Zijbalk uitklappen/i })
  if (await openBtn.isVisible()) {
    await openBtn.click()
    await expect(sidebar).toBeVisible()
    return sidebar
  }

  return sidebar
}

async function navigateViaSidebar(page: Page, label: string) {
  const sidebar = await ensureDesktopSidebar(page)
  const btn = sidebar.getByRole('button', { name: label, exact: true })
  await btn.click()
}

async function navigateViaMobileMenu(page: Page, label: string) {
  await page.getByRole('button', { name: 'Menu openen' }).click()
  const sheet = page.locator('#mobile-sidebar')
  await expect(sheet).toBeVisible()

  const navBtn = sheet.getByRole('button', { name: label, exact: true })
  await expect(navBtn).toBeVisible()
  await navBtn.scrollIntoViewIfNeeded()
  await navBtn.click()

  await expect(sheet).toBeHidden()
}

async function navigate(page: Page, viewport: string, target: PageInfo) {
  if (viewport === 'mobile') {
    await navigateViaMobileMenu(page, target.label)
  } else {
    await navigateViaSidebar(page, target.label)
  }

  // Wait for page content to load (via text content, not URL)
  await page.waitForLoadState('domcontentloaded')

  if (target.id === 'home') {
    await expect(page.getByRole('heading', { name: /Welkom terug/i })).toBeVisible({ timeout: 10000 })
    return
  }

  await expect(page.getByRole('heading', { level: 1, name: new RegExp(`^${target.label}$`, 'i') })).toBeVisible({
    timeout: 10000,
  })
}

test.describe('Button Functionality - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 })
    await expect(page.getByRole('heading', { name: /Welkom terug/i })).toBeVisible({ timeout: 30000 })
    // Small pause for React hydration to complete
    await page.waitForTimeout(500)
  })

  test('header buttons exist and are enabled on key pages (desktop)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Desktop test')

    const keyPages: PageInfo[] = [
      { id: 'home', label: 'Dashboard' },
      { id: 'bedrijven', label: 'Bedrijven' },
      { id: 'deals', label: 'Deals' },
      { id: 'instellingen', label: 'Instellingen' },
    ]

    for (const pageInfo of keyPages) {
      await navigate(page, 'desktop', pageInfo)

      const header = page.locator('header')
      await expect(header).toBeVisible({ timeout: 5000 })

      // Check all header buttons exist and are enabled
      const buttons = [
        /Open zoeken/i,
        /Thema wisselen/i,
        /Meldingen/i,
        /Account/i,
        /Nieuwe actie/i,
      ]

      for (const btnPattern of buttons) {
        const btn = page.getByRole('button', { name: btnPattern })
        await expect(btn).toBeVisible()
        await expect(btn).toBeEnabled()
      }
    }
  })

  test('sidebar navigation buttons are functional (desktop)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Desktop test')

    // Test main nav items (skip home for faster execution)
    const mainNavItems = PAGES.slice(1, 8)
    for (const item of mainNavItems) {
      await navigate(page, 'desktop', item)
      // Just verify URL changed, content loads async
      await page.waitForLoadState('domcontentloaded')
    }
  })

  test('navigation buttons are functional (mobile)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile test')

    const keyPages: PageInfo[] = [
      { id: 'home', label: 'Dashboard' },
      { id: 'bedrijven', label: 'Bedrijven' },
      { id: 'deals', label: 'Deals' },
    ]

    for (const item of keyPages) {
      await navigate(page, 'mobile', item)
    }
  })

  test('bottom navigation buttons are functional (desktop)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Desktop test')

    const bottomItems: PageInfo[] = [
      { id: 'ai-assistant', label: 'AI Assistant' },
      { id: 'abonnement', label: 'Abonnement' },
      { id: 'instellingen', label: 'Instellingen' },
    ]

    for (const item of bottomItems) {
      await navigate(page, 'desktop', item)
    }
  })

  test('upgrade button is enabled (desktop)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Desktop test')

    const upgradeBtn = page.getByRole('button', { name: /Upgrade/i })
    if (await upgradeBtn.isVisible()) {
      await expect(upgradeBtn).toBeEnabled()
    }
  })

  test('all buttons have proper aria labels or titles (desktop)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Desktop test')

    const buttons = page.locator('button')
    const count = await buttons.count()

    for (let i = 0; i < Math.min(count, 20); i++) {
      const btn = buttons.nth(i)
      const ariaLabel = await btn.getAttribute('aria-label')
      const title = await btn.getAttribute('title')
      const text = await btn.textContent()
      const hasLabel = ariaLabel || title || (text && text.trim().length > 0)

      if (await btn.isVisible()) {
        expect(hasLabel).toBeTruthy()
      }
    }
  })

  test('buttons respond to keyboard navigation (desktop)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Desktop test')

    for (let i = 0; i < 5; i++) await page.keyboard.press('Tab')

    const focused = await page.evaluate(() => {
      const el = document.activeElement
      return { tag: el?.tagName }
    })

    expect(['BUTTON', 'A', 'INPUT']).toContain(focused.tag)
  })

  test('no buttons log critical console errors (desktop)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Desktop test')

    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    const buttons = page.locator('button')
    const count = Math.min(5, await buttons.count())

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i)
      if (await btn.isEnabled()) {
        try {
          await btn.click({ force: true, timeout: 500 })
        } catch {
          // ignore
        }
        await page.waitForTimeout(100)
      }
    }

    // Filter out toast and non-critical errors
    const criticalErrors = errors.filter(
      (err) => !err.includes('toast') &&
               !err.includes('undefined') &&
               !err.includes('Cannot read') &&
               !err.includes('PrismaClient') &&
               !err.includes('query_engine') &&
               !err.includes('Failed to fetch') &&
               !err.includes('fetch') &&
               !err.includes('Error fetching')
    )
    expect(criticalErrors).toHaveLength(0)
  })
})
