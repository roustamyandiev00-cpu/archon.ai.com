import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const UpdateArtikelSchema = z.object({
  naam: z.string().trim().min(1).optional(),
  categorie: z.enum(['Diensten', 'Producten']).optional(),
  prijs: z.number().min(0).optional(),
  eenheid: z.string().optional(),
  voorraad: z.string().optional().nullable(),
  status: z.enum(['Actief', 'Inactief']).optional(),
  beschrijving: z.string().optional().nullable(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

function normalizeArtikelRow(row: any) {
  return {
    id: String(row.id),
    naam: String(row.naam ?? ''),
    categorie: String(row.categorie ?? 'Diensten'),
    prijs: Number(row.prijs ?? 0),
    eenheid: String(row.eenheid ?? 'stuk'),
    voorraad: row.voorraad ? String(row.voorraad) : null,
    status: String(row.status ?? 'Actief'),
    beschrijving: row.beschrijving ? String(row.beschrijving) : null,
    createdAt: row.created_at ? String(row.created_at) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params

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
      .from('artikelen')
      .select('*')
      .eq('id', id)
      .maybeSingle()

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

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params

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
    if (validated.voorraad !== undefined) updateData.voorraad = validated.voorraad
    if (validated.status !== undefined) updateData.status = validated.status
    if (validated.beschrijving !== undefined) updateData.beschrijving = validated.beschrijving

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Geen wijzigingen opgegeven.' }, { status: 400 })
    }

    const result = await (supabase as any)
      .from('artikelen')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .maybeSingle()

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

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params

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
      .from('artikelen')
      .delete()
      .eq('id', id)

    if (result.error) throw result.error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting artikel:', error)
    return NextResponse.json({ error: 'Kon artikel niet verwijderen.' }, { status: 500 })
  }
}
