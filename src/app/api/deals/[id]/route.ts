import { NextResponse } from 'next/server'
import { z } from 'zod'

import { mapCompanyNamesById, resolveCompanyId } from '@/app/api/finance/finance-utils'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

import {
  dealStageValues,
  detectDealsSchemaVariant,
  normalizeDealRow,
  parseNumericId,
  selectColumnsForVariant,
  toIsoDate,
  type DealsSchemaVariant,
} from '../deal-utils'

const UpdateDealSchema = z.object({
  titel: z.string().trim().min(1).optional(),
  bedrijf: z.string().trim().nullable().optional(),
  bedrijfId: z.coerce.number().int().positive().nullable().optional(),
  waarde: z.coerce.number().min(0).optional(),
  stadium: z.enum(dealStageValues).optional(),
  kans: z.coerce.number().int().min(0).max(100).optional(),
  deadline: z.string().nullable().optional(),
  notities: z.string().trim().nullable().optional(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

function buildUpdatePayload(variant: DealsSchemaVariant, data: {
  titel?: string
  waarde?: number
  stadium?: string
  kans?: number
  deadline?: string | null
  bedrijfId?: number | null
  notities?: string | null
}) {
  const payload: Record<string, unknown> = {}

  if (variant === 'dutch') {
    if (data.titel !== undefined) payload.titel = data.titel
    if (data.waarde !== undefined) payload.waarde = data.waarde
    if (data.stadium !== undefined) payload.stadium = data.stadium
    if (data.kans !== undefined) payload.kans = data.kans
    if (data.deadline !== undefined) payload.deadline = data.deadline
    if (data.bedrijfId !== undefined) payload.bedrijf_id = data.bedrijfId
    if (data.notities !== undefined) payload.notities = data.notities
    return payload
  }

  if (data.titel !== undefined) payload.title = data.titel
  if (data.waarde !== undefined) payload.amount = data.waarde
  if (data.stadium !== undefined) payload.stage = data.stadium
  if (data.kans !== undefined) payload.probability = data.kans
  if (data.bedrijfId !== undefined) payload.company_id = data.bedrijfId

  return payload
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: rawId } = await context.params
  const id = parseNumericId(rawId)

  if (id == null) {
    return NextResponse.json({ error: 'Ongeldig deal-ID.' }, { status: 400 })
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
    const validated = UpdateDealSchema.parse({
      titel: body?.titel,
      bedrijf: body?.bedrijf,
      bedrijfId: body?.bedrijfId ?? body?.bedrijf_id,
      waarde: body?.waarde,
      stadium: body?.stadium,
      kans: body?.kans,
      deadline: body?.deadline,
    })

    const variant = await detectDealsSchemaVariant(supabase as any)

    const payloadData: {
      titel?: string
      waarde?: number
      stadium?: string
      kans?: number
      deadline?: string | null
      bedrijfId?: number | null
    } = {}

    if (validated.titel !== undefined) payloadData.titel = validated.titel
    if (validated.waarde !== undefined) payloadData.waarde = validated.waarde
    if (validated.stadium !== undefined) payloadData.stadium = validated.stadium
    if (validated.kans !== undefined) payloadData.kans = validated.kans
    if (validated.deadline !== undefined) payloadData.deadline = toIsoDate(validated.deadline)

    if (validated.bedrijf !== undefined || validated.bedrijfId !== undefined) {
      payloadData.bedrijfId = await resolveCompanyId({
        supabase: supabase as any,
        companyName: validated.bedrijf,
        requestedCompanyId: validated.bedrijfId,
      })
    }

    const updatePayload = buildUpdatePayload(variant, payloadData)

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'Geen wijzigingen opgegeven.' }, { status: 400 })
    }

    const result = await (supabase as any)
      .from('deals')
      .update(updatePayload)
      .eq('id', id)
      .select(selectColumnsForVariant(variant))
      .maybeSingle()

    if (result.error) throw result.error
    if (!result.data) return NextResponse.json({ error: 'Deal niet gevonden.' }, { status: 404 })

    const companyId = variant === 'dutch' ? (result.data as any).bedrijf_id : (result.data as any).company_id
    const companyMap = await mapCompanyNamesById(supabase as any, [companyId])

    return NextResponse.json(
      normalizeDealRow({
        ...result.data,
        companyName: companyMap.get(Number(companyId)) ?? null,
      })
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validatiefout', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating deal:', error)
    return NextResponse.json({ error: 'Kon deal niet bijwerken.' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params
  const id = parseNumericId(rawId)

  if (id == null) {
    return NextResponse.json({ error: 'Ongeldig deal-ID.' }, { status: 400 })
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
      .from('deals')
      .delete()
      .eq('id', id)

    if (result.error) throw result.error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting deal:', error)
    return NextResponse.json({ error: 'Kon deal niet verwijderen.' }, { status: 500 })
  }
}
