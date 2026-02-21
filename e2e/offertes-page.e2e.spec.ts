import { expect, test } from '@playwright/test'

type MockOfferte = {
  id: string
  nummer: string
  klant: string
  bedrag: number
  datum: string | null
  geldigTot: string | null
  status: 'Openstaand' | 'Geaccepteerd' | 'Afgewezen'
  fotos: Array<{ path: string; url: string; name: string; size: number; mimeType: string; uploadedAt: string }>
  afmetingen: { lengte: number | null; breedte: number | null; hoogte: number | null; eenheid: 'mm' | 'cm' | 'm' } | null
  aiAnalyse: {
    summary: string
    scope: string[]
    recommendations: string[]
    riskFlags: string[]
    complexity: 'Laag' | 'Middel' | 'Hoog'
    confidence: number
    source: 'openai' | 'gemini' | 'fallback'
    generatedAt: string
    estimatedCost?: { min: number; max: number; currency: string }
    materials?: Array<{ name: string; quantity: number | string; unit: string }>
  } | null
  aiAnalyseStatus: 'Niet geanalyseerd' | 'Bezig' | 'Voltooid' | 'Fallback' | 'Mislukt'
  aiAnalyseFout: string | null
  aiAnalyseAt: string | null
  createdAt: string | null
}

function createMockOfferte(id: string, overrides: Partial<MockOfferte> = {}): MockOfferte {
  return {
    id,
    nummer: `OFF-2026-${id.padStart(3, '0')}`,
    klant: 'Demo Klant BV',
    bedrag: 3500,
    datum: '2026-02-16',
    geldigTot: '2026-03-01',
    status: 'Openstaand',
    fotos: [],
    afmetingen: null,
    aiAnalyse: null,
    aiAnalyseStatus: 'Niet geanalyseerd',
    aiAnalyseFout: null,
    aiAnalyseAt: null,
    createdAt: '2026-02-16T09:00:00.000Z',
    ...overrides,
  }
}

test('offertes pagina: acties en modal flow werken', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Alleen relevant op desktop viewport')

  let offertes: MockOfferte[] = [createMockOfferte('1')]
  let createdCounter = 2

  await page.route('**/api/offertes', async (route) => {
    const request = route.request()
    const method = request.method()

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(offertes),
      })
      return
    }

    if (method === 'POST') {
      const created = createMockOfferte(String(createdCounter++), {
        nummer: 'OFF-NEW-001',
        klant: 'Nieuwe Klant NV',
        bedrag: 1250,
      })
      offertes = [created, ...offertes]

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(created),
      })
      return
    }

    await route.fallback()
  })

  await page.route('**/api/offertes/*/analyze', async (route) => {
    const segments = route.request().url().split('/')
    const id = segments[segments.length - 2]

    const index = offertes.findIndex((item) => item.id === id)
    if (index === -1) {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) })
      return
    }

    const updated: MockOfferte = {
      ...offertes[index],
      aiAnalyseStatus: 'Voltooid',
      aiAnalyseAt: '2026-02-16T10:00:00.000Z',
      aiAnalyse: {
        summary: 'AI update voor offerte',
        scope: ['Woonkamer'],
        recommendations: ['Gebruik extra primer'],
        riskFlags: [],
        complexity: 'Middel',
        confidence: 0.81,
        source: 'gemini',
        generatedAt: '2026-02-16T10:00:00.000Z',
        estimatedCost: { min: 1100, max: 1400, currency: 'EUR' },
      },
    }

    offertes[index] = updated

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(updated),
    })
  })

  await page.route('**/api/offertes/*', async (route) => {
    const request = route.request()
    const method = request.method()
    const segments = request.url().split('/')
    const id = segments[segments.length - 1]

    const index = offertes.findIndex((item) => item.id === id)

    if (index === -1) {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) })
      return
    }

    if (method === 'PATCH') {
      const payload = request.postDataJSON() as { status?: MockOfferte['status'] }
      const updated = {
        ...offertes[index],
        status: payload.status ?? offertes[index].status,
      }
      offertes[index] = updated

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(updated),
      })
      return
    }

    if (method === 'DELETE') {
      offertes = offertes.filter((item) => item.id !== id)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
      return
    }

    await route.fallback()
  })

  page.on('dialog', async (dialog) => {
    await dialog.accept()
  })

  await page.goto('/?page=offertes')

  await expect(page.getByRole('heading', { level: 1, name: 'Offertes' })).toBeVisible()
  await expect(page.getByText('OFF-2026-001')).toBeVisible()

  await page.getByPlaceholder('Zoeken op nummer of klant...').fill('bestaat-niet')
  await expect(page.getByText('Geen offertes gevonden')).toBeVisible()

  await page.getByRole('button', { name: 'Filters wissen' }).first().click()
  await expect(page.getByText('Geen offertes gevonden')).toBeHidden()
  await expect(page.locator('button[title="AI-analyse opnieuw uitvoeren"]').first()).toBeVisible()

  await page.locator('button[title="AI-analyse opnieuw uitvoeren"]').first().click()
  await expect(page.getByRole('table').getByText('AI update voor offerte')).toBeVisible()

  await page.locator('button[title="Markeer als geaccepteerd"]').first().click()
  await expect(page.getByRole('table').getByText('Geaccepteerd').first()).toBeVisible()

  await page.locator('button[title="Verwijder offerte"]').first().click()
  await expect(page.getByText('Nog geen offertes')).toBeVisible()

  await page.getByRole('button', { name: 'Nieuwe Offerte' }).first().click()
  await expect(page.getByRole('dialog')).toContainText('Nieuwe Offerte')

  await page.getByLabel('Klant *').fill('Nieuwe Klant NV')
  await page.getByLabel('Bedrag (€) *').fill('1250')
  await page.getByRole('button', { name: 'Offerte opslaan' }).click()

  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page.getByText('OFF-NEW-001')).toBeVisible()
})
