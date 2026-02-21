import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

import {
  offerteAiSelect,
  offerteBaseSelect,
  offerteDimensionUnitValues,
  mapUiStatusToDb,
  normalizeOfferteRow,
  type OfferteDimensions,
  parseNumericId,
  supportsOfferteAiColumns,
  toIsoDate,
  uiOfferteStatusValues,
} from '../offerte-utils'
import { parsePhotoPathsFromRow, removePhotoPaths } from '../offerte-ai'

const optionalDimensionValue = z.preprocess((value) => {
  if (value == null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    return Number(trimmed.replace(',', '.'))
  }
  return value
}, z.number().positive('Afmeting moet groter zijn dan 0').max(100_000, 'Afmeting is te groot.').nullable())

const DimensionsSchema = z
  .object({
    lengte: optionalDimensionValue.default(null),
    breedte: optionalDimensionValue.default(null),
    hoogte: optionalDimensionValue.default(null),
    eenheid: z.enum(offerteDimensionUnitValues).default('cm'),
  })
  .transform((value) => {
    if (value.lengte == null && value.breedte == null && value.hoogte == null) {
      return null
    }

    return value satisfies OfferteDimensions
  })

const UpdateOfferteSchema = z.object({
  klant: z.string().trim().min(1).optional(),
  bedrag: z.coerce.number().positive().optional(),
  datum: z.string().optional(),
  geldigTot: z.string().optional(),
  status: z.enum(uiOfferteStatusValues).optional(),
  afmetingen: DimensionsSchema.optional(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: rawId } = await context.params
  const id = parseNumericId(rawId)

  if (id == null) {
    return NextResponse.json({ error: 'Ongeldig offerte-ID.' }, { status: 400 })
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
    const supportsAi = await supportsOfferteAiColumns(supabase as any)
    const body = await request.json()

    const validated = UpdateOfferteSchema.parse({
      klant: body?.klant,
      bedrag: body?.bedrag,
      datum: body?.datum,
      geldigTot: body?.geldigTot ?? body?.geldig_tot ?? body?.validtot,
      status: body?.status,
      afmetingen: body?.afmetingen ?? body?.dimensions,
    })

    if (!supportsAi && validated.afmetingen !== undefined) {
      return NextResponse.json(
        { error: 'AI velden ontbreken in de database. Voer eerst migratie 003_offertes_ai_media.sql uit.' },
        { status: 409 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (validated.klant !== undefined) updateData.klant = validated.klant
    if (validated.bedrag !== undefined) updateData.bedrag = validated.bedrag
    if (validated.datum !== undefined) updateData.datum = toIsoDate(validated.datum, new Date())
    if (validated.geldigTot !== undefined) updateData.geldig_tot = toIsoDate(validated.geldigTot, new Date())
    if (validated.status !== undefined) updateData.status = mapUiStatusToDb(validated.status)
    if (supportsAi && validated.afmetingen !== undefined) updateData.ai_afmetingen = validated.afmetingen ?? {}

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Geen wijzigingen opgegeven.' }, { status: 400 })
    }

    const result = await (supabase as any)
      .from('offertes')
      .update(updateData)
      .eq('id', id)
      .select(supportsAi ? offerteAiSelect : offerteBaseSelect)
      .maybeSingle()

    if (result.error) throw result.error
    if (!result.data) {
      return NextResponse.json({ error: 'Offerte niet gevonden.' }, { status: 404 })
    }

    return NextResponse.json(normalizeOfferteRow(result.data))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validatiefout', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating offerte:', error)
    return NextResponse.json({ error: 'Kon offerte niet bijwerken.' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params
  const id = parseNumericId(rawId)

  if (id == null) {
    return NextResponse.json({ error: 'Ongeldig offerte-ID.' }, { status: 400 })
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
    const supportsAi = await supportsOfferteAiColumns(supabase as any)
    const existing = await (supabase as any)
      .from('offertes')
      .select(supportsAi ? 'id, ai_fotos' : 'id')
      .eq('id', id)
      .maybeSingle()

    if (existing.error) throw existing.error
    if (!existing.data) {
      return NextResponse.json({ error: 'Offerte niet gevonden.' }, { status: 404 })
    }

    if (supportsAi) {
      const photoPaths = parsePhotoPathsFromRow(existing.data)
      await removePhotoPaths(supabase as any, photoPaths)
    }

    const result = await (supabase as any)
      .from('offertes')
      .delete()
      .eq('id', id)

    if (result.error) throw result.error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting offerte:', error)
    return NextResponse.json({ error: 'Kon offerte niet verwijderen.' }, { status: 500 })
  }
}
