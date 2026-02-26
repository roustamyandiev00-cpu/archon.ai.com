export type InvoiceRequiredField ='klant'|'klantEmail'|'omschrijving'|'prijs'
export type DashboardPageId =
 | 'dashboard'
 | 'bedrijven'
 | 'contacten'
 | 'deals'
 | 'offertes'
 | 'facturen'
 | 'projecten'
 | 'agenda'
 | 'artikelen'
 | 'documenten'
 | 'timesheets'
 | 'support'
 | 'abonnement'
 | 'instellingen'
 | 'ai-assistant'

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
 type:'invoice_missing_field'
 nextField: InvoiceRequiredField
 missingFields: InvoiceRequiredField[]
 prefillData?: FactuurPrefillData
 }
 | {
 type:'open_factuur_modal'
 prefillData?: FactuurPrefillData
 }
 | {
 type:'invoice_created'
 invoiceId: string
 invoiceNumber: string
 }
 | {
 type:'open_page'
 page: DashboardPageId
 reason?: string
 }

export interface AiAssistantFollowUpAction {
 id: string
 label: string
 action: AiAssistantAction
}

export function parseFactuurPrefillData(raw: string | null | undefined): FactuurPrefillData | null {
 if (!raw) return null

 try {
 const parsed = JSON.parse(raw)
 if (!parsed || typeof parsed !=='object'|| Array.isArray(parsed)) {
 return null
 }
 return parsed as FactuurPrefillData
 } catch {
 return null
 }
}

export function buildFactuurCreateUrl(prefillData?: FactuurPrefillData | null) {
 const params = new URLSearchParams()
 params.set('create','1')

 if (prefillData) {
 params.set('prefill', JSON.stringify(prefillData))
 }

 return `/facturen?${params.toString()}`
}

export function buildDashboardPageUrl(page: DashboardPageId) {
 if (page === 'dashboard') return '/dashboard'
 if (page === 'ai-assistant') return '/ai-assistant'
 return `/${page}`
}

function isInvoiceRequiredField(value: unknown): value is InvoiceRequiredField {
 return value ==='klant'|| value ==='klantEmail'|| value ==='omschrijving'|| value ==='prijs'
}

function isDashboardPageId(value: unknown): value is DashboardPageId {
 return (
 value ==='dashboard'||
 value ==='bedrijven'||
 value ==='contacten'||
 value ==='deals'||
 value ==='offertes'||
 value ==='facturen'||
 value ==='projecten'||
 value ==='agenda'||
 value ==='artikelen'||
 value ==='documenten'||
 value ==='timesheets'||
 value ==='support'||
 value ==='abonnement'||
 value ==='instellingen'||
 value ==='ai-assistant'
 )
}

export function parseAiAssistantAction(raw: unknown): AiAssistantAction | null {
 if (!raw || typeof raw !=='object'|| Array.isArray(raw)) return null
 const action = raw as Record<string, unknown>
 const type = typeof action.type ==='string'? action.type :''

 if (type ==='open_factuur_modal') {
 const prefillData =
 action.prefillData && typeof action.prefillData ==='object'&& !Array.isArray(action.prefillData)
 ? (action.prefillData as FactuurPrefillData)
 : undefined
 return {
 type:'open_factuur_modal',
 prefillData,
 }
 }

 if (type ==='open_page') {
 if (!isDashboardPageId(action.page)) return null
 return {
 type:'open_page',
 page: action.page,
 reason: typeof action.reason ==='string'? action.reason : undefined,
 }
 }

 if (type ==='invoice_created') {
 if (typeof action.invoiceId !=='string'|| typeof action.invoiceNumber !=='string') return null
 return {
 type:'invoice_created',
 invoiceId: action.invoiceId,
 invoiceNumber: action.invoiceNumber,
 }
 }

 if (type ==='invoice_missing_field') {
 if (!isInvoiceRequiredField(action.nextField)) return null
 const missingFields = Array.isArray(action.missingFields)
 ? action.missingFields.filter((field): field is InvoiceRequiredField => isInvoiceRequiredField(field))
 : []
 const prefillData =
 action.prefillData && typeof action.prefillData ==='object'&& !Array.isArray(action.prefillData)
 ? (action.prefillData as FactuurPrefillData)
 : undefined
 return {
 type:'invoice_missing_field',
 nextField: action.nextField,
 missingFields,
 prefillData,
 }
 }

 return null
}

export function parseAiAssistantFollowUpActions(raw: unknown): AiAssistantFollowUpAction[] {
 if (!Array.isArray(raw)) return []

 return raw
 .map((entry, index): AiAssistantFollowUpAction | null => {
 if (!entry || typeof entry !=='object'|| Array.isArray(entry)) return null
 const value = entry as Record<string, unknown>
 const label = typeof value.label ==='string'? value.label.trim() :''
 if (!label) return null

 const action = parseAiAssistantAction(value.action)
 if (!action) return null

 return {
 id: typeof value.id ==='string'&& value.id.trim() ? value.id.trim() : `follow-up-${index + 1}`,
 label,
 action,
 }
 })
 .filter((entry): entry is AiAssistantFollowUpAction => Boolean(entry))
}
