import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  mapCompanyNamesById,
  resolveCompanyId,
  toIsoDate,
} from '@/app/api/finance/finance-utils'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { normalizeProjectRow, projectStatusValues } from './project-utils'

const CreateProjectSchema = z.object({
  naam: z.string().trim().min(1, 'Naam is verplicht'),
  beschrijving: z.string().trim().optional(),
  bedrijf: z.string().trim().optional(),
  bedrijfId: z.coerce.number().int().positive().nullable().optional(),
  status: z.enum(projectStatusValues).default('Actief'),
  voortgang: z.coerce.number().int().min(0).max(100).default(0),
  deadline: z.string().optional(),
  budget: z.coerce.number().min(0).default(0),
  budgetGebruikt: z.coerce.number().min(0).optional(),
})

const projectSelect = 'id, naam, beschrijving, status, voortgang, deadline, budget, budget_gebruikt, bedrijf_id, created_at'

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
      .from('projecten')
      .select(projectSelect)
      .order('created_at', { ascending: false })
      .limit(500)

    if (result.error) throw result.error

    const rows = (result.data ?? []) as any[]
    const companyMap = await mapCompanyNamesById(
      supabase as any,
      rows.map((row) => row.bedrijf_id as number | null | undefined)
    )

    return NextResponse.json(
      rows.map((row) => normalizeProjectRow({
        ...row,
        companyName: companyMap.get(Number(row.bedrijf_id)) ?? null,
      }))
    )
  } catch (error) {
    console.error('Error fetching projecten:', error)
    return NextResponse.json({ error: 'Kon projecten niet laden.' }, { status: 500 })
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
    const validated = CreateProjectSchema.parse({
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

    const bedrijfId = await resolveCompanyId({
      supabase: supabase as any,
      companyName: validated.bedrijf,
      requestedCompanyId: validated.bedrijfId,
    })

    const insertResult = await (supabase as any)
      .from('projecten')
      .insert([
        {
          naam: validated.naam,
          beschrijving: validated.beschrijving || null,
          status: validated.status,
          voortgang: validated.voortgang,
          deadline: toIsoDate(validated.deadline),
          budget: validated.budget,
          budget_gebruikt: validated.budgetGebruikt ?? 0,
          bedrijf_id: bedrijfId,
        },
      ])
      .select(projectSelect)
      .single()

    if (insertResult.error) throw insertResult.error

    const companyMap = await mapCompanyNamesById(supabase as any, [(insertResult.data as any).bedrijf_id])

    return NextResponse.json(
      normalizeProjectRow({
        ...insertResult.data,
        companyName: companyMap.get(Number((insertResult.data as any).bedrijf_id)) ?? null,
      }),
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validatiefout', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Kon project niet aanmaken.' }, { status: 500 })
  }
}
