import { NextRequest, NextResponse } from'next/server'
import { z } from'zod'
import { getSupabaseAdmin } from'@/lib/supabaseAdmin'
import { getUserFromRequest } from'@/lib/admin'
import { handleApiError } from'@/lib/api-utils'
import logger from'@/lib/logger'

const CompanySchema = z.object({
 name: z.string().min(1,'Naam is verplicht'),
 sector: z.string().optional(),
 location: z.string().optional(),
 website: z.string().url().optional().or(z.literal('')),
 phone: z.string().optional(),
 email: z.string().email().optional().or(z.literal('')),
 description: z.string().optional(),
 vatNumber: z.string().optional(),
 status: z.enum(['Actief','Inactief','Nieuw']).default('Actief'),
})

function deriveStatus(createdAt: string | null):'Actief'|'Nieuw'{
 if (createdAt) {
 const createdDate = new Date(createdAt)
 const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / 86_400_000)
 if (Number.isFinite(daysSinceCreation) && daysSinceCreation <= 30) return'Nieuw'
 }
 return'Actief'
}

async function listSupabaseCompanies(params: {
 status: string | null
 sector: string | null
 search: string | null
 userId: string
}) {
 const { status, sector, search, userId } = params
 const supabase = getSupabaseAdmin()

 let query = (supabase.from('bedrijven') as any)
 .select('id, naam, stad, email, created_at, btw')
 .eq('user_id', userId)

 // Apply filters server-side
 if (status && status !== 'all') {
 // Derive status based on creation date
 if (status === 'Nieuw') {
 const thirtyDaysAgo = new Date()
 thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
 query = query.gte('created_at', thirtyDaysAgo.toISOString())
 } else if (status === 'Actief') {
 const thirtyDaysAgo = new Date()
 thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
 query = query.lt('created_at', thirtyDaysAgo.toISOString())
 }
 }

 if (search && search.trim()) {
 query = query.or(`naam.ilike.%${search}%,stad.ilike.%${search}%,email.ilike.%${search}%`)
 }

 // Apply ordering and limit
 query = query.order('naam', { ascending: true }).limit(100)

 const { data: bedrijvenResult, error } = await query
 
 if (error) throw error

 const payload = ((bedrijvenResult || []) as any[])
 .map((bedrijf) => {
 const computedStatus = deriveStatus(bedrijf.created_at ?? null)

 return {
 id: String(bedrijf.id),
 name: bedrijf.naam,
 sector: 'Onbekend',
 location: bedrijf.stad ?? null,
 email: bedrijf.email ?? null,
 vatNumber: bedrijf.btw ?? null,
 status: computedStatus,
 dealValue: 0,
 _count: {
 contacts: 0,
 deals: 0,
 projects: 0,
 },
 }
 })

 return payload
}

export async function GET(request: NextRequest) {
 // Auth check
 const user = await getUserFromRequest(request)
 if (!user) {
 return NextResponse.json({ error:'Niet ingelogd'}, { status: 401 })
 }

 const { searchParams } = new URL(request.url)
 const status = searchParams.get('status')
 const sector = searchParams.get('sector')
 const search = searchParams.get('search')

 try {
 const payload = await listSupabaseCompanies({ status, sector, search, userId: user.id })
 return NextResponse.json(payload, {
 headers: {
'Cache-Control':'public, max-age=120, stale-while-revalidate=300'
 }
 })
 } catch (error) {
 logger.apiError('/api/companies','GET', error)
 return handleApiError(error,'Kon bedrijven niet laden. Probeer het later opnieuw.')
 }
}

export async function POST(request: NextRequest) {
 // Auth check
 const user = await getUserFromRequest(request)
 if (!user) {
 return NextResponse.json({ error:'Niet ingelogd'}, { status: 401 })
 }

 try {
 const body = await request.json()
 const validatedData = CompanySchema.parse(body)

 const supabase = getSupabaseAdmin()
 const { data, error } = await (supabase
 .from('bedrijven') as any)
 .insert([
 {
 naam: validatedData.name,
 stad: validatedData.location || null,
 email: validatedData.email || null,
 telefoon: validatedData.phone || null,
 adres: validatedData.description || null,
 btw: validatedData.vatNumber || null,
 user_id: user.id,
 },
 ])
 .select('id, naam, stad, email, created_at')
 .single()

 if (error) throw error

 return NextResponse.json(
 {
 id: String(data.id),
 name: data.naam,
 sector: validatedData.sector ||'Onbekend',
 location: data.stad,
 email: data.email,
 status:'Nieuw',
 dealValue: 0,
 _count: { contacts: 0, deals: 0, projects: 0 },
 },
 { status: 201 }
 )
 } catch (error) {
 if (error instanceof z.ZodError) {
 return NextResponse.json(
 { error:'De ingediende gegevens zijn ongeldig.', details: error.issues },
 { status: 400 }
 )
 }
 logger.apiError('/api/companies','POST', error)
 return handleApiError(error,'Kon bedrijf niet aanmaken. Probeer het later opnieuw.')
 }
}
