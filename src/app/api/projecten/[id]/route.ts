import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  mapCompanyNamesById,
  resolveCompanyId,
  toIsoDate,
} from '@/app/api/finance/finance-utils'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

import { normalizeProjectRow, parseNumericId, projectStatusValues } from '../project-utils'

const UpdateProjectSchema = z.object({
  naam: z.string().trim().min(1).optional(),
  beschrijving: z.string().trim().nullable().optional(),
  bedrijf: z.string().trim().nullable().optional(),
  bedrijfId: z.coerce.number().int().positive().nullable().optional(),
  status: z.enum(projectStatusValues).optional(),
  voortgang: z.coerce.number().int().min(0).max(100).optional(),
  deadline: z.string().nullable().optional(),
  budget: z.coerce.number().min(0).optional(),
  budgetGebruikt: z.coerce.number().min(0).optional(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

const projectSelect = 'id, naam, beschrijving, status, voortgang, deadline, budget, budget_gebruikt, bedrijf_id, created_at'

export async function PATCH(request: Request, context: RouteContext) {
  const { id: rawId } = await context.params
  const id = parseNumericId(rawId)

  if (id == null) {
    return NextResponse.json({ error: 'Ongeldig project-ID.' }, { status: 400 })
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
    const validated = UpdateProjectSchema.parse({
      naam: body?.naam,
      beschrijving: body?.beschrijving,
      bedrijf: body?.bedrijf,
      bedrijfId: body?.bedrijfId ?? body?.bedrijf_id,
      status: body?.status,
      voortgang: body?.voortgang,
      deadline: body?.deadline,
      budget: body?.budget,
      budgetGebruikt: body?.budgetGebruikt ?? body?.budget_gebruikt,
    })

    const updateData: Record<string, unknown> = {}

    if (validated.naam !== undefined) updateData.naam = validated.naam
    if (validated.beschrijving !== undefined) updateData.beschrijving = validated.beschrijving || null
    if (validated.status !== undefined) updateData.status = validated.status
    if (validated.voortgang !== undefined) updateData.voortgang = validated.voortgang
    if (validated.deadline !== undefined) updateData.deadline = toIsoDate(validated.deadline)
    if (validated.budget !== undefined) updateData.budget = validated.budget
    if (validated.budgetGebruikt !== undefined) updateData.budget_gebruikt = validated.budgetGebruikt

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
      .from('projecten')
      .update(updateData)
      .eq('id', id)
      .select(projectSelect)
      .maybeSingle()

    if (result.error) throw result.error
    if (!result.data) return NextResponse.json({ error: 'Project niet gevonden.' }, { status: 404 })

    const companyMap = await mapCompanyNamesById(supabase as any, [(result.data as any).bedrijf_id])

    return NextResponse.json(
      normalizeProjectRow({
        ...result.data,
        companyName: companyMap.get(Number((result.data as any).bedrijf_id)) ?? null,
      })
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validatiefout', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Kon project niet bijwerken.' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params
  const id = parseNumericId(rawId)

  if (id == null) {
    return NextResponse.json({ error: 'Ongeldig project-ID.' }, { status: 400 })
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
      .from('projecten')
      .delete()
      .eq('id', id)

    if (result.error) throw result.error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Kon project niet verwijderen.' }, { status: 500 })
  }
}
