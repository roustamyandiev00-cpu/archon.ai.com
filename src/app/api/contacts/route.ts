import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { handleApiError, resolveCompanyId } from '@/lib/api-utils'

const CreateContactSchema = z.object({
  voornaam: z.string().trim().min(1, 'Voornaam is verplicht'),
  achternaam: z.string().trim().min(1, 'Achternaam is verplicht'),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  telefoon: z.string().optional().or(z.literal('')).nullable(),
  functie: z.string().optional().or(z.literal('')).nullable(),
  bedrijf: z.string().optional().or(z.literal('')).nullable(),
  bedrijfId: z.coerce.number().int().positive().nullable().optional(),
})

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
    created_at: row.created_at ? String(row.created_at) : null,
    updated_at: row.updated_at ? String(row.updated_at) : (row.created_at ? String(row.created_at) : null),
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const result = await supabase
      .from('contacten')
      .select('id, voornaam, achternaam, email, telefoon, functie, bedrijf_id, created_at, updated_at, bedrijven:bedrijf_id ( id, naam )')
      .order('created_at', { ascending: false })
      .limit(500)

    if (result.error) throw result.error

    return NextResponse.json((result.data ?? []).map(normalizeContactRow))
  } catch (error) {
    return handleApiError(error, 'Kon contacten niet laden')
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = CreateContactSchema.parse({
      voornaam: body?.voornaam ?? body?.firstName,
      achternaam: body?.achternaam ?? body?.lastName,
      email: body?.email ?? null,
      telefoon: body?.telefoon ?? body?.phone ?? null,
      functie: body?.functie ?? body?.position ?? null,
      bedrijf: body?.bedrijf ?? body?.companyName ?? null,
      bedrijfId: body?.bedrijfId ?? body?.companyId ?? null,
    })

    const supabase = getSupabaseAdmin()
    const bedrijfId = await resolveCompanyId({
      supabase,
      companyName: validated.bedrijf,
      requestedCompanyId: validated.bedrijfId
    })

    const result = await (supabase
      .from('contacten') as any)
      .insert([
        {
          voornaam: validated.voornaam,
          achternaam: validated.achternaam,
          email: validated.email || null,
          telefoon: validated.telefoon || null,
          functie: validated.functie || null,
          bedrijf_id: bedrijfId,
        },
      ])
      .select('id, voornaam, achternaam, email, telefoon, functie, bedrijf_id, created_at, updated_at, bedrijven:bedrijf_id ( id, naam )')
      .single()

    if (result.error) throw result.error

    return NextResponse.json(normalizeContactRow(result.data), { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validatiefout', details: error.issues },
        { status: 400 }
      )
    }
    return handleApiError(error, 'Kon contact niet aanmaken')
  }
}
