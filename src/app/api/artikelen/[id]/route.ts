import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getUserFromRequest } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

import {
 normalizeArtikelRow,
 supportsArtikelUserScope,
} from '../artikel-utils'

const UpdateArtikelSchema = z.object({
 naam: z.string().trim().min(1).optional(),
 categorie: z.enum(['Diensten', 'Producten']).optional(),
 prijs: z.coerce.number().min(0).optional(),
 eenheid: z.string().trim().min(1).optional(),
 voorraad: z.string().trim().optional().nullable(),
 status: z.enum(['Actief', 'Inactief']).optional(),
 beschrijving: z.string().trim().optional().nullable(),
})

type RouteContext = {
 params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
 const { id } = await context.params
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

 let query = (supabase as any)
 .from('artikelen')
 .select('*')
 .eq('id', id)
 .maybeSingle()

 if (supportsUserScope) {
 query = query.eq('user_id', user.id)
 }

 const result = await query
 if (result.error) throw result.error
 if (!result.data) {
 return NextResponse.json({ error: 'Artikel niet gevonden.' }, { status: 404 })
 }

 return NextResponse.json(normalizeArtikelRow(result.data))
 } catch (error) {
 console.error('Error fetching artikel:', error)
 return NextResponse.json({ error: 'Kon artikel niet laden.' }, { status: 500 })
 }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
 const { id } = await context.params
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
 const validated = UpdateArtikelSchema.parse(body)
 const updateData: Record<string, unknown> = {}

 if (validated.naam !== undefined) updateData.naam = validated.naam
 if (validated.categorie !== undefined) updateData.categorie = validated.categorie
 if (validated.prijs !== undefined) updateData.prijs = validated.prijs
 if (validated.eenheid !== undefined) updateData.eenheid = validated.eenheid
 if (validated.voorraad !== undefined) updateData.voorraad = validated.voorraad || null
 if (validated.status !== undefined) updateData.status = validated.status
 if (validated.beschrijving !== undefined) updateData.beschrijving = validated.beschrijving || null

 if (Object.keys(updateData).length === 0) {
 return NextResponse.json({ error: 'Geen wijzigingen opgegeven.' }, { status: 400 })
 }

 const supportsUserScope = await supportsArtikelUserScope(supabase as any)

 let query = (supabase as any)
 .from('artikelen')
 .update(updateData)
 .eq('id', id)
 .select('*')
 .maybeSingle()

 if (supportsUserScope) {
 query = query.eq('user_id', user.id)
 }

 const result = await query
 if (result.error) throw result.error
 if (!result.data) {
 return NextResponse.json({ error: 'Artikel niet gevonden.' }, { status: 404 })
 }

 return NextResponse.json({ success: true, data: normalizeArtikelRow(result.data) })
 } catch (error) {
 if (error instanceof z.ZodError) {
 return NextResponse.json(
 { error: 'Validatiefout', details: error.issues },
 { status: 400 }
 )
 }

 console.error('Error updating artikel:', error)
 return NextResponse.json({ error: 'Kon artikel niet bijwerken.' }, { status: 500 })
 }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
 const { id } = await context.params
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

 let query = (supabase as any)
 .from('artikelen')
 .delete()
 .eq('id', id)
 .select('id')
 .maybeSingle()

 if (supportsUserScope) {
 query = query.eq('user_id', user.id)
 }

 const result = await query
 if (result.error) throw result.error
 if (!result.data) {
 return NextResponse.json({ error: 'Artikel niet gevonden.' }, { status: 404 })
 }

 return NextResponse.json({ success: true })
 } catch (error) {
 console.error('Error deleting artikel:', error)
 return NextResponse.json({ error: 'Kon artikel niet verwijderen.' }, { status: 500 })
 }
}
