export type InvoiceRequiredField = 'klant' | 'klantEmail' | 'omschrijving' | 'prijs'

export interface FactuurPrefillItem {
  id?: string
  omschrijving?: string
  aantal?: number
  prijs?: number
  btw?: number
}

export interface FactuurPrefillData {
  nummer?: string
  klant?: string
  klantEmail?: string
  datum?: string
  vervalDatum?: string
  items?: FactuurPrefillItem[]
  notities?: string
}

export type AiAssistantAction =
  | {
      type: 'invoice_missing_field'
      nextField: InvoiceRequiredField
      missingFields: InvoiceRequiredField[]
      prefillData?: FactuurPrefillData
    }
  | {
      type: 'open_factuur_modal'
      prefillData?: FactuurPrefillData
    }
  | {
      type: 'invoice_created'
      invoiceId: string
      invoiceNumber: string
    }

export function parseFactuurPrefillData(raw: string | null | undefined): FactuurPrefillData | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }
    return parsed as FactuurPrefillData
  } catch {
    return null
  }
}

export function buildFactuurCreateUrl(prefillData?: FactuurPrefillData | null) {
  const params = new URLSearchParams()
  params.set('create', '1')

  if (prefillData) {
    params.set('prefill', JSON.stringify(prefillData))
  }

  return `/facturen?${params.toString()}`
}
