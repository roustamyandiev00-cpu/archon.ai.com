import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

import {
  normalizeUitgaveRow,
  resolveCompanyId,
  toIsoDate,
} from '@/app/api/finance/finance-utils'

const CreateUitgaveSchema = z
  .object({
    titel: z.string().trim().optional(),
    omschrijving: z.string().trim().optional(),
    leverancier: z.string().trim().optional(),
    bedrag: z.coerce.number().positive('Bedrag moet groter zijn dan 0'),
    datum: z.string().optional(),
    categorie: z.string().trim().optional(),
    betaalmethode: z.string().trim().optional(),
    bedrijf: z.string().trim().optional(),
    bedrijfId: z.coerce.number().int().positive().nullable().optional(),
  })
  .refine((value) => Boolean(value.titel || value.omschrijving), {
    message: 'Titel of omschrijving is verplicht',
    path: ['titel'],
  })

export async function GET() {
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
      .select('id, titel, omschrijving, leverancier, bedrag, datum, categorie, betaalmethode, bedrijf_id, created_at, bedrijven:bedrijf_id ( id, naam )')
      .order('datum', { ascending: false })
      .limit(500)

    if (result.error) throw result.error

    return NextResponse.json((result.data ?? []).map(normalizeUitgaveRow))
  } catch (error) {
    console.error('Error fetching uitgaven:', error)
    return NextResponse.json({ error: 'Kon uitgaven niet laden.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    const validated = CreateUitgaveSchema.parse({
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

    const bedrijfId = await resolveCompanyId({
      supabase: supabase as any,
      companyName: validated.bedrijf,
      requestedCompanyId: validated.bedrijfId,
    })

    const insertResult = await (supabase as any)
      .from('uitgaven')
      .insert([
        {
          titel: validated.titel || validated.omschrijving,
          omschrijving: validated.omschrijving || null,
          leverancier: validated.leverancier || null,
          bedrag: validated.bedrag,
          datum: toIsoDate(validated.datum),
          categorie: validated.categorie || null,
          betaalmethode: validated.betaalmethode || null,
          bedrijf_id: bedrijfId,
        },
      ])
      .select('id, titel, omschrijving, leverancier, bedrag, datum, categorie, betaalmethode, bedrijf_id, created_at, bedrijven:bedrijf_id ( id, naam )')
      .single()

    if (insertResult.error) throw insertResult.error

    return NextResponse.json(normalizeUitgaveRow(insertResult.data), { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validatiefout', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating uitgave:', error)
    return NextResponse.json({ error: 'Kon uitgave niet aanmaken.' }, { status: 500 })
  }
}
