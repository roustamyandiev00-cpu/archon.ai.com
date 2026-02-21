import { NextResponse } from 'next/server'
import { z } from 'zod'

import { mapCompanyNamesById, resolveCompanyId } from '@/app/api/finance/finance-utils'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

import {
  dealStageValues,
  detectDealsSchemaVariant,
  normalizeDealRow,
  selectColumnsForVariant,
  toIsoDate,
  type DealsSchemaVariant,
} from './deal-utils'

const CreateDealSchema = z.object({
  titel: z.string().trim().min(1, 'Titel is verplicht'),
  bedrijf: z.string().trim().optional(),
  bedrijfId: z.coerce.number().int().positive().nullable().optional(),
  waarde: z.coerce.number().min(0),
  stadium: z.enum(dealStageValues).default('Lead'),
  kans: z.coerce.number().int().min(0).max(100).default(50),
  deadline: z.string().optional(),
})

function buildInsertPayload(variant: DealsSchemaVariant, data: {
  titel: string
  waarde: number
  stadium: string
  kans: number
  deadline: string | null
  bedrijfId: number | null
}) {
  if (variant === 'dutch') {
    return {
      titel: data.titel,
      waarde: data.waarde,
      stadium: data.stadium,
      kans: data.kans,
      deadline: data.deadline,
      bedrijf_id: data.bedrijfId,
    }
  }

  return {
    title: data.titel,
    amount: data.waarde,
    stage: data.stadium,
    probability: data.kans,
    company_id: data.bedrijfId,
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
    const variant = await detectDealsSchemaVariant(supabase as any)
    const selectColumns = selectColumnsForVariant(variant)

    const result = await (supabase as any)
      .from('deals')
      .select(selectColumns)
      .order('created_at', { ascending: false })
      .limit(500)

    if (result.error) throw result.error

    const rows = (result.data ?? []) as any[]
    const companyIdField = variant === 'dutch' ? 'bedrijf_id' : 'company_id'
    const companyMap = await mapCompanyNamesById(
      supabase as any,
      rows.map((row) => row[companyIdField] as number | null | undefined)
    )

    return NextResponse.json(
      rows.map((row) =>
        normalizeDealRow({
          ...row,
          companyName: companyMap.get(Number(row[companyIdField])) ?? null,
        })
      )
    )
  } catch (error) {
    console.error('Error fetching deals:', error)
    return NextResponse.json({ error: 'Kon deals niet laden.' }, { status: 500 })
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
    const validated = CreateDealSchema.parse({
      titel: body?.titel,
      bedrijf: body?.bedrijf,
      bedrijfId: body?.bedrijfId ?? body?.bedrijf_id,
      waarde: body?.waarde,
      stadium: body?.stadium,
      kans: body?.kans,
      deadline: body?.deadline,
    })

    const variant = await detectDealsSchemaVariant(supabase as any)

    const bedrijfId = await resolveCompanyId({
      supabase: supabase as any,
      companyName: validated.bedrijf,
      requestedCompanyId: validated.bedrijfId,
    })

    const insertPayload = buildInsertPayload(variant, {
      titel: validated.titel,
      waarde: validated.waarde,
      stadium: validated.stadium,
      kans: validated.kans,
      deadline: toIsoDate(validated.deadline),
      bedrijfId,
    })

    const insertResult = await (supabase as any)
      .from('deals')
      .insert([insertPayload])
      .select(selectColumnsForVariant(variant))
      .single()

    if (insertResult.error) throw insertResult.error

    const companyMap = await mapCompanyNamesById(
      supabase as any,
      [variant === 'dutch' ? (insertResult.data as any).bedrijf_id : (insertResult.data as any).company_id]
    )

    const companyName = companyMap.get(
      Number(variant === 'dutch' ? (insertResult.data as any).bedrijf_id : (insertResult.data as any).company_id)
    ) ?? null

    return NextResponse.json(
      normalizeDealRow({ ...insertResult.data, companyName }),
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validatiefout', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating deal:', error)
    return NextResponse.json({ error: 'Kon deal niet aanmaken.' }, { status: 500 })
  }
}
