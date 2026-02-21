import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  mapCompanyNamesById,
  resolveCompanyId,
} from '@/app/api/finance/finance-utils'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

import {
  combineDateAndTime,
  normalizeAfspraakRow,
  normalizeDeelnemers,
  parseNumericId,
} from '../afspraak-utils'

const UpdateAfspraakSchema = z.object({
  titel: z.string().trim().min(1).optional(),
  beschrijving: z.string().trim().nullable().optional(),
  datum: z.string().optional(),
  startTijd: z.string().optional(),
  eindTijd: z.string().nullable().optional(),
  locatie: z.string().trim().nullable().optional(),
  deelnemers: z.array(z.string()).optional(),
  bedrijf: z.string().trim().nullable().optional(),
  bedrijfId: z.coerce.number().int().positive().nullable().optional(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

const afspraakSelect = 'id, titel, beschrijving, start_tijd, eind_tijd, locatie, deelnemers, bedrijf_id, created_at'

async function getCurrentEvent(supabase: any, id: number) {
  const result = await supabase
    .from('afspraken')
    .select('id, start_tijd, eind_tijd')
    .eq('id', id)
    .maybeSingle()

  if (result.error) throw result.error
  return result.data
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: rawId } = await context.params
  const id = parseNumericId(rawId)

  if (id == null) {
    return NextResponse.json({ error: 'Ongeldig afspraak-ID.' }, { status: 400 })
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
    const validated = UpdateAfspraakSchema.parse({
      titel: body?.titel,
      beschrijving: body?.beschrijving,
      datum: body?.datum,
      startTijd: body?.startTijd,
      eindTijd: body?.eindTijd,
      locatie: body?.locatie,
      deelnemers: normalizeDeelnemers(body?.deelnemers),
      bedrijf: body?.bedrijf,
      bedrijfId: body?.bedrijfId ?? body?.bedrijf_id,
    })

    const updateData: Record<string, unknown> = {}

    if (validated.titel !== undefined) updateData.titel = validated.titel
    if (validated.beschrijving !== undefined) updateData.beschrijving = validated.beschrijving || null
    if (validated.locatie !== undefined) updateData.locatie = validated.locatie || null
    if (validated.deelnemers !== undefined) updateData.deelnemers = validated.deelnemers

    const currentEvent =
      validated.datum !== undefined || validated.startTijd !== undefined || validated.eindTijd !== undefined
        ? await getCurrentEvent(supabase as any, id)
        : null

    if ((validated.datum !== undefined || validated.startTijd !== undefined) && !currentEvent) {
      return NextResponse.json({ error: 'Afspraak niet gevonden.' }, { status: 404 })
    }

    if (validated.datum !== undefined || validated.startTijd !== undefined) {
      const baseStart = currentEvent?.start_tijd ? new Date(currentEvent.start_tijd as string) : new Date()

      const date = validated.datum ?? baseStart.toISOString().slice(0, 10)
      const startTime = validated.startTijd ?? baseStart.toISOString().slice(11, 16)

      const startTimestamp = combineDateAndTime(date, startTime)
      if (!startTimestamp) {
        return NextResponse.json({ error: 'Ongeldige startdatum of starttijd.' }, { status: 400 })
      }
      updateData.start_tijd = startTimestamp

      if (validated.eindTijd !== undefined) {
        updateData.eind_tijd = validated.eindTijd ? combineDateAndTime(date, validated.eindTijd) : null
      }
    } else if (validated.eindTijd !== undefined) {
      const baseStart = currentEvent?.start_tijd ? new Date(currentEvent.start_tijd as string) : new Date()
      const date = baseStart.toISOString().slice(0, 10)
      updateData.eind_tijd = validated.eindTijd ? combineDateAndTime(date, validated.eindTijd) : null
    }

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
      .from('afspraken')
      .update(updateData)
      .eq('id', id)
      .select(afspraakSelect)
      .maybeSingle()

    if (result.error) throw result.error
    if (!result.data) return NextResponse.json({ error: 'Afspraak niet gevonden.' }, { status: 404 })

    const companyMap = await mapCompanyNamesById(supabase as any, [(result.data as any).bedrijf_id])

    return NextResponse.json(
      normalizeAfspraakRow({
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

    console.error('Error updating afspraak:', error)
    return NextResponse.json({ error: 'Kon afspraak niet bijwerken.' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params
  const id = parseNumericId(rawId)

  if (id == null) {
    return NextResponse.json({ error: 'Ongeldig afspraak-ID.' }, { status: 400 })
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
      .from('afspraken')
      .delete()
      .eq('id', id)

    if (result.error) throw result.error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting afspraak:', error)
    return NextResponse.json({ error: 'Kon afspraak niet verwijderen.' }, { status: 500 })
  }
}
