import { expect, test } from '@playwright/test'

test('desktop sidebar navigatie wisselt pagina', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Alleen relevant op desktop viewport')

  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Welkom terug!' })).toBeVisible()
  await expect(page.locator('[data-mounted="true"]')).toHaveCount(1)

  const desktopSidebar = page.locator('#desktop-sidebar')
  await desktopSidebar.getByRole('button', { name: 'Bedrijven' }).click()

  await expect(page.getByRole('heading', { level: 1, name: /Bedrijven/i })).toBeVisible()
  await expect(page).toHaveURL(/\\?page=bedrijven/)

  await desktopSidebar.getByRole('button', { name: /^(Dashboard|Ga van start)$/i }).click()
  await expect(page.getByRole('heading', { name: 'Welkom terug!' })).toBeVisible()
  await expect(page).not.toHaveURL(/\\bpage=/)
})

test('layout blijft stabiel bij paginawissel (geen shift door scrollbar)', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Alleen relevant op desktop viewport')

  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-mounted="true"]')).toHaveCount(1)

  const actionButton = page.getByRole('button', { name: 'Nieuwe actie' })
  await expect(actionButton).toBeVisible()

  const beforeClientWidth = await page.evaluate(() => document.documentElement.clientWidth)
  const beforeBox = await actionButton.boundingBox()
  expect(beforeBox, 'Expected "Nieuwe actie" button to have a bounding box').not.toBeNull()

  const desktopSidebar = page.locator('#desktop-sidebar')
  await desktopSidebar.getByRole('button', { name: 'Bedrijven' }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Bedrijven/i })).toBeVisible()

  const afterClientWidth = await page.evaluate(() => document.documentElement.clientWidth)
  const afterBox = await actionButton.boundingBox()
  expect(afterBox, 'Expected "Nieuwe actie" button to have a bounding box after navigation').not.toBeNull()

  // If the scrollbar appears/disappears, the layout width changes and right-aligned header items jump.
  expect(afterClientWidth).toBe(beforeClientWidth)
  expect(Math.abs(afterBox!.x - beforeBox!.x)).toBeLessThanOrEqual(1)
})

test('command palette (Ctrl+K) navigeert naar een pagina', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Keyboard flow testen we op desktop')

  await page.goto('/')
  await expect(page.locator('[data-mounted="true"]')).toHaveCount(1)

  await page.keyboard.press('Control+K')

  const dialog = page.getByRole('dialog', { name: 'Zoeken' })
  await expect(dialog).toBeVisible()

  await dialog.getByPlaceholder('Typ om te zoeken...').fill('Agenda')
  await dialog.getByRole('option', { name: 'Agenda' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Agenda' })).toBeVisible()
  await expect(dialog).toBeHidden()
})

test('mobile menu opent, navigeert en sluit', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Alleen relevant op mobile viewport')

  await page.goto('/')
  await expect(page.locator('[data-mounted="true"]')).toHaveCount(1)

  await page.getByRole('button', { name: 'Menu openen' }).click()

  const sheet = page.locator('#mobile-sidebar')
  await expect(sheet).toBeVisible()

  await sheet.getByRole('button', { name: 'Deals' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Deals' })).toBeVisible()
  await expect(sheet).toBeHidden()
})

test('header knoppen voeren acties uit', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Alleen relevant op desktop viewport')

  await page.goto('/')
  await expect(page.locator('[data-mounted="true"]')).toHaveCount(1)

  await page.getByRole('button', { name: 'Upgrade' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Abonnement' })).toBeVisible()

  await page.goto('/')
  await expect(page.locator('[data-mounted="true"]')).toHaveCount(1)
  await page.getByRole('button', { name: 'Account' }).click()
  await page.getByRole('menuitem', { name: 'Instellingen' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Instellingen' })).toBeVisible()

  await page.goto('/')
  await expect(page.locator('[data-mounted="true"]')).toHaveCount(1)
  await page.getByRole('button', { name: 'Meldingen' }).click()
  await page.getByRole('menuitem', { name: /Openstaande offertes/i }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Offertes' })).toBeVisible()

  await page.goto('/')
  await expect(page.locator('[data-mounted="true"]')).toHaveCount(1)
  await page.getByRole('button', { name: 'Nieuwe actie' }).click()
  await page.getByRole('menuitem', { name: /Nieuwe afspraak/i }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Agenda' })).toBeVisible()
})
