import { expect, test } from '@playwright/test'

test('sidebar buttons do not jump when switching pages', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Alleen relevant op desktop viewport')

  await page.goto('/')
  await expect(page.locator('[data-mounted="true"]')).toHaveCount(1)

  const sidebar = page.locator('#desktop-sidebar')
  await expect(sidebar).toBeVisible()

  const labels = ['Dashboard', 'Bedrijven', 'Contacten', 'Deals', 'Offertes', 'Projecten', 'Agenda'] as const

  const readBoxes = async () => {
    const boxes: Record<(typeof labels)[number], { x: number; y: number; width: number; height: number }> = {} as never
    for (const label of labels) {
      const btn = sidebar.getByRole('button', { name: label, exact: true })
      await expect(btn).toBeVisible()
      const box = await btn.boundingBox()
      expect(box, `Expected bounding box for "${label}"`).not.toBeNull()
      boxes[label] = { x: box!.x, y: box!.y, width: box!.width, height: box!.height }
    }
    return boxes
  }

  const assertStable = (
    before: Record<(typeof labels)[number], { x: number; y: number; width: number; height: number }>,
    after: Record<(typeof labels)[number], { x: number; y: number; width: number; height: number }>,
    context: string
  ) => {
    for (const label of labels) {
      const b = before[label]
      const a = after[label]

      expect(Math.abs(a.x - b.x), `${context}: "${label}" x shift`).toBeLessThanOrEqual(1)
      expect(Math.abs(a.y - b.y), `${context}: "${label}" y shift`).toBeLessThanOrEqual(1)
      expect(Math.abs(a.width - b.width), `${context}: "${label}" width shift`).toBeLessThanOrEqual(1)
      expect(Math.abs(a.height - b.height), `${context}: "${label}" height shift`).toBeLessThanOrEqual(1)
    }
  }

  const before = await readBoxes()

  await sidebar.getByRole('button', { name: 'Bedrijven', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Bedrijven' })).toBeVisible()
  const afterBedrijven = await readBoxes()
  assertStable(before, afterBedrijven, 'After navigating to Bedrijven')

  await sidebar.getByRole('button', { name: 'Deals', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Deals' })).toBeVisible()
  const afterDeals = await readBoxes()
  assertStable(afterBedrijven, afterDeals, 'After navigating to Deals')
})
