import { NextResponse } from'next/server'
import { getSupabaseAdmin } from'./supabaseAdmin'
import logger from'./logger'

export interface ApiErrorContext {
 route?: string
 method?: string
 userId?: string
 [key: string]: unknown
}

export function handleApiError(
 error: unknown,
 message ='Er is een fout opgetreden',
 context?: ApiErrorContext
) {
 // Check voor Supabase configuratie fouten
 if (
 error instanceof Error &&
 (error.message.includes('Supabase admin keys') || error.message.includes('missing'))
 ) {
 logger.error('Supabase admin client niet geconfigureerd', context)
 return NextResponse.json(
 { error:'Supabase admin client is niet geconfigureerd.'},
 { status: 503 }
 )
 }

 // Log de fout met context
 const err = error instanceof Error ? error : new Error(String(error))
 logger.error(message, context, err)

 return NextResponse.json({ error: message }, { status: 500 })
}

/**
 * Nederlandse foutmeldingen voor veelvoorkomende errors
 */
export const dutchErrorMessages: Record<string, string> = {
'Network request failed':'Netwerkverbinding mislukt. Controleer uw internetverbinding.',
'Failed to fetch':'Kon geen verbinding maken met de server.',
'Unauthorized':'U bent niet ingelogd of uw sessie is verlopen.',
'Forbidden':'U heeft geen toegang tot deze functionaliteit.',
'Not Found':'De gevraagde gegevens konden niet worden gevonden.',
'Internal Server Error':'Er is een serverfout opgetreden. Probeer het later opnieuw.',
'Service Unavailable':'De service is momenteel niet beschikbaar. Probeer het later opnieuw.',
'Gateway Timeout':'De server reageerde niet tijdig. Probeer het later opnieuw.',
'Connection refused':'Kon geen verbinding maken met de database.',
'Invalid JSON':'De ingediende gegevens zijn ongeldig.',
'Validation failed':'De ingediende gegevens voldoen niet aan de vereisten.',
}

/**
 * Vertaal een foutmelding naar het Nederlands
 */
export function translateError(error: string): string {
 for (const [key, value] of Object.entries(dutchErrorMessages)) {
 if (error.toLowerCase().includes(key.toLowerCase())) {
 return value
 }
 }
 return error
}

export async function resolveCompanyId(params: {
 supabase: any
 companyName?: string | null
 requestedCompanyId?: number | null
 createIfMissing?: boolean
}): Promise<number | null> {
 const {
 supabase,
 companyName,
 requestedCompanyId,
 createIfMissing = true,
 } = params

 if (requestedCompanyId != null) return requestedCompanyId
 if (!companyName || !companyName.trim()) return null

 const trimmedName = companyName.trim()

 const existing = await supabase
 .from('bedrijven')
 .select('id')
 .ilike('naam', trimmedName)
 .order('id', { ascending: true })
 .limit(1)
 .maybeSingle()

 if (existing.error) throw existing.error
 if (existing.data?.id != null) return Number(existing.data.id)

 if (!createIfMissing) return null

 const created = await supabase
 .from('bedrijven')
 .insert([{ naam: trimmedName }])
 .select('id')
 .single()

 if (created.error) throw created.error

 return Number(created.data.id)
}
