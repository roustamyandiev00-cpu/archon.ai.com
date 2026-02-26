import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getUserFromRequest } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

import {
 normalizeArtikelRow,
 supportsArtikelUserScope,
} from './artikel-utils'

const CreateArtikelSchema = z.object({
 naam: z.string().trim().min(1),
 categorie: z.enum(['Diensten', 'Producten']).optional().default('Diensten'),
 prijs: z.coerce.number().min(0).optional().default(0),
 eenheid: z.string().trim().optional().default('stuk'),
 voorraad: z.string().trim().optional().nullable(),
 status: z.enum(['Actief', 'Inactief']).optional().default('Actief'),
 beschrijving: z.string().trim().optional().nullable(),
})

export async function GET(request: NextRequest) {
 const user = await getUserFromRequest(request)
 if (!user) {
 return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
 }

 let supabase: ReturnType<typeof getSupabaseAdmin>

 try {
 supabase = getSupabaseAdmin()
 } catch {
 return NextResponse.json(
 { error: 'Supabase admin client is niet geconfigureerd.' },
 { status: 503 }
 )
 }

 try {
 const supportsUserScope = await supportsArtikelUserScope(supabase as any)
 if (!supportsUserScope) {
 console.warn('artikelen.user_id ontbreekt; /api/artikelen valt terug op ongescopeerde query.')
 }

 let query = (supabase as any)
 .from('artikelen')
 .select('*')
 .order('naam', { ascending: true })

 if (supportsUserScope) {
 query = query.eq('user_id', user.id)
 }

 const result = await query
 if (result.error) throw result.error

 const artikelen = (result.data ?? []).map(normalizeArtikelRow)
 return NextResponse.json(artikelen)
 } catch (error) {
 console.error('Error fetching artikelen:', error)
 return NextResponse.json({ error: 'Kon artikelen niet laden.' }, { status: 500 })
 }
}

export async function POST(request: NextRequest) {
 const user = await getUserFromRequest(request)
 if (!user) {
 return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
 }

 let supabase: ReturnType<typeof getSupabaseAdmin>

 try {
 supabase = getSupabaseAdmin()
 } catch {
 return NextResponse.json(
 { error: 'Supabase admin client is niet geconfigureerd.' },
 { status: 503 }
 )
 }

 try {
 const body = await request.json()
 const validated = CreateArtikelSchema.parse(body)
 const supportsUserScope = await supportsArtikelUserScope(supabase as any)

 if (!supportsUserScope) {
 console.warn('artikelen.user_id ontbreekt; /api/artikelen POST maakt artikel zonder user-scope.')
 }

 const insertPayload: Record<string, unknown> = {
 naam: validated.naam,
 categorie: validated.categorie,
 prijs: validated.prijs,
 eenheid: validated.eenheid,
 voorraad: validated.voorraad || null,
 status: validated.status,
 beschrijving: validated.beschrijving || null,
 }

 if (supportsUserScope) {
 insertPayload.user_id = user.id
 }

 const result = await (supabase as any)
 .from('artikelen')
 .insert([insertPayload])
 .select('*')
 .single()

 if (result.error) throw result.error

 return NextResponse.json({ success: true, data: normalizeArtikelRow(result.data) }, { status: 201 })
 } catch (error) {
 if (error instanceof z.ZodError) {
 return NextResponse.json(
 { error: 'Validatiefout', details: error.issues },
 { status: 400 }
 )
 }

 console.error('Error creating artikel:', error)
 return NextResponse.json({ error: 'Kon artikel niet aanmaken.' }, { status: 500 })
 }
}
