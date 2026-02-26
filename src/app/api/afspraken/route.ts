import { NextRequest, NextResponse } from'next/server'
import { z } from'zod'
import { getSupabaseAdmin } from'@/lib/supabaseAdmin'
import { handleApiError, resolveCompanyId } from'@/lib/api-utils'
import { getUserFromRequest } from'@/lib/admin'
import logger from'@/lib/logger'
import { mapCompanyNamesById } from'@/app/api/finance/finance-utils'
import {
 combineDateAndTime,
 normalizeAfspraakRow,
 normalizeDeelnemers,
} from'./afspraak-utils'

const CreateAfspraakSchema = z.object({
 titel: z.string().trim().min(1,'Titel is verplicht'),
 beschrijving: z.string().trim().optional(),
 datum: z.string().min(1),
 startTijd: z.string().min(1),
 eindTijd: z.string().optional(),
 locatie: z.string().trim().optional(),
 deelnemers: z.array(z.string()).optional(),
 bedrijf: z.string().trim().optional(),
 bedrijfId: z.coerce.number().int().positive().nullable().optional(),
})

const afspraakSelect ='id, titel, beschrijving, start_tijd, eind_tijd, locatie, deelnemers, bedrijf_id, created_at'

export async function GET(request: NextRequest) {
 const user = await getUserFromRequest(request)
 if (!user) {
 return NextResponse.json({ error:'Niet ingelogd'}, { status: 401 })
 }

 try {
 const supabase = getSupabaseAdmin()
 const result = await supabase
 .from('afspraken')
 .select(afspraakSelect)
 .eq('user_id', user.id)
 .order('start_tijd', { ascending: true })
 .limit(500)

 if (result.error) throw result.error

 const rows = (result.data ?? []) as any[]
 const companyMap = await mapCompanyNamesById(
 supabase,
 rows.map((row) => row.bedrijf_id as number | null | undefined)
 )

 return NextResponse.json(
 rows.map((row) => normalizeAfspraakRow({
 ...row,
 companyName: companyMap.get(Number(row.bedrijf_id)) ?? null,
 }))
 )
 } catch (error) {
 logger.apiError('/api/afspraken','GET', error)
 return handleApiError(error,'Kon afspraken niet laden. Probeer het later opnieuw.')
 }
}

export async function POST(request: NextRequest) {
 const user = await getUserFromRequest(request)
 if (!user) {
 return NextResponse.json({ error:'Niet ingelogd'}, { status: 401 })
 }

 try {
 const body = await request.json()
 const validated = CreateAfspraakSchema.parse({
 titel: body?.titel ?? body?.onderwerp,
 beschrijving: body?.beschrijving,
 datum: body?.datum,
 startTijd: body?.startTijd ?? body?.tijd,
 eindTijd: body?.eindTijd,
 locatie: body?.locatie,
 deelnemers: normalizeDeelnemers(body?.deelnemers),
 bedrijf: body?.bedrijf,
 bedrijfId: body?.bedrijfId ?? body?.bedrijf_id,
 })

 const startTimestamp = combineDateAndTime(validated.datum, validated.startTijd)
 if (!startTimestamp) {
 return NextResponse.json({ error:'Ongeldige startdatum of starttijd.'}, { status: 400 })
 }

 const endTimestamp = validated.eindTijd
 ? combineDateAndTime(validated.datum, validated.eindTijd)
 : null

 if (validated.eindTijd && !endTimestamp) {
 return NextResponse.json({ error:'Ongeldige eindtijd.'}, { status: 400 })
 }

 const supabase = getSupabaseAdmin()
 const bedrijfId = await resolveCompanyId({
 supabase,
 companyName: validated.bedrijf,
 requestedCompanyId: validated.bedrijfId,
 })

 const insertResult = await (supabase
 .from('afspraken') as any)
 .insert([
 {
 titel: validated.titel,
 beschrijving: validated.beschrijving || null,
 start_tijd: startTimestamp,
 eind_tijd: endTimestamp,
 locatie: validated.locatie || null,
 deelnemers: validated.deelnemers ?? [],
 bedrijf_id: bedrijfId,
 user_id: user.id,
 },
 ])
 .select(afspraakSelect)
 .single()

 if (insertResult.error) throw insertResult.error

 const companyMap = await mapCompanyNamesById(supabase, [(insertResult.data as any).bedrijf_id])

 return NextResponse.json(
 normalizeAfspraakRow({
 ...insertResult.data,
 companyName: companyMap.get(Number((insertResult.data as any).bedrijf_id)) ?? null,
 }),
 { status: 201 }
 )
 } catch (error) {
 if (error instanceof z.ZodError) {
 return NextResponse.json(
 { error:'De ingediende gegevens zijn ongeldig.', details: error.issues },
 { status: 400 }
 )
 }
 logger.apiError('/api/afspraken','POST', error)
 return handleApiError(error,'Kon afspraak niet aanmaken. Probeer het later opnieuw.')
 }
}
