import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const CreateArtikelSchema = z.object({
  naam: z.string().trim().min(1),
  categorie: z.enum(['Diensten', 'Producten']).optional().default('Diensten'),
  prijs: z.number().min(0).optional().default(0),
  eenheid: z.string().optional().default('stuk'),
  voorraad: z.string().optional().nullable(),
  status: z.enum(['Actief', 'Inactief']).optional().default('Actief'),
  beschrijving: z.string().optional().nullable(),
})

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
      .from('artikelen')
      .select('*')
      .order('naam', { ascending: true })

    if (result.error) throw result.error

    const artikelen = result.data.map(normalizeArtikelRow)
    return NextResponse.json(artikelen)
  } catch (error) {
    console.error('Error fetching artikelen:', error)
    return NextResponse.json({ error: 'Kon artikelen niet laden.' }, { status: 500 })
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
    const validated = CreateArtikelSchema.parse(body)

    const result = await (supabase as any)
      .from('artikelen')
      .insert([{
        naam: validated.naam,
        categorie: validated.categorie,
        prijs: validated.prijs,
        eenheid: validated.eenheid,
        voorraad: validated.voorraad,
        status: validated.status,
        beschrijving: validated.beschrijving,
      }])
      .select('*')
      .single()

    if (result.error) throw result.error

    return NextResponse.json({ success: true, data: normalizeArtikelRow(result.data) })
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
