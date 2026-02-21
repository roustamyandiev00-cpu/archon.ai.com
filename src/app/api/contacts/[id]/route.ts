import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const UpdateContactSchema = z.object({
  voornaam: z.string().trim().min(1).optional(),
  achternaam: z.string().trim().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  telefoon: z.string().optional().or(z.literal('')).nullable(),
  functie: z.string().optional().or(z.literal('')).nullable(),
  bedrijf: z.string().optional().or(z.literal('')).nullable(),
  bedrijfId: z.coerce.number().int().positive().nullable().optional(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

function parseContactId(rawId: string): number | null {
  const parsed = Number(rawId)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

function normalizeContactRow(row: any) {
  const bedrijfLink = Array.isArray(row?.bedrijven) ? row.bedrijven[0] : row?.bedrijven

  return {
    id: String(row.id),
    voornaam: String(row.voornaam ?? ''),
    achternaam: String(row.achternaam ?? ''),
    email: row.email ? String(row.email) : null,
    telefoon: row.telefoon ? String(row.telefoon) : null,
    functie: row.functie ? String(row.functie) : null,
    bedrijf: bedrijfLink?.naam ? String(bedrijfLink.naam) : null,
    bedrijfId: row.bedrijf_id == null ? null : Number(row.bedrijf_id),
    createdAt: row.created_at ? String(row.created_at) : null,
  }
}

async function resolveCompanyId(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  bedrijf: string | null | undefined,
  requestedCompanyId: number | null | undefined
): Promise<number | null | undefined> {
  if (requestedCompanyId != null) return requestedCompanyId
  if (bedrijf === null) return null
  if (!bedrijf || !bedrijf.trim()) return undefined

  const trimmedName = bedrijf.trim()
  const supabaseAny = supabase as any

  const existingCompany = await supabaseAny
    .from('bedrijven')
    .select('id')
    .ilike('naam', trimmedName)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (existingCompany.error) throw existingCompany.error
  if (existingCompany.data?.id != null) return Number(existingCompany.data.id)

  const createdCompany = await supabaseAny
    .from('bedrijven')
    .insert([{ naam: trimmedName }])
    .select('id')
    .single()

  if (createdCompany.error) throw createdCompany.error

  return Number(createdCompany.data.id)
}

export async function PUT(request: Request, context: RouteContext) {
  const { id: rawId } = await context.params
  const id = parseContactId(rawId)

  if (id == null) {
    return NextResponse.json({ error: 'Ongeldig contact-ID.' }, { status: 400 })
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

    const validated = UpdateContactSchema.parse({
      voornaam: body?.voornaam ?? body?.firstName,
      achternaam: body?.achternaam ?? body?.lastName,
      email: body?.email ?? null,
      telefoon: body?.telefoon ?? body?.phone ?? null,
      functie: body?.functie ?? body?.position ?? null,
      bedrijf: body?.bedrijf ?? body?.companyName ?? undefined,
      bedrijfId: body?.bedrijfId ?? body?.companyId ?? undefined,
    })

    const updateData: Record<string, unknown> = {}

    if (validated.voornaam !== undefined) updateData.voornaam = validated.voornaam
    if (validated.achternaam !== undefined) updateData.achternaam = validated.achternaam
    if (validated.email !== undefined) updateData.email = validated.email || null
    if (validated.telefoon !== undefined) updateData.telefoon = validated.telefoon || null
    if (validated.functie !== undefined) updateData.functie = validated.functie || null

    if (validated.bedrijf !== undefined || validated.bedrijfId !== undefined) {
      const resolvedCompanyId = await resolveCompanyId(supabase, validated.bedrijf, validated.bedrijfId)
      if (resolvedCompanyId !== undefined) {
        updateData.bedrijf_id = resolvedCompanyId
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Geen wijzigingen opgegeven.' }, { status: 400 })
    }

    const result = await (supabase as any)
      .from('contacten')
      .update(updateData)
      .eq('id', id)
      .select('id, voornaam, achternaam, email, telefoon, functie, bedrijf_id, created_at, bedrijven:bedrijf_id ( id, naam )')
      .maybeSingle()

    if (result.error) throw result.error
    if (!result.data) {
      return NextResponse.json({ error: 'Contact niet gevonden.' }, { status: 404 })
    }

    return NextResponse.json(normalizeContactRow(result.data))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validatiefout', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating contact:', error)
    return NextResponse.json({ error: 'Kon contact niet bijwerken.' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params
  const id = parseContactId(rawId)

  if (id == null) {
    return NextResponse.json({ error: 'Ongeldig contact-ID.' }, { status: 400 })
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
      .from('contacten')
      .delete()
      .eq('id', id)

    if (result.error) throw result.error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json({ error: 'Kon contact niet verwijderen.' }, { status: 500 })
  }
}
