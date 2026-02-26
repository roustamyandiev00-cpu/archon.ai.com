import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { getUserFromRequest } from '@/lib/admin'
import { handleApiError, resolveCompanyId } from '@/lib/api-utils'
import logger from '@/lib/logger'

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

export async function GET(request: NextRequest) {
  // Auth check
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '25', 10)), 100)
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10))

    const supabase = getSupabaseAdmin()
    
    // Get total count for pagination
    const countResult = await (supabase as any)
      .from('contacten')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    const result = await (supabase as any)
      .from('contacten')
      .select('id, voornaam, achternaam, email, telefoon, functie, bedrijf_id, created_at, updated_at, bedrijven:bedrijf_id ( id, naam )')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (result.error) throw result.error

    return NextResponse.json({
      data: (result.data ?? []).map(normalizeContactRow),
      pagination: {
        total: countResult.count ?? 0,
        limit,
        offset,
        hasMore: (countResult.count ?? 0) > offset + limit
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
      }
    })
  } catch (error) {
    logger.apiError('/api/contacts', 'GET', error)
    return handleApiError(error, 'Kon contacten niet laden. Probeer het later opnieuw.')
  }
}

export async function POST(request: NextRequest) {
  // Auth check
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

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
          user_id: user.id,
        },
      ])
      .select('id, voornaam, achternaam, email, telefoon, functie, bedrijf_id, created_at, updated_at, bedrijven:bedrijf_id ( id, naam )')
      .single()

    if (result.error) throw result.error

    return NextResponse.json(normalizeContactRow(result.data), { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'De ingediende gegevens zijn ongeldig.', details: error.issues },
        { status: 400 }
      )
    }
    logger.apiError('/api/contacts', 'POST', error)
    return handleApiError(error, 'Kon contact niet aanmaken. Probeer het later opnieuw.')
  }
}
