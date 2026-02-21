import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

import {
  normalizeInkomstRow,
  parseNumericId,
  resolveCompanyId,
  toIsoDate,
} from '@/app/api/finance/finance-utils'

const UpdateInkomstSchema = z
  .object({
    titel: z.string().trim().optional(),
    omschrijving: z.string().trim().optional(),
    bedrag: z.coerce.number().positive().optional(),
    datum: z.string().optional(),
    categorie: z.string().trim().nullable().optional(),
    betaalmethode: z.string().trim().nullable().optional(),
    bedrijf: z.string().trim().nullable().optional(),
    bedrijfId: z.coerce.number().int().positive().nullable().optional(),
  })

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: rawId } = await context.params
  const id = parseNumericId(rawId)

  if (id == null) {
    return NextResponse.json({ error: 'Ongeldig inkomsten-ID.' }, { status: 400 })
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
    const validated = UpdateInkomstSchema.parse({
      titel: body?.titel,
      omschrijving: body?.omschrijving,
      bedrag: body?.bedrag,
      datum: body?.datum,
      categorie: body?.categorie,
      betaalmethode: body?.betaalmethode,
      bedrijf: body?.bedrijf,
      bedrijfId: body?.bedrijfId ?? body?.bedrijf_id,
    })

    const updateData: Record<string, unknown> = {}

    if (validated.titel !== undefined) updateData.titel = validated.titel || null
    if (validated.omschrijving !== undefined) updateData.omschrijving = validated.omschrijving || null
    if (validated.bedrag !== undefined) updateData.bedrag = validated.bedrag
    if (validated.datum !== undefined) updateData.datum = toIsoDate(validated.datum)
    if (validated.categorie !== undefined) updateData.categorie = validated.categorie || null
    if (validated.betaalmethode !== undefined) updateData.betaalmethode = validated.betaalmethode || null

    if (validated.bedrijf !== undefined || validated.bedrijfId !== undefined) {
      const bedrijfId = await resolveCompanyId({
        supabase: supabase as any,
        companyName: validated.bedrijf,
        requestedCompanyId: validated.bedrijfId,
      })
      updateData.bedrijf_id = bedrijfId
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Geen wijzigingen opgegeven.' }, { status: 400 })
    }

    const result = await (supabase as any)
      .from('inkomsten')
      .update(updateData)
      .eq('id', id)
      .select('id, titel, omschrijving, bedrag, datum, categorie, betaalmethode, bedrijf_id, created_at, bedrijven:bedrijf_id ( id, naam )')
      .maybeSingle()

    if (result.error) throw result.error
    if (!result.data) {
      return NextResponse.json({ error: 'Inkomst niet gevonden.' }, { status: 404 })
    }

    return NextResponse.json(normalizeInkomstRow(result.data))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validatiefout', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating inkomst:', error)
    return NextResponse.json({ error: 'Kon inkomst niet bijwerken.' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params
  const id = parseNumericId(rawId)

  if (id == null) {
    return NextResponse.json({ error: 'Ongeldig inkomsten-ID.' }, { status: 400 })
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
    const result = await (supabase as any)
      .from('inkomsten')
      .delete()
      .eq('id', id)

    if (result.error) throw result.error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting inkomst:', error)
    return NextResponse.json({ error: 'Kon inkomst niet verwijderen.' }, { status: 500 })
  }
}
