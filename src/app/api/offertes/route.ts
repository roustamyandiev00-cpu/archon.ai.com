import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { handleApiError, resolveCompanyId } from '@/lib/api-utils'
import logger from '@/lib/logger'
import {
  offerteAiSelect,
  offerteBaseSelect,
  offerteAiProviderValues,
  offerteDimensionUnitValues,
  generateOfferteNumber,
  mapUiStatusToDb,
  normalizeOfferteRow,
  type OfferteAiProvider,
  type OfferteDimensions,
  supportsOfferteAiColumns,
  toIsoDate,
  uiOfferteStatusValues,
} from './offerte-utils'
import { runOfferteAiAnalysis, uploadOffertePhotos } from './offerte-ai'

const optionalDimensionValue = z.preprocess((value) => {
  if (value == null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    return Number(trimmed.replace(',', '.'))
  }
  return value
}, z.number().positive('Afmeting moet groter zijn dan 0').max(100_000, 'Afmeting is te groot.').nullable())

const RoomSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  name: z.string().trim().min(1),
  description: z.string().optional(),
  length: optionalDimensionValue.default(null),
  width: optionalDimensionValue.default(null),
  height: optionalDimensionValue.default(null),
  area: optionalDimensionValue.default(null),
  volume: optionalDimensionValue.default(null),
  unit: z.string().optional(),
})

const DimensionsSchema = z
  .object({
    lengte: optionalDimensionValue.default(null),
    breedte: optionalDimensionValue.default(null),
    hoogte: optionalDimensionValue.default(null),
    eenheid: z.enum(offerteDimensionUnitValues).default('cm'),
    rooms: z.array(RoomSchema).optional(),
  })
  .transform((value) => {
    if (value.rooms && value.rooms.length > 0) {
       return {
         rooms: value.rooms.map(r => ({
           ...r,
           length: r.length,
           width: r.width,
           height: r.height,
           area: r.area,
           volume: r.volume,
         })),
         eenheid: value.eenheid,
       } satisfies OfferteDimensions
    }

    if (value.lengte == null && value.breedte == null && value.hoogte == null) {
      return null
    }

    return {
      lengte: value.lengte,
      breedte: value.breedte,
      hoogte: value.hoogte,
      eenheid: value.eenheid,
    } satisfies OfferteDimensions
  })

const CreateOfferteSchema = z.object({
  nummer: z.string().trim().min(1).optional(),
  klant: z.string().trim().min(1),
  bedrag: z.coerce.number().positive('Bedrag moet groter zijn dan 0'),
  datum: z.string().optional(),
  geldigTot: z.string().optional(),
  status: z.enum(uiOfferteStatusValues).default('Openstaand'),
  bedrijfId: z.coerce.number().int().positive().nullable().optional(),
  afmetingen: DimensionsSchema.optional(),
  aiProvider: z.enum(offerteAiProviderValues).optional(),
})

function readFormValue(value: FormDataEntryValue | null | undefined) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function parseFormDimensions(formData: FormData) {
  const rawJson = readFormValue(formData.get('afmetingen'))
  if (rawJson) {
    try {
      return JSON.parse(rawJson)
    } catch {
      throw new Error('Afmetingen JSON is ongeldig.')
    }
  }

  return {
    lengte: readFormValue(formData.get('lengte')),
    breedte: readFormValue(formData.get('breedte')),
    hoogte: readFormValue(formData.get('hoogte')),
    eenheid: readFormValue(formData.get('eenheid')),
  }
}

type ParsedCreateOfferteRequest = {
  payload: {
    nummer?: string
    klant?: string
    bedrag?: unknown
    datum?: string
    geldigTot?: string
    status?: string
    bedrijfId?: unknown
    afmetingen?: unknown
    aiProvider?: unknown
  }
  files: Array<{ file: File, roomId?: string }>
}

async function parseCreateOfferteRequest(request: Request): Promise<ParsedCreateOfferteRequest> {
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const files: Array<{ file: File, roomId?: string }> = []

    const globalFiles = [...formData.getAll('fotos'), ...formData.getAll('foto')]
      .filter((value): value is File => value instanceof File && value.size > 0)
    
    globalFiles.forEach(file => files.push({ file }))

    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.size > 0) {
        const match = key.match(/^room_photos_(.+)$/)
        if (match) {
          const roomId = match[1]
          files.push({ file: value, roomId })
        }
      }
    }

    return {
      payload: {
        nummer: readFormValue(formData.get('nummer')),
        klant: readFormValue(formData.get('klant')) ?? readFormValue(formData.get('bedrijf')),
        bedrag: readFormValue(formData.get('bedrag')),
        datum: readFormValue(formData.get('datum')),
        geldigTot:
          readFormValue(formData.get('geldigTot')) ??
          readFormValue(formData.get('geldig_tot')) ??
          readFormValue(formData.get('validtot')),
        status: readFormValue(formData.get('status')),
        bedrijfId: readFormValue(formData.get('bedrijfId')) ?? readFormValue(formData.get('bedrijf_id')),
        afmetingen: parseFormDimensions(formData),
        aiProvider: readFormValue(formData.get('aiProvider')) ?? readFormValue(formData.get('ai_provider')),
      },
      files,
    }
  }

  const body = await request.json()
  return {
    payload: {
      nummer: body?.nummer,
      klant: body?.klant ?? body?.bedrijf,
      bedrag: body?.bedrag,
      datum: body?.datum,
      geldigTot: body?.geldigTot ?? body?.geldig_tot ?? body?.validtot,
      status: body?.status,
      bedrijfId: body?.bedrijfId ?? body?.bedrijf_id,
      afmetingen: body?.afmetingen ?? body?.dimensions,
      aiProvider: body?.aiProvider ?? body?.ai_provider,
    },
    files: [],
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const supportsAi = await supportsOfferteAiColumns(supabase)

    const { data, error } = await supabase
      .from('offertes')
      .select(supportsAi ? offerteAiSelect : offerteBaseSelect)
      .order('created_at', { ascending: false })
      .limit(300)

    if (error) throw error

    return NextResponse.json((data ?? []).map(normalizeOfferteRow))
  } catch (error) {
    logger.apiError('/api/offertes', 'GET', error)
    return handleApiError(error, 'Kon offertes niet laden. Probeer het later opnieuw.')
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin()
    const supportsAi = await supportsOfferteAiColumns(supabase)
    const { payload, files } = await parseCreateOfferteRequest(request)

    const validated = CreateOfferteSchema.parse({
      nummer: payload.nummer,
      klant: payload.klant,
      bedrag: payload.bedrag,
      datum: payload.datum,
      geldigTot: payload.geldigTot,
      status: payload.status,
      bedrijfId: payload.bedrijfId,
      afmetingen: payload.afmetingen,
      aiProvider: payload.aiProvider,
    })

    if (!supportsAi && (files.length > 0 || validated.afmetingen != null)) {
      return NextResponse.json(
        { error: 'AI velden ontbreken in de database. Voer eerst migratie 003_offertes_ai_media.sql uit.' },
        { status: 409 }
      )
    }

    const today = new Date()
    const defaultValidUntil = new Date(today)
    defaultValidUntil.setDate(defaultValidUntil.getDate() + 14)

    const nummer = validated.nummer ?? generateOfferteNumber()
    const datum = toIsoDate(validated.datum, today)
    const geldigTot = toIsoDate(validated.geldigTot, defaultValidUntil)
    const bedrijfId = await resolveCompanyId({
      supabase,
      companyName: validated.klant,
      requestedCompanyId: validated.bedrijfId
    })

    const baseInsert = {
      nummer,
      klant: validated.klant,
      bedrag: validated.bedrag,
      datum,
      geldig_tot: geldigTot,
      status: mapUiStatusToDb(validated.status),
      bedrijf_id: bedrijfId,
    }

    const insertPayload = supportsAi
      ? {
          ...baseInsert,
          ai_fotos: [],
          ai_afmetingen: validated.afmetingen ?? {},
          ai_analyse: null,
          ai_analyse_status: 'Niet geanalyseerd',
          ai_analyse_fout: null,
          ai_analyse_at: null,
        }
      : baseInsert

    const insertResult = await (supabase
      .from('offertes') as any)
      .insert([insertPayload])
      .select(supportsAi ? offerteAiSelect : offerteBaseSelect)
      .single()

    if (insertResult.error) {
      const code = (insertResult.error as { code?: string }).code
      if (code === '23505') {
        return NextResponse.json(
          { error: `Offertenummer ${nummer} bestaat al.` },
          { status: 409 }
        )
      }
      throw insertResult.error
    }

    if (!supportsAi) {
      return NextResponse.json(normalizeOfferteRow(insertResult.data), { status: 201 })
    }

    const createdOfferteId = Number(insertResult.data.id)

    try {
      const photos = await uploadOffertePhotos(supabase, createdOfferteId, files)
      const analysis = await runOfferteAiAnalysis({
        nummer,
        klant: validated.klant,
        bedrag: validated.bedrag,
        dimensions: validated.afmetingen ?? null,
        photos,
      }, {
        provider: validated.aiProvider as OfferteAiProvider | undefined,
      })

      const updateResult = await (supabase
        .from('offertes') as any)
        .update({
          ai_fotos: photos,
          ai_afmetingen: validated.afmetingen ?? {},
          ai_analyse: analysis.analysis,
          ai_analyse_status: analysis.status,
          ai_analyse_fout: analysis.error,
          ai_analyse_at: analysis.analysis?.generatedAt ?? null,
        })
        .eq('id', createdOfferteId)
        .select(offerteAiSelect)
        .single()

      if (updateResult.error) throw updateResult.error

      return NextResponse.json(normalizeOfferteRow(updateResult.data), { status: 201 })
    } catch (error) {
      await supabase.from('offertes').delete().eq('id', createdOfferteId)
      throw error
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'De ingediende gegevens zijn ongeldig.', details: error.issues },
        { status: 400 }
      )
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'De ingediende gegevens zijn ongeldig.' }, { status: 400 })
    }
    if (error instanceof Error && error.message.includes('Afmetingen JSON is ongeldig')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    logger.apiError('/api/offertes', 'POST', error)
    return handleApiError(error, 'Kon offerte niet aanmaken. Probeer het later opnieuw.')
  }
}
