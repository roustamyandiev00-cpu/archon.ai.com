import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

import {
  normalizeUitgaveRow,
  parseNumericId,
  resolveCompanyId,
  toIsoDate,
} from '@/app/api/finance/finance-utils'

const UpdateUitgaveSchema = z.object({
  titel: z.string().trim().optional(),
  omschrijving: z.string().trim().optional(),
  leverancier: z.string().trim().nullable().optional(),
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
    return NextResponse.json({ error: 'Ongeldig uitgaven-ID.' }, { status: 400 })
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
    const validated = UpdateUitgaveSchema.parse({
      titel: body?.titel,
      omschrijving: body?.omschrijving,
      leverancier: body?.leverancier,
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
    if (validated.leverancier !== undefined) updateData.leverancier = validated.leverancier || null
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
      .from('uitgaven')
      .update(updateData)
      .eq('id', id)
      .select('id, titel, omschrijving, leverancier, bedrag, datum, categorie, betaalmethode, bedrijf_id, created_at, bedrijven:bedrijf_id ( id, naam )')
      .maybeSingle()

    if (result.error) throw result.error
    if (!result.data) {
      return NextResponse.json({ error: 'Uitgave niet gevonden.' }, { status: 404 })
    }

    return NextResponse.json(normalizeUitgaveRow(result.data))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validatiefout', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating uitgave:', error)
    return NextResponse.json({ error: 'Kon uitgave niet bijwerken.' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params
  const id = parseNumericId(rawId)

  if (id == null) {
    return NextResponse.json({ error: 'Ongeldig uitgaven-ID.' }, { status: 400 })
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
      .from('uitgaven')
      .delete()
      .eq('id', id)

    if (result.error) throw result.error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting uitgave:', error)
    return NextResponse.json({ error: 'Kon uitgave niet verwijderen.' }, { status: 500 })
  }
}
