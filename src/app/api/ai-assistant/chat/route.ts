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
 FactuurPrefillData,
 InvoiceRequiredField,
} from'@/lib/ai-assistant-actions'

const geminiApiKey = process.env.GEMINI_API_KEY
const geminiModel = process.env.GEMINI_CHAT_MODEL?.trim() ||'gemini-1.5-flash'

const invoiceKeywordRegex = /\b(factuur|invoice|rekening)\b/i
const invoiceCreateRegex = /\b(maak|cre[eë]er|genereer|stel\s+op|opstellen|aanmaken?)\b/i
const invoiceFlowHintRegex = /(voor deze factuur mis ik nog|antwoord met|conceptfactuur)/i
const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const isoDateRegex = /\b(20\d{2}-\d{2}-\d{2})\b/g

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
 { role:'user', parts: [{ text: `Systeem instructie: ${systemPrompt}` }] },
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
 body: JSON.stringify({ contents }),
 }
 )

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

 const [
 { count: companyCount },
 { count: contactCount },
 { data: dealsRaw },
 { data: facturenRaw },
 { data: projectsRaw },
 ] = await Promise.all([
 (supabase.from('bedrijven') as any).select('*', { count:'exact', head: true }).eq('user_id', user.id),
 (supabase.from('contacten') as any).select('*', { count:'exact', head: true }).eq('user_id', user.id),
 (supabase.from('deals') as any).select('name, status, value').eq('user_id', user.id),
 (supabase.from('facturen') as any).select('nummer, status, totaal_bedrag, klant').eq('user_id', user.id),
 (supabase.from('projecten') as any).select('name, status').eq('user_id', user.id).limit(10),
 ])

 const deals: Deal[] = Array.isArray(dealsRaw) ? dealsRaw : []
 const facturen: Factuur[] = Array.isArray(facturenRaw) ? facturenRaw : []
 const projects: Array<{ name: string; status: string }> = Array.isArray(projectsRaw) ? projectsRaw : []

 const totalDealValue = deals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0)
 const unpaidInvoices = facturen.filter((factuur) => factuur.status !=='Betaald')
 const totalUnpaidValue = unpaidInvoices.reduce((sum, invoice) => sum + (Number(invoice.totaal_bedrag) || 0), 0)

 const systemPrompt = `
Je bent ArchonPro AI, de persoonlijke business assistent van de gebruiker.
Werkmodus: ${model ==='llama'?'Llama 3.3':'Gemini'}.

Je hebt toegang tot de volgende live gegevens van hun bedrijf:

BEDRIJFS OVERZICHT:
- Totaal aantal bedrijven: ${companyCount || 0}
- Totaal aantal contacten: ${contactCount || 0}

SALES & DEALS:
- Actieve deals (laatste 10): ${deals.map((d) => `${d.name} (${d.status}: €${d.value})`).join(',') ||'Geen'}
- Totale waarde van deze deals: €${totalDealValue.toLocaleString('nl-NL')}

FINANCIËN:
- Laatste facturen: ${facturen.map((f) => `${f.nummer} voor ${f.klant} (${f.status}: €${f.totaal_bedrag})`).join(',') ||'Geen'}
- Totaal openstaand bedrag (van deze selectie): €${totalUnpaidValue.toLocaleString('nl-NL')}
- Aantal onbetaalde facturen: ${unpaidInvoices.length}

PROJECTEN:
- Lopende projecten: ${projects.map((p) => `${p.name} [${p.status}]`).join(',') ||'Geen'}

INSTRUCTIES:
- Beantwoord vragen kort, professioneel en behulpzaam.
- Gebruik bovenstaande gegevens voor concrete antwoorden.
- Als je iets niet zeker weet, zeg dat expliciet.
- Spreek de gebruiker in de je-vorm aan.
- Als gebruiker een factuur wil maken: vraag ontbrekende info 1 voor 1, en maak direct een conceptfactuur zodra alles bekend is.
`

 const aiResponse = await callGemini({
 systemPrompt,
 history,
 message,
 })

 return NextResponse.json({
 success: true,
 reply: aiResponse,
 })
 } catch (error: any) {
 console.error('AI Assistant Error:', error)
 return NextResponse.json({ error:'Interne server fout'}, { status: 500 })
 }
}
