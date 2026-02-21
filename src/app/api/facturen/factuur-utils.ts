import { toIsoDate } from '@/app/api/finance/finance-utils'

export type UiFactuurStatus = 'Concept' | 'Verzonden' | 'Openstaand' | 'Achterstallig' | 'Betaald' | 'Gecrediteerd' | 'Geannuleerd'

export const uiFactuurStatusValues: UiFactuurStatus[] = [
  'Concept',
  'Verzonden',
  'Openstaand',
  'Achterstallig',
  'Betaald',
  'Gecrediteerd',
  'Geannuleerd',
]

export const factuurSelect =
  'id, nummer, klant, klant_email, bedrag, btw_bedrag, totaal_bedrag, datum, verval_datum, status, betaald_op, betaal_methode, items, timeline, herinneringen_verstuurd, pdf_url, notities, created_at'

export function normalizeFactuurRow(row: any) {
  return {
    id: String(row.id),
    nummer: String(row.nummer),
    klant: String(row.klant ?? ''),
    klantEmail: String(row.klant_email ?? ''),
    bedrag: Number(row.bedrag ?? 0),
    btwBedrag: Number(row.btw_bedrag ?? 0),
    totaalBedrag: Number(row.totaal_bedrag ?? 0),
    datum: row.datum ? String(row.datum).slice(0, 10) : null,
    vervalDatum: row.verval_datum ? String(row.verval_datum).slice(0, 10) : null,
    status: String(row.status ?? 'Concept') as UiFactuurStatus,
    betaaldOp: row.betaald_op ? String(row.betaald_op).slice(0, 10) : null,
    betaalMethode: row.betaal_methode ? String(row.betaal_methode) : null,
    items: Array.isArray(row.items) ? row.items : [],
    timeline: Array.isArray(row.timeline) ? row.timeline : [],
    herinneringenVerstuurd: Number(row.herinneringen_verstuurd ?? 0),
    pdfUrl: row.pdf_url ? String(row.pdf_url) : null,
    notities: row.notities ? String(row.notities) : '',
    createdAt: row.created_at ? String(row.created_at) : null,
  }
}

export function generateFactuurNummer() {
  const year = new Date().getFullYear()
  const random = Math.floor(100 + Math.random() * 900)
  return `F-${year}-${random}`
}

export function computeTotals(items: Array<{ aantal: number; prijs: number; btw: number }>) {
  const bedrag = items.reduce((sum, it) => sum + (Number(it.aantal) || 0) * (Number(it.prijs) || 0), 0)
  const btwBedrag = items.reduce((sum, it) => {
    const line = (Number(it.aantal) || 0) * (Number(it.prijs) || 0)
    return sum + line * ((Number(it.btw) || 0) / 100)
  }, 0)
  const totaalBedrag = bedrag + btwBedrag
  return { bedrag, btwBedrag, totaalBedrag }
}

export function toDates({ datum, vervalDatum }: { datum?: string; vervalDatum?: string }) {
  const today = new Date()
  const defaultDue = new Date(today)
  defaultDue.setDate(defaultDue.getDate() + 14)
  return {
    datum: toIsoDate(datum ?? null, today),
    verval_datum: toIsoDate(vervalDatum ?? null, defaultDue),
  }
}

