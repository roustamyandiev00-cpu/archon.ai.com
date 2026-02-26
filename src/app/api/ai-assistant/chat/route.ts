import { NextRequest, NextResponse } from'next/server'

import { getSupabaseAdmin } from'@/lib/supabaseAdmin'
import { getUserFromRequest } from'@/lib/admin'
import {
 computeTotals,
 factuurSelect,
 generateFactuurNummer,
 normalizeFactuurRow,
 toDates,
} from'@/app/api/facturen/factuur-utils'
import type {
 AiAssistantAction,
 AiAssistantFollowUpAction,
 DashboardPageId,
 FactuurPrefillData,
 InvoiceRequiredField,
} from'@/lib/ai-assistant-actions'

const geminiApiKey = process.env.GEMINI_API_KEY
const geminiModel = process.env.GEMINI_CHAT_MODEL?.trim() || 'gemini-2.5-pro'

const invoiceKeywordRegex = /\b(factuur|invoice|rekening)\b/i
const invoiceCreateRegex = /\b(maak|cre[eë]er|genereer|stel\s+op|opstellen|aanmaken?)\b/i
const invoiceFlowHintRegex = /(voor deze factuur mis ik nog|antwoord met|conceptfactuur)/i
const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const isoDateRegex = /\b(20\d{2}-\d{2}-\d{2})\b/g
const navigationIntentRegex = /\b(open|openen|ga\s+naar|navigeer|toon|breng\s+me|switch|wissel)\b/i
const overviewIntentRegex = /\b(overzicht|samenvatting|statusupdate|stand van zaken|hoe sta ik ervoor)\b/i
const priorityIntentRegex = /\b(prioriteit|prioriteiten|focus|nu doen|wat moet ik|vandaag doen|actiepunten|todo|to-do)\b/i
const riskIntentRegex = /\b(risico|risico's|achterstand|urgent|openstaand|te laat|verval(len|datum)|overdue)\b/i

type ModelChoice ='gemini'|'llama'

interface Deal {
 name: string
 status: string
 value: number
}

interface Factuur {
 nummer: string
 status: string
 totaal_bedrag: number
 klant: string
 verval_datum?: string | null
}

interface ProjectContext {
 name: string
 status: string
 deadline: string | null
}

interface AppointmentContext {
 titel: string
 startTijd: string | null
}

interface ChatHistoryEntry {
 role: string
 content: string
}

interface InvoiceDraft {
 klant?: string
 klantEmail?: string
 omschrijving?: string
 prijs?: number
 aantal?: number
 btw?: number
 datum?: string
 vervalDatum?: string
 notities?: string
}

interface AssistantClientContext {
 pagePath: string | null
 locale: string
 timezone: string
}

function parsePositiveNumber(input: string) {
 const normalized = input.replace(/\s/g,'').replace(',','.')
 const value = Number(normalized)
 if (!Number.isFinite(value) || value <= 0) return null
 return value
}

function parseNonNegativeNumber(input: string) {
 const normalized = input.replace(/\s/g,'').replace(',','.')
 const value = Number(normalized)
 if (!Number.isFinite(value) || value < 0) return null
 return value
}

function isValidEmail(value?: string) {
 if (!value) return false
 return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function trimValue(value?: string | null) {
 return value?.trim() ||''
}

function toCurrency(value: number) {
 return new Intl.NumberFormat('nl-NL', { style:'currency', currency:'EUR' }).format(value || 0)
}

function normalizeStatus(value?: string | null) {
 return trimValue(value).toLowerCase()
}

function isPaidInvoiceStatus(status: string) {
 const normalized = normalizeStatus(status)
 return normalized ==='betaald'|| normalized ==='paid'
}

function isClosedDealStatus(status: string) {
 const normalized = normalizeStatus(status)
 return ['gewonnen','won','closed won','verloren','lost','afgerond','closed'].includes(normalized)
}

function isCompletedProjectStatus(status: string) {
 const normalized = normalizeStatus(status)
 return ['afgerond','completed','done','gesloten','closed'].includes(normalized)
}

function parseAssistantContext(raw: unknown): AssistantClientContext {
 if (!raw || typeof raw !=='object'|| Array.isArray(raw)) {
 return {
 pagePath: null,
 locale:'nl-NL',
 timezone:'Europe/Amsterdam',
 }
 }

 const context = raw as { pagePath?: unknown; locale?: unknown; timezone?: unknown }
 return {
 pagePath: typeof context.pagePath ==='string'&& context.pagePath.trim() ? context.pagePath.trim() : null,
 locale: typeof context.locale ==='string'&& context.locale.trim() ? context.locale.trim() :'nl-NL',
 timezone: typeof context.timezone ==='string'&& context.timezone.trim() ? context.timezone.trim() :'Europe/Amsterdam',
 }
}

function describePagePath(path: string | null) {
 if (!path) return'onbekend'

 if (path.includes('/facturen')) return'Facturen'
 if (path.includes('/projecten')) return'Projecten'
 if (path.includes('/documenten')) return'Documenten'
 if (path.includes('/agenda')) return'Agenda'
 if (path.includes('/deals')) return'Deals'
 if (path.includes('/contacten')) return'Contacten'
 if (path.includes('/bedrijven')) return'Bedrijven'
 if (path.includes('/artikelen')) return'Artikelen'
 if (path.includes('/timesheets')) return'Timesheets'
 if (path.includes('/offertes')) return'Offertes'
 if (path.includes('/abonnement')) return'Abonnement'
 if (path.includes('/instellingen')) return'Instellingen'
 if (path.includes('/ai-assistant')) return'AI Assistant'
 if (path.includes('/dashboard')) return'Dashboard'
 return path
}

function extractSettledCount(result: PromiseSettledResult<any>, label: string) {
 if (result.status !=='fulfilled') {
 console.warn(`[ai-assistant] Query ${label} faalde`, result.reason)
 return 0
 }
 if (result.value?.error) {
 console.warn(`[ai-assistant] Query ${label} gaf fout`, result.value.error)
 return 0
 }
 return Number(result.value?.count ?? 0)
}

function extractSettledRows<T>(result: PromiseSettledResult<any>, label: string): T[] {
 if (result.status !=='fulfilled') {
 console.warn(`[ai-assistant] Query ${label} faalde`, result.reason)
 return []
 }
 if (result.value?.error) {
 console.warn(`[ai-assistant] Query ${label} gaf fout`, result.value.error)
 return []
 }
 return Array.isArray(result.value?.data) ? (result.value.data as T[]) : []
}

function normalizeDealForContext(row: any): Deal | null {
 const name = trimValue(row?.titel ?? row?.title ?? row?.name)
 const status = trimValue(row?.stadium ?? row?.stage ?? row?.status) ||'Onbekend'
 const value = Number(row?.waarde ?? row?.amount ?? row?.value ?? 0)

 if (!name) return null
 return {
 name,
 status,
 value: Number.isFinite(value) ? value : 0,
 }
}

function normalizeProjectForContext(row: any): ProjectContext | null {
 const name = trimValue(row?.naam ?? row?.name)
 const status = trimValue(row?.status) ||'Onbekend'
 const deadlineRaw = row?.deadline

 if (!name) return null
 return {
 name,
 status,
 deadline: typeof deadlineRaw ==='string'&& deadlineRaw.trim() ? deadlineRaw.slice(0, 10) : null,
 }
}

function normalizeAppointmentForContext(row: any): AppointmentContext | null {
 const titel = trimValue(row?.titel)
 if (!titel) return null
 const startTijd = typeof row?.start_tijd ==='string'? row.start_tijd : null
 return { titel, startTijd }
}

function detectRequestedPage(message: string): DashboardPageId | null {
 const input = message.toLowerCase()
 const compactInput = input.trim()
 const looksLikePageCommand = navigationIntentRegex.test(input) || compactInput.split(/\s+/).length <= 3
 if (!looksLikePageCommand) return null

 const pagePatterns: Array<{ page: DashboardPageId; pattern: RegExp }> = [
 { page:'dashboard', pattern:/\b(dashboard|home|start)\b/i },
 { page:'bedrijven', pattern:/\b(bedrijf|bedrijven|company|companies)\b/i },
 { page:'contacten', pattern:/\b(contact|contacten|contactpersoon)\b/i },
 { page:'deals', pattern:/\b(deal|deals|pipeline)\b/i },
 { page:'offertes', pattern:/\b(offerte|offertes|quote|quotes)\b/i },
 { page:'facturen', pattern:/\b(factuur|facturen|invoice|invoices)\b/i },
 { page:'projecten', pattern:/\b(project|projecten)\b/i },
 { page:'agenda', pattern:/\b(agenda|afspraak|afspraken|kalender)\b/i },
 { page:'artikelen', pattern:/\b(artikel|artikelen|producten|diensten)\b/i },
 { page:'documenten', pattern:/\b(document|documenten|bestanden|files|docs)\b/i },
 { page:'timesheets', pattern:/\b(timesheet|timesheets|uren|urenregistratie)\b/i },
 { page:'support', pattern:/\b(support|help|hulp)\b/i },
 { page:'abonnement', pattern:/\b(abonnement|subscription|billing|plan)\b/i },
 { page:'instellingen', pattern:/\b(instelling|instellingen|settings)\b/i },
 { page:'ai-assistant', pattern:/\b(ai assistant|assistant|ai)\b/i },
 ]

 for (const entry of pagePatterns) {
 if (entry.pattern.test(input)) return entry.page
 }

 return null
}

function buildFollowUpActions(params: {
 deals: Deal[]
 facturen: Factuur[]
 projects: ProjectContext[]
 afspraken: AppointmentContext[]
}): AiAssistantFollowUpAction[] {
 const openDeals = params.deals.filter((deal) => !isClosedDealStatus(deal.status))
 const unpaidInvoices = params.facturen.filter((invoice) => !isPaidInvoiceStatus(invoice.status))

 const todayIso = new Date().toISOString().slice(0, 10)
 const overdueInvoices = unpaidInvoices.filter((invoice) => {
 const due = trimValue(invoice.verval_datum)
 return Boolean(due && due < todayIso)
 })

 const activeProjects = params.projects.filter((project) => !isCompletedProjectStatus(project.status))
 const projectsWithDeadline = activeProjects.filter((project) => Boolean(project.deadline))
 const soonDeadlineProjects = projectsWithDeadline.filter((project) => {
 const deadline = project.deadline
 if (!deadline) return false
 const diffMs = new Date(deadline).getTime() - Date.now()
 const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
 return diffDays >= 0 && diffDays <= 14
 })

 const todayAppointments = params.afspraken.filter((afspraak) => {
 if (!afspraak.startTijd) return false
 return afspraak.startTijd.slice(0, 10) === todayIso
 })

 const followUps: AiAssistantFollowUpAction[] = []

 if (overdueInvoices.length > 0) {
 followUps.push({
 id:'follow-up-overdue-invoices',
 label:`Bekijk ${overdueInvoices.length} vervallen facturen`,
 action: {
 type:'open_page',
 page:'facturen',
 reason:'vervallen_facturen',
 },
 })
 } else if (unpaidInvoices.length > 0) {
 followUps.push({
 id:'follow-up-unpaid-invoices',
 label:`Open facturen (${unpaidInvoices.length})`,
 action: {
 type:'open_page',
 page:'facturen',
 reason:'openstaande_facturen',
 },
 })
 }

 if (soonDeadlineProjects.length > 0) {
 followUps.push({
 id:'follow-up-project-deadlines',
 label:`Open projecten met deadlines (${soonDeadlineProjects.length})`,
 action: {
 type:'open_page',
 page:'projecten',
 reason:'naderende_project_deadlines',
 },
 })
 }

 if (todayAppointments.length > 0) {
 followUps.push({
 id:'follow-up-agenda-today',
 label:`Bekijk agenda van vandaag (${todayAppointments.length})`,
 action: {
 type:'open_page',
 page:'agenda',
 reason:'afspraken_vandaag',
 },
 })
 }

 if (openDeals.length > 0) {
 followUps.push({
 id:'follow-up-open-deals',
 label:`Open deals pipeline (${openDeals.length})`,
 action: {
 type:'open_page',
 page:'deals',
 reason:'pipeline_opvolging',
 },
 })
 }

 if (followUps.length === 0) {
 followUps.push({
 id:'follow-up-open-dashboard',
 label:'Open dashboard-overzicht',
 action: {
 type:'open_page',
 page:'dashboard',
 reason:'algemeen_overzicht',
 },
 })
 }

 return followUps.slice(0, 3)
}

function maybeBuildInsightReply(params: {
 message: string
 deals: Deal[]
 facturen: Factuur[]
 projects: ProjectContext[]
 afspraken: AppointmentContext[]
}): { reply: string; followUpActions: AiAssistantFollowUpAction[] } | null {
 const input = params.message.toLowerCase()
 const wantsOverview = overviewIntentRegex.test(input)
 const wantsPriorities = priorityIntentRegex.test(input)
 const wantsRisks = riskIntentRegex.test(input)

 if (!wantsOverview && !wantsPriorities && !wantsRisks) return null

 const followUpActions = buildFollowUpActions(params)

 const openDeals = params.deals.filter((deal) => !isClosedDealStatus(deal.status))
 const openDealsValue = openDeals.reduce((sum, deal) => sum + (deal.value || 0), 0)

 const unpaidInvoices = params.facturen.filter((invoice) => !isPaidInvoiceStatus(invoice.status))
 const unpaidTotal = unpaidInvoices.reduce((sum, invoice) => sum + (Number(invoice.totaal_bedrag) || 0), 0)

 const todayIso = new Date().toISOString().slice(0, 10)
 const overdueInvoices = unpaidInvoices.filter((invoice) => {
 const due = trimValue(invoice.verval_datum)
 return Boolean(due && due < todayIso)
 })

 const activeProjects = params.projects.filter((project) => !isCompletedProjectStatus(project.status))
 const projectsWithDeadline = activeProjects.filter((project) => Boolean(project.deadline))
 const soonDeadlineProjects = projectsWithDeadline.filter((project) => {
 const deadline = project.deadline
 if (!deadline) return false
 const diffMs = new Date(deadline).getTime() - Date.now()
 const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
 return diffDays >= 0 && diffDays <= 14
 })

 const todayAppointments = params.afspraken.filter((afspraak) => {
 if (!afspraak.startTijd) return false
 return afspraak.startTijd.slice(0, 10) === todayIso
 })

 if (wantsPriorities) {
 const lines: string[] = []
 if (overdueInvoices.length > 0) {
 lines.push(`1. Verstuur herinneringen voor ${overdueInvoices.length} vervallen factu(u)r(en) (${toCurrency(overdueInvoices.reduce((sum, item) => sum + (Number(item.totaal_bedrag) || 0), 0))}).`)
 }
 if (soonDeadlineProjects.length > 0) {
 lines.push(`2. Plan opvolging voor ${soonDeadlineProjects.length} project(en) met deadline binnen 14 dagen.`)
 }
 if (openDeals.length > 0) {
 lines.push(`3. Focus op je grootste open deals (totaal ${toCurrency(openDealsValue)}).`)
 }
 if (todayAppointments.length > 0) {
 lines.push(`4. Je hebt ${todayAppointments.length} afspraak/afspraken vandaag; reserveer opvolgtijd.`)
 }

 if (lines.length === 0) {
 return {
 reply:'Je hebt momenteel geen urgente signalen in deals, facturen of projecten. Beste volgende stap: werk je pipeline preventief bij en plan 1 acquisitie-actie voor vandaag.',
 followUpActions,
 }
 }

 return {
 reply: `Dit zijn je prioriteiten voor nu:\n${lines.join('\n')}`,
 followUpActions,
 }
 }

 if (wantsRisks) {
 return {
 reply: [
 `Risico-overzicht:`,
 `- Openstaande facturen: ${unpaidInvoices.length} (${toCurrency(unpaidTotal)}), waarvan ${overdueInvoices.length} vervallen.`,
 `- Actieve projecten: ${activeProjects.length}, met ${soonDeadlineProjects.length} deadline(s) binnen 14 dagen.`,
 `- Open deals: ${openDeals.length} (${toCurrency(openDealsValue)} potentieel).`,
 ].join('\n'),
 followUpActions,
 }
 }

 return {
 reply: [
 `Korte stand van zaken:`,
 `- Open deals: ${openDeals.length} (${toCurrency(openDealsValue)}).`,
 `- Openstaande facturen: ${unpaidInvoices.length} (${toCurrency(unpaidTotal)}).`,
 `- Actieve projecten: ${activeProjects.length}.`,
 `- Afspraken vandaag: ${todayAppointments.length}.`,
 ].join('\n'),
 followUpActions,
 }
}

function latestAssistantQuestionField(history: ChatHistoryEntry[]): InvoiceRequiredField | null {
 for (let i = history.length - 1; i >= 0; i -= 1) {
 const message = history[i]
 const role = (message.role ||'').toLowerCase()
 if (role ==='user') continue

 const content = (message.content ||'').toLowerCase()
 if (!content) continue

 if (content.includes('e-mailadres') || content.includes('emailadres') || content.includes('e-mail')) {
 return'klantEmail'
 }
 if (content.includes('klantnaam') || content.includes('naam van de klant') || content.includes('welke klant')) {
 return'klant'
 }
 if (content.includes('omschrijving') || content.includes('welke dienst') || content.includes('factuurregel')) {
 return'omschrijving'
 }
 if (content.includes('bedrag') || content.includes('prijs')) {
 return'prijs'
 }
 }

 return null
}

function extractDraftFromMessages(userMessages: string[], pendingField: InvoiceRequiredField | null): InvoiceDraft {
 const draft: InvoiceDraft = {}

 for (const text of userMessages) {
 const content = text.trim()
 if (!content) continue

 const lower = content.toLowerCase()

 const emails = content.match(emailRegex)
 if (emails?.length) {
 draft.klantEmail = emails[emails.length - 1].trim().toLowerCase()
 }

 const klantExplicit =
 content.match(/\bklant(?:naam)?\s*[:=-]\s*([^,\n.;]{2,100})/i)?.[1] ||
 content.match(/\bfactuur\s+voor\s+([^,\n.;]{2,100}?)(?=\s+(?:voor|met|van|e-?mail|email|omschrijving|beschrijving|bedrag|€|op|tegen)\b|$)/i)?.[1]

 if (klantExplicit) {
 draft.klant = trimValue(klantExplicit)
 }

 const omschrijvingExplicit =
 content.match(/\b(?:omschrijving|beschrijving|dienst|werk(?:zaamheden)?)\s*[:=-]\s*([^\n]{3,220})/i)?.[1] ||
 content.match(/\bfactuur\s+voor\s+.+?\s+voor\s+(.+?)\s+(?:van\s+)?(?:€\s*)?\d+(?:[.,]\d{1,2})?\s*(?:euro|eur)?\b/i)?.[1]

 if (omschrijvingExplicit) {
 draft.omschrijving = trimValue(omschrijvingExplicit)
 }

 const bedragExplicit =
 content.match(/€\s*([0-9]+(?:[.,][0-9]{1,2})?)/i)?.[1] ||
 content.match(/\b([0-9]+(?:[.,][0-9]{1,2})?)\s*(?:euro|eur)\b/i)?.[1] ||
 content.match(/\bbedrag\s*[:=-]\s*([0-9]+(?:[.,][0-9]{1,2})?)/i)?.[1]

 if (bedragExplicit) {
 const parsed = parsePositiveNumber(bedragExplicit)
 if (parsed != null) draft.prijs = parsed
 }

 const aantalExplicit =
 content.match(/\baantal\s*[:=-]\s*([0-9]+(?:[.,][0-9]{1,2})?)/i)?.[1] ||
 content.match(/\b([0-9]+(?:[.,][0-9]{1,2})?)\s*(?:uur|uren|stuks|dagen|dag|maanden|maand)\b/i)?.[1]

 if (aantalExplicit) {
 const parsed = parsePositiveNumber(aantalExplicit)
 if (parsed != null) draft.aantal = parsed
 }

 const btwExplicit = content.match(/\bbtw\s*[:=-]\s*([0-9]+(?:[.,][0-9]{1,2})?)/i)?.[1]
 if (btwExplicit) {
 const parsed = parseNonNegativeNumber(btwExplicit)
 if (parsed != null) draft.btw = parsed
 }

 const notitiesExplicit = content.match(/\b(?:notitie|notities|opmerking(?:en)?)\s*[:=-]\s*(.+)$/i)?.[1]
 if (notitiesExplicit) {
 draft.notities = trimValue(notitiesExplicit)
 }

 const dateMatches = [...content.matchAll(isoDateRegex)].map((m) => m[1])
 if (dateMatches.length > 0) {
 for (const date of dateMatches) {
 const dateIndex = lower.indexOf(date)
 const context = dateIndex >= 0 ? lower.slice(Math.max(0, dateIndex - 20), dateIndex + 20) : lower
 if (context.includes('verval')) draft.vervalDatum = date
 else if (context.includes('datum')) draft.datum = date
 }
 }
 }

 const latestUserMessage = userMessages[userMessages.length - 1]?.trim() ||''
 if (pendingField && latestUserMessage) {
 if (pendingField ==='klant'&& !draft.klant) {
 draft.klant = latestUserMessage
 }

 if (pendingField ==='klantEmail'&& !draft.klantEmail) {
 const email = latestUserMessage.match(emailRegex)?.[0]
 if (email) draft.klantEmail = email.toLowerCase()
 }

 if (pendingField ==='omschrijving'&& !draft.omschrijving) {
 draft.omschrijving = latestUserMessage
 }

 if (pendingField ==='prijs'&& draft.prijs == null) {
 const parsed =
 latestUserMessage.match(/€\s*([0-9]+(?:[.,][0-9]{1,2})?)/i)?.[1] ||
 latestUserMessage.match(/\b([0-9]+(?:[.,][0-9]{1,2})?)\s*(?:euro|eur)?\b/i)?.[1]

 if (parsed) {
 const value = parsePositiveNumber(parsed)
 if (value != null) draft.prijs = value
 }
 }
 }

 return draft
}

function getMissingFields(draft: InvoiceDraft): InvoiceRequiredField[] {
 const missing: InvoiceRequiredField[] = []

 if (!trimValue(draft.klant)) missing.push('klant')
 if (!isValidEmail(draft.klantEmail)) missing.push('klantEmail')
 if (!trimValue(draft.omschrijving)) missing.push('omschrijving')
 if (draft.prijs == null || !Number.isFinite(draft.prijs) || draft.prijs <= 0) missing.push('prijs')

 return missing
}

function getQuestionForField(field: InvoiceRequiredField) {
 switch (field) {
 case'klant':
 return'Wat is de naam van de klant of het bedrijf?'
 case'klantEmail':
 return'Wat is het e-mailadres van de klant?'
 case'omschrijving':
 return'Welke dienst of omschrijving moet op de factuurregel staan?'
 case'prijs':
 return'Wat is het bedrag exclusief btw (bijv. 250)?'
 default:
 return'Welke informatie ontbreekt nog?'
 }
}

function buildPrefillData(draft: InvoiceDraft): FactuurPrefillData {
 const items = draft.omschrijving || draft.prijs != null
 ? [
 {
 omschrijving: draft.omschrijving ||'',
 aantal: draft.aantal ?? 1,
 prijs: draft.prijs ?? 0,
 btw: draft.btw ?? 21,
 },
 ]
 : undefined

 return {
 klant: trimValue(draft.klant) || undefined,
 klantEmail: trimValue(draft.klantEmail) || undefined,
 datum: draft.datum,
 vervalDatum: draft.vervalDatum,
 items,
 notities: trimValue(draft.notities) || undefined,
 }
}

function describeKnownFields(draft: InvoiceDraft) {
 const parts: string[] = []

 if (trimValue(draft.klant)) parts.push(`klant: ${trimValue(draft.klant)}`)
 if (isValidEmail(draft.klantEmail)) parts.push(`e-mail: ${trimValue(draft.klantEmail)}`)
 if (trimValue(draft.omschrijving)) parts.push(`omschrijving: ${trimValue(draft.omschrijving)}`)
 if (draft.prijs != null && Number.isFinite(draft.prijs) && draft.prijs > 0) {
 parts.push(`bedrag ex. btw: €${draft.prijs.toFixed(2)}`)
 }

 if (parts.length === 0) return''
 return `Ik heb al: ${parts.join('·')}. `
}

function shouldHandleInvoiceFlow(message: string, history: ChatHistoryEntry[]) {
 const latestMessage = message.toLowerCase()
 const userHistory = history
 .filter((entry) => (entry.role ||'').toLowerCase() ==='user')
 .map((entry) => entry.content.toLowerCase())
 .join('')

 const assistantHistory = history
 .filter((entry) => (entry.role ||'').toLowerCase() !=='user')
 .map((entry) => entry.content.toLowerCase())
 .join('')

 if (invoiceKeywordRegex.test(latestMessage) && invoiceCreateRegex.test(latestMessage)) return true
 if (invoiceKeywordRegex.test(latestMessage) && assistantHistory.includes('factuur')) return true
 if (invoiceFlowHintRegex.test(assistantHistory)) return true
 if (invoiceKeywordRegex.test(userHistory) && invoiceCreateRegex.test(userHistory)) return true
 return false
}

function wantsOpenModal(message: string) {
 return /\b(open|openen|toon)\b.*\b(modal|formulier|facturenpagina|factuurpagina)\b/i.test(message)
}

async function handleInvoiceFlow(params: {
 message: string
 history: ChatHistoryEntry[]
 supabase: ReturnType<typeof getSupabaseAdmin>
 userId: string
}): Promise<{ reply: string; action?: AiAssistantAction } | null> {
 const { message, history, supabase, userId } = params

 if (!shouldHandleInvoiceFlow(message, history)) {
 return null
 }

 const userMessages = [
 ...history
 .filter((entry) => (entry.role ||'').toLowerCase() ==='user')
 .map((entry) => entry.content),
 message,
 ]

 const pendingField = latestAssistantQuestionField(history)
 const draft = extractDraftFromMessages(userMessages, pendingField)
 const missingFields = getMissingFields(draft)
 const prefillData = buildPrefillData(draft)

 if (missingFields.length > 0) {
 if (wantsOpenModal(message)) {
 return {
 reply:'Ik open de factuurmodal met wat ik al weet. Vul de resterende velden daar aan.',
 action: {
 type:'open_factuur_modal',
 prefillData,
 },
 }
 }

 const nextField = missingFields[0]
 return {
 reply: `${describeKnownFields(draft)}Voor deze factuur mis ik nog 1 gegeven. ${getQuestionForField(nextField)} Antwoord met alleen dat gegeven.`,
 action: {
 type:'invoice_missing_field',
 nextField,
 missingFields,
 prefillData,
 },
 }
 }

 const item = {
 id: `ai-${Date.now()}`,
 omschrijving: trimValue(draft.omschrijving),
 aantal: draft.aantal && draft.aantal > 0 ? draft.aantal : 1,
 prijs: Number(draft.prijs),
 btw: draft.btw != null && draft.btw >= 0 ? draft.btw : 21,
 }

 const totals = computeTotals([item])
 const dates = toDates({ datum: draft.datum, vervalDatum: draft.vervalDatum })
 const nummer = generateFactuurNummer()
 const now = new Date().toISOString()

 const insertPayload = {
 user_id: userId,
 nummer,
 klant: trimValue(draft.klant),
 klant_email: trimValue(draft.klantEmail).toLowerCase(),
 bedrag: totals.bedrag,
 btw_bedrag: totals.btwBedrag,
 totaal_bedrag: totals.totaalBedrag,
 datum: dates.datum,
 verval_datum: dates.verval_datum,
 status:'Concept',
 betaald_op: null,
 betaal_methode: null,
 items: [item],
 timeline: [
 {
 id: String(Date.now()),
 type:'created',
 date: now,
 description:'Factuur aangemaakt via AI assistent',
 user:'AI',
 },
 ],
 herinneringen_verstuurd: 0,
 pdf_url: null,
 notities: trimValue(draft.notities) || null,
 }

 const insertResult = await (supabase as any)
 .from('facturen')
 .insert([insertPayload])
 .select(factuurSelect)
 .single()

 if (insertResult.error) {
 return {
 reply: `Ik kon de conceptfactuur nog niet opslaan: ${insertResult.error.message ||'onbekende fout'}. Probeer het opnieuw.`,
 }
 }

 const created = normalizeFactuurRow(insertResult.data)

 return {
 reply: `Klaar. Ik heb conceptfactuur ${created.nummer} aangemaakt voor ${created.klant} met totaal ${new Intl.NumberFormat('nl-NL', { style:'currency', currency:'EUR'}).format(created.totaalBedrag)}.`,
 action: {
 type:'invoice_created',
 invoiceId: String(created.id),
 invoiceNumber: created.nummer,
 },
 }
}

async function callGemini(params: {
 systemPrompt: string
 history: ChatHistoryEntry[]
 message: string
}) {
 if (!geminiApiKey) {
 return'Gemini is niet geconfigureerd. Voeg GEMINI_API_KEY toe om AI antwoorden te genereren.'
 }

 const { systemPrompt, history, message } = params
 const contents = [
 ...history.map((entry) => ({
 role: ['ai','assistant','model'].includes((entry.role ||'').toLowerCase()) ?'model':'user',
 parts: [{ text: entry.content }],
 })),
 { role:'user', parts: [{ text: message }] },
 ]

 const geminiResponse = await fetch(
 `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
 {
 method:'POST',
 headers: {'Content-Type':'application/json'},
 body: JSON.stringify({
 systemInstruction: {
 role:'system',
 parts: [{ text: systemPrompt }],
 },
 contents,
 generationConfig: {
 temperature: 0.35,
 topP: 0.9,
 maxOutputTokens: 900,
 },
 }),
 }
 )

 if (!geminiResponse.ok) {
 const errorBody = await geminiResponse.text().catch(() =>'')
 return `Ik kan nu geen AI-antwoord ophalen (status ${geminiResponse.status}). ${errorBody ? 'Probeer het over enkele seconden opnieuw.' :'Controleer je AI-configuratie.'}`
 }

 const geminiData = await geminiResponse.json().catch(() => null)
 const aiResponse = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text
 return typeof aiResponse ==='string'&& aiResponse.trim().length > 0
 ? aiResponse
 :'Ik kon helaas geen antwoord genereren. Probeer het opnieuw.'
}

export async function POST(request: NextRequest) {
 try {
 const user = await getUserFromRequest(request)
 if (!user) {
 return NextResponse.json({ error:'Niet ingelogd'}, { status: 401 })
 }

 const body = await request.json().catch(() => null)
 const message = typeof body?.message ==='string'? body.message.trim() :''
 const model: ModelChoice = body?.model ==='llama'?'llama':'gemini'
 const context = parseAssistantContext(body?.context)
 const history: ChatHistoryEntry[] = Array.isArray(body?.history)
 ? body.history
 .filter((entry: unknown) => {
 if (!entry || typeof entry !=='object') return false
 const maybe = entry as { role?: unknown; content?: unknown }
 return typeof maybe.content ==='string'&& maybe.content.trim().length > 0
 })
 .map((entry: { role?: unknown; content?: unknown }) => ({
 role: typeof entry.role ==='string'? entry.role :'user',
 content: String(entry.content),
 }))
 : []

 if (!message) {
 return NextResponse.json({ error:'Bericht is vereist'}, { status: 400 })
 }

 const supabase = getSupabaseAdmin()

 const requestedPage = detectRequestedPage(message)
 const pageLabels: Record<DashboardPageId, string> = {
 dashboard:'Dashboard',
 bedrijven:'Bedrijven',
 contacten:'Contacten',
 deals:'Deals',
 offertes:'Offertes',
 facturen:'Facturen',
 projecten:'Projecten',
 agenda:'Agenda',
 artikelen:'Artikelen',
 documenten:'Documenten',
 timesheets:'Timesheets',
 support:'Support',
 abonnement:'Abonnement',
 instellingen:'Instellingen',
 'ai-assistant':'AI Assistant',
 }

 const invoiceFlowResult = await handleInvoiceFlow({
 message,
 history,
 supabase,
 userId: user.id,
 })

 if (invoiceFlowResult) {
 return NextResponse.json({
 success: true,
 reply: invoiceFlowResult.reply,
 action: invoiceFlowResult.action,
 })
 }

 if (requestedPage) {
 return NextResponse.json({
 success: true,
 reply: `Ik open ${pageLabels[requestedPage]} voor je.`,
 action: {
 type:'open_page',
 page: requestedPage,
 reason:'navigatieverzoek',
 },
 })
 }

 const [
 companyResult,
 contactResult,
 dealsResult,
 facturenResult,
 projectsResult,
 afsprakenResult,
 ] = await Promise.allSettled([
 (supabase.from('bedrijven') as any).select('*', { count:'exact', head: true }).eq('user_id', user.id),
 (supabase.from('contacten') as any).select('*', { count:'exact', head: true }).eq('user_id', user.id),
 (supabase.from('deals') as any).select('*').eq('user_id', user.id).limit(25),
 (supabase.from('facturen') as any).select('nummer, status, totaal_bedrag, klant, verval_datum').eq('user_id', user.id).limit(25),
 (supabase.from('projecten') as any).select('*').eq('user_id', user.id).limit(20),
 (supabase.from('afspraken') as any)
 .select('titel, start_tijd')
 .eq('user_id', user.id)
 .gte('start_tijd', new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString())
 .order('start_tijd', { ascending: true })
 .limit(20),
 ])

 const companyCount = extractSettledCount(companyResult,'bedrijven')
 const contactCount = extractSettledCount(contactResult,'contacten')

 const deals = extractSettledRows<any>(dealsResult,'deals')
 .map((row) => normalizeDealForContext(row))
 .filter((row): row is Deal => Boolean(row))

 const facturen = extractSettledRows<any>(facturenResult,'facturen')
 .map((row): Factuur => ({
 nummer: trimValue(row?.nummer) ||'Onbekend',
 status: trimValue(row?.status) ||'Onbekend',
 totaal_bedrag: Number(row?.totaal_bedrag ?? 0),
 klant: trimValue(row?.klant) ||'Onbekend',
 verval_datum: typeof row?.verval_datum ==='string'? row.verval_datum.slice(0, 10) : null,
 }))

 const projects = extractSettledRows<any>(projectsResult,'projecten')
 .map((row) => normalizeProjectForContext(row))
 .filter((row): row is ProjectContext => Boolean(row))

 const afspraken = extractSettledRows<any>(afsprakenResult,'afspraken')
 .map((row) => normalizeAppointmentForContext(row))
 .filter((row): row is AppointmentContext => Boolean(row))

 const openDeals = deals.filter((deal) => !isClosedDealStatus(deal.status))
 const totalOpenDealValue = openDeals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0)
 const unpaidInvoices = facturen.filter((factuur) => !isPaidInvoiceStatus(factuur.status))
 const totalUnpaidValue = unpaidInvoices.reduce((sum, invoice) => sum + (Number(invoice.totaal_bedrag) || 0), 0)
 const activeProjects = projects.filter((project) => !isCompletedProjectStatus(project.status))

 const deterministicReply = maybeBuildInsightReply({
 message,
 deals,
 facturen,
 projects,
 afspraken,
 })
 if (deterministicReply) {
 return NextResponse.json({
 success: true,
 reply: deterministicReply.reply,
 followUpActions: deterministicReply.followUpActions,
 })
 }

 const followUpActions = buildFollowUpActions({
 deals,
 facturen,
 projects,
 afspraken,
 })

 const pageLabel = describePagePath(context.pagePath)
 const topDealsText = deals
 .slice(0, 8)
 .map((deal) => `${deal.name} (${deal.status}: ${toCurrency(deal.value)})`)
 .join(',') ||'Geen'
 const topFacturenText = facturen
 .slice(0, 8)
 .map((factuur) => `${factuur.nummer} voor ${factuur.klant} (${factuur.status}: ${toCurrency(Number(factuur.totaal_bedrag || 0))})`)
 .join(',') ||'Geen'
 const topProjectsText = projects
 .slice(0, 8)
 .map((project) => `${project.name} [${project.status}]${project.deadline ? ` deadline ${project.deadline}` :''}`)
 .join(',') ||'Geen'
 const upcomingAfsprakenText = afspraken
 .slice(0, 6)
 .map((afspraak) => `${afspraak.titel}${afspraak.startTijd ? ` (${afspraak.startTijd.slice(0, 16).replace('T',' ')})` :''}`)
 .join(',') ||'Geen'

 const modelLabel = model ==='llama'?'Llama 3.3':'Gemini'
 const systemPrompt = `
Je bent ArchonPro AI: een senior operationeel en commercieel assistent voor MKB-teams.
Modelmodus: ${modelLabel}.
Huidige pagina: ${pageLabel}.
Gebruikerscontext: locale=${context.locale}, timezone=${context.timezone}.

BEDRIJFSCONTEXT (live):
- Bedrijven: ${companyCount || 0}
- Contacten: ${contactCount || 0}
- Open deals (selectie): ${topDealsText}
- Waarde open deals (selectie): ${toCurrency(totalOpenDealValue)}
- Facturen (selectie): ${topFacturenText}
- Openstaand factuurbedrag (selectie): ${toCurrency(totalUnpaidValue)}
- Aantal onbetaalde facturen: ${unpaidInvoices.length}
- Lopende projecten (selectie): ${topProjectsText}
- Aantal actieve projecten: ${activeProjects.length}
- Komende afspraken: ${upcomingAfsprakenText}

WERKWIJZE:
1. Geef direct een concreet antwoord op de vraag van de gebruiker.
2. Gebruik de contextcijfers waar relevant en noem maximaal 3 prioriteiten.
3. Wees proactief: signaleer risico's (vervallen facturen, deadlines, stilgevallen pipeline) en koppel daar een concrete actie aan.
4. Houd het beknopt en duidelijk in Nederlands.
5. Gebruik nette Markdown met korte koppen en bullets wanneer dat helpt.
6. Verzin geen data; als iets onbekend is, zeg het expliciet.
`

 const aiResponse = await callGemini({
 systemPrompt,
 history,
 message,
 })

 return NextResponse.json({
 success: true,
 reply: aiResponse,
 followUpActions,
 })
 } catch (error: any) {
 console.error('AI Assistant Error:', error)
 return NextResponse.json({ error:'Interne server fout'}, { status: 500 })
 }
}
