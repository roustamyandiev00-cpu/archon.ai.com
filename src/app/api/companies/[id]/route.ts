import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

type RouteContext = {
  params: Promise<{ id: string }>
}

const CompanyUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  sector: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  description: z.string().optional(),
  vatNumber: z.string().optional(),
  status: z.enum(['Actief', 'Inactief', 'Nieuw']).optional(),
})

function parseCompanyId(rawId: string): number | null {
  const id = Number(rawId)
  return Number.isFinite(id) && id >= 1 ? id : null
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params

  const companyId = parseCompanyId(id)
  if (companyId == null) {
    return NextResponse.json({ error: 'Invalid company id' }, { status: 400 })
  }

  try {
    const supabase = getSupabaseAdmin() as any
    const companyResult = await supabase
      .from('bedrijven')
      .select('id, naam, stad, email, telefoon, adres, created_at, btw')
      .eq('id', companyId)
      .maybeSingle()

    if (companyResult.error) throw companyResult.error
    if (!companyResult.data) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const company = companyResult.data as any
    return NextResponse.json({
      id: String(company.id),
      name: company.naam,
      location: company.stad,
      email: company.email,
      phone: company.telefoon,
      description: company.adres,
      vatNumber: company.btw,
      status: 'Actief',
      contacts: [],
      deals: [],
      projects: [],
      quotes: [],
    })
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('Supabase admin keys') || error.message.includes('missing'))
    ) {
      return NextResponse.json(
        { error: 'Supabase admin client is niet geconfigureerd.' },
        { status: 503 }
      )
    }
    console.error('Error fetching company:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params

  const companyId = parseCompanyId(id)
  if (companyId == null) {
    return NextResponse.json({ error: 'Invalid company id' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const validatedData = CompanyUpdateSchema.parse(body)

    const supabase = getSupabaseAdmin() as any
    const updatePayload: Record<string, string | null> = {}

    if (validatedData.name !== undefined) updatePayload.naam = validatedData.name
    if (validatedData.location !== undefined) updatePayload.stad = validatedData.location || null
    if (validatedData.email !== undefined) updatePayload.email = validatedData.email || null
    if (validatedData.phone !== undefined) updatePayload.telefoon = validatedData.phone || null
    if (validatedData.description !== undefined) updatePayload.adres = validatedData.description || null
    if (validatedData.vatNumber !== undefined) updatePayload.btw = validatedData.vatNumber || null

    const { data, error } = await supabase
      .from('bedrijven')
      .update(updatePayload)
      .eq('id', companyId)
      .select('id, naam, stad, email, telefoon, adres, btw')
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

    const company = data as any
    return NextResponse.json({
      id: String(company.id),
      name: company.naam,
      location: company.stad,
      email: company.email,
      phone: company.telefoon,
      description: company.adres,
      vatNumber: company.btw,
      status: 'Actief',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    if (
      error instanceof Error &&
      (error.message.includes('Supabase admin keys') || error.message.includes('missing'))
    ) {
      return NextResponse.json(
        { error: 'Supabase admin client is niet geconfigureerd.' },
        { status: 503 }
      )
    }
    console.error('Error updating company:', error)
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    )
  }
}

export { PUT as PATCH }

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params

  const companyId = parseCompanyId(id)
  if (companyId == null) {
    return NextResponse.json({ error: 'Invalid company id' }, { status: 400 })
  }

  try {
    const supabase = getSupabaseAdmin() as any
    const { error: deleteError } = await supabase.from('bedrijven').delete().eq('id', companyId)
    if (deleteError) throw deleteError
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('Supabase admin keys') || error.message.includes('missing'))
    ) {
      return NextResponse.json(
        { error: 'Supabase admin client is niet geconfigureerd.' },
        { status: 503 }
      )
    }
    console.error('Error deleting company:', error)
    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    )
  }
}
