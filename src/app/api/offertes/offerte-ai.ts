import { z } from 'zod'

import type {
  OfferteAiAnalysis,
  OfferteAiProvider,
  OfferteDimensions,
  OffertePhoto,
} from './offerte-utils'

export const OFFERTES_MEDIA_BUCKET = 'offerte-media'
const MAX_PHOTOS = 6
const MAX_SINGLE_FILE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const OpenAiAnalysisSchema = z.object({
  summary: z.string().trim().min(12).max(1_400),
  scope: z.array(z.string().trim().min(2).max(240)).max(8).default([]),
  recommendations: z.array(z.string().trim().min(2).max(280)).max(10).default([]),
  riskFlags: z.array(z.string().trim().min(2).max(240)).max(8).default([]),
  complexity: z.enum(['Laag', 'Middel', 'Hoog']).default('Middel'),
  confidence: z.number().min(0).max(1).default(0.6),
  estimatedCost: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
    currency: z.string().default('EUR'),
  }).optional(),
  materials: z.array(z.object({
    name: z.string(),
    quantity: z.union([z.number(), z.string()]),
    unit: z.string(),
  })).optional(),
})

type AnalyzeInput = {
  nummer: string
  klant: string
  bedrag: number
  dimensions: OfferteDimensions | null
  photos: OffertePhoto[]
}

type AnalyzeOptions = {
  provider?: OfferteAiProvider | 'auto'
}

function cleanFileName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[a-z0-9]{1,8}$/i, '')
  const baseName = withoutExtension.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-')
  const trimmed = baseName.replace(/^[-.]+|[-.]+$/g, '').slice(0, 80)
  return trimmed || 'offerte-foto'
}

function getFileExtension(file: File) {
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'

  const namePart = file.name.split('.').pop()?.toLowerCase()
  if (namePart && /^[a-z0-9]+$/.test(namePart)) return namePart

  return 'bin'
}

function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''

  const record = payload as Record<string, unknown>
  if (typeof record.output_text === 'string' && record.output_text.trim()) {
    return record.output_text.trim()
  }

  const output = Array.isArray(record.output) ? record.output : []
  const fragments: string[] = []

  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const content = Array.isArray((item as Record<string, unknown>).content)
      ? ((item as Record<string, unknown>).content as unknown[])
      : []

    for (const piece of content) {
      if (!piece || typeof piece !== 'object') continue
      const maybeText = (piece as Record<string, unknown>).text
      if (typeof maybeText === 'string' && maybeText.trim()) {
        fragments.push(maybeText.trim())
      }
    }
  }

  return fragments.join('\n').trim()
}

function extractGeminiText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const root = payload as Record<string, unknown>

  const candidates = Array.isArray(root.candidates) ? root.candidates : []
  const fragments: string[] = []

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue
    const content = (candidate as Record<string, unknown>).content
    if (!content || typeof content !== 'object') continue
    const parts = Array.isArray((content as Record<string, unknown>).parts)
      ? ((content as Record<string, unknown>).parts as unknown[])
      : []

    for (const part of parts) {
      if (!part || typeof part !== 'object') continue
      const text = (part as Record<string, unknown>).text
      if (typeof text === 'string' && text.trim()) {
        fragments.push(text.trim())
      }
    }
  }

  return fragments.join('\n').trim()
}

function extractJsonLikeBlock(rawText: string): string {
  const trimmed = rawText.trim()
  if (!trimmed) return ''

  try {
    JSON.parse(trimmed)
    return trimmed
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start === -1 || end <= start) return ''
    return trimmed.slice(start, end + 1)
  }
}

function hasDimensions(dimensions: OfferteDimensions | null) {
  if (!dimensions) return false
  return (
    dimensions.lengte != null ||
    dimensions.breedte != null ||
    dimensions.hoogte != null
  )
}

async function toGeminiInlinePart(photo: OffertePhoto) {
  const response = await fetch(photo.url, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Kon foto niet ophalen voor Gemini (${response.status}).`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')

  return {
    inline_data: {
      mime_type: photo.mimeType || 'image/jpeg',
      data: base64,
    },
  }
}

function toNumberString(value: number | null, unit: string) {
  if (value == null) return '-'
  return `${value.toLocaleString('nl-NL')} ${unit}`
}

function getEnvKey(name: string) {
  const key = process.env[name]?.trim()
  return key && key.length > 0 ? key : null
}

function getOpenAiKey() {
  return getEnvKey('OPENAI_API_KEY')
}

function getGeminiKey() {
  return getEnvKey('GEMINI_API_KEY')
}

function normalizeRequestedProvider(value: unknown): OfferteAiProvider | 'auto' {
  if (value === 'openai' || value === 'gemini') return value
  return 'auto'
}

function chooseProvider(requested: OfferteAiProvider | 'auto') {
  const openAiKey = getOpenAiKey()
  const geminiKey = getGeminiKey()

  if (requested === 'openai') {
    if (!openAiKey) return { error: 'OPENAI_API_KEY ontbreekt. Kies Gemini of configureer OpenAI.' as const }
    return { provider: 'openai' as const, apiKey: openAiKey }
  }

  if (requested === 'gemini') {
    if (!geminiKey) return { error: 'GEMINI_API_KEY ontbreekt. Kies OpenAI of configureer Gemini.' as const }
    return { provider: 'gemini' as const, apiKey: geminiKey }
  }

  if (geminiKey) return { provider: 'gemini' as const, apiKey: geminiKey }
  if (openAiKey) return { provider: 'openai' as const, apiKey: openAiKey }

  return {
    error: 'Geen AI provider geconfigureerd. Zet GEMINI_API_KEY of OPENAI_API_KEY.',
  } as const
}

async function analyzeWithOpenAi(input: AnalyzeInput, apiKey: string): Promise<OfferteAiAnalysis | null> {

  const model = process.env.OPENAI_VISION_MODEL?.trim() || 'gpt-4.1-mini'
  const dimensionsText = input.dimensions && 'rooms' in input.dimensions && Array.isArray((input.dimensions as any).rooms)
    ? (input.dimensions as any).rooms.map((r: any, i: number) =>
        `Ruimte ${i + 1} (${r.name}): ${toNumberString(r.length, r.unit || input.dimensions?.eenheid || 'cm')} x ${toNumberString(r.width, r.unit || input.dimensions?.eenheid || 'cm')} x ${toNumberString(r.height, r.unit || input.dimensions?.eenheid || 'cm')}`
      ).join('\n')
    : input.dimensions?.lengte != null || input.dimensions?.breedte != null || input.dimensions?.hoogte != null
      ? `Lengte: ${toNumberString(input.dimensions.lengte ?? null, input.dimensions.eenheid)}, breedte: ${toNumberString(input.dimensions.breedte ?? null, input.dimensions.eenheid)}, hoogte: ${toNumberString(input.dimensions.hoogte ?? null, input.dimensions.eenheid)}.`
      : 'Geen afmetingen opgegeven.'

  const prompt = [
    'Je bent een offerte-assistent voor technische inschattingen.',
    'Analyseer de beelden en afmetingen en geef een zakelijke samenvatting.',
    'Schat ook de materiaalkosten en benodigde materialen in.',
    'Antwoord als geldig JSON-object zonder markdown met exact dit schema:',
    '{"summary":"string","scope":["string"],"recommendations":["string"],"riskFlags":["string"],"complexity":"Laag|Middel|Hoog","confidence":0.0,"estimatedCost":{"min":0,"max":0,"currency":"EUR"},"materials":[{"name":"string","quantity":0,"unit":"string"}]}',
    `Offerte: ${input.nummer}, klant: ${input.klant}, bedrag: ${input.bedrag}.`,
    `Afmetingen: ${dimensionsText}`,
  ].join('\n')

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_output_tokens: 1200,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            ...input.photos.slice(0, MAX_PHOTOS).map((photo) => ({
              type: 'input_image',
              image_url: photo.url,
              detail: 'high',
            })),
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '')
    throw new Error(`OpenAI request mislukt (${response.status}): ${bodyText.slice(0, 180)}`)
  }

  const payload = await response.json()
  const rawText = extractResponseText(payload)
  const jsonBlock = extractJsonLikeBlock(rawText)
  if (!jsonBlock) return null

  const parsed = OpenAiAnalysisSchema.safeParse(JSON.parse(jsonBlock))
  if (!parsed.success) return null

  return {
    summary: parsed.data.summary,
    scope: parsed.data.scope,
    recommendations: parsed.data.recommendations,
    riskFlags: parsed.data.riskFlags,
    complexity: parsed.data.complexity,
    confidence: parsed.data.confidence,
    source: 'openai',
    generatedAt: new Date().toISOString(),
    estimatedCost: parsed.data.estimatedCost,
    materials: parsed.data.materials,
  }
}

async function analyzeWithGemini(input: AnalyzeInput, apiKey: string): Promise<OfferteAiAnalysis | null> {
  if (input.photos.length === 0) return null

  const model = process.env.GEMINI_VISION_MODEL?.trim() || 'gemini-1.5-flash'
  const dimensionsText = input.dimensions && 'rooms' in input.dimensions && Array.isArray((input.dimensions as any).rooms)
    ? (input.dimensions as any).rooms.map((r: any, i: number) =>
        `Ruimte ${i + 1} (${r.name}): ${toNumberString(r.length, r.unit || input.dimensions?.eenheid || 'cm')} x ${toNumberString(r.width, r.unit || input.dimensions?.eenheid || 'cm')} x ${toNumberString(r.height, r.unit || input.dimensions?.eenheid || 'cm')}`
      ).join('\n')
    : input.dimensions?.lengte != null || input.dimensions?.breedte != null || input.dimensions?.hoogte != null
      ? `Lengte: ${toNumberString(input.dimensions.lengte ?? null, input.dimensions.eenheid)}, breedte: ${toNumberString(input.dimensions.breedte ?? null, input.dimensions.eenheid)}, hoogte: ${toNumberString(input.dimensions.hoogte ?? null, input.dimensions.eenheid)}.`
      : 'Geen afmetingen opgegeven.'

  const prompt = [
    'Je bent een offerte-assistent voor technische inschattingen.',
    'Analyseer de beelden en afmetingen en geef een zakelijke samenvatting.',
    'Schat ook de materiaalkosten en benodigde materialen in.',
    'Antwoord als geldig JSON-object zonder markdown met exact dit schema:',
    '{"summary":"string","scope":["string"],"recommendations":["string"],"riskFlags":["string"],"complexity":"Laag|Middel|Hoog","confidence":0.0,"estimatedCost":{"min":0,"max":0,"currency":"EUR"},"materials":[{"name":"string","quantity":0,"unit":"string"}]}',
    `Offerte: ${input.nummer}, klant: ${input.klant}, bedrag: ${input.bedrag}.`,
    `Afmetingen: ${dimensionsText}`,
  ].join('\n')

  const inlineParts = await Promise.all(
    input.photos.slice(0, MAX_PHOTOS).map((photo) => toGeminiInlinePart(photo))
  )

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }, ...inlineParts],
          },
        ],
      }),
    }
  )

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '')
    throw new Error(`Gemini request mislukt (${response.status}): ${bodyText.slice(0, 180)}`)
  }

  const payload = await response.json()
  const rawText = extractGeminiText(payload)
  const jsonBlock = extractJsonLikeBlock(rawText)
  if (!jsonBlock) return null

  const parsed = OpenAiAnalysisSchema.safeParse(JSON.parse(jsonBlock))
  if (!parsed.success) return null

  return {
    summary: parsed.data.summary,
    scope: parsed.data.scope,
    recommendations: parsed.data.recommendations,
    riskFlags: parsed.data.riskFlags,
    complexity: parsed.data.complexity,
    confidence: parsed.data.confidence,
    source: 'gemini',
    generatedAt: new Date().toISOString(),
    estimatedCost: parsed.data.estimatedCost,
    materials: parsed.data.materials,
  }
}

export async function runOfferteAiAnalysis(input: AnalyzeInput, options: AnalyzeOptions = {}) {
  const hasInput = input.photos.length > 0 || hasDimensions(input.dimensions)
  if (!hasInput) {
    return {
      status: 'Niet geanalyseerd' as const,
      analysis: null,
      error: null,
    }
  }

  const requestedProvider = normalizeRequestedProvider(options.provider)
  const selection = chooseProvider(requestedProvider)

  if ('error' in selection) {
    return {
      status: 'Mislukt' as const,
      analysis: null,
      error: selection.error,
    }
  }

  try {
    const result = selection.provider === 'gemini'
      ? await analyzeWithGemini(input, selection.apiKey)
      : await analyzeWithOpenAi(input, selection.apiKey)

    if (result) {
      return {
        status: 'Voltooid' as const,
        analysis: result,
        error: null,
      }
    }

    return {
      status: 'Mislukt' as const,
      analysis: null,
      error: `${selection.provider === 'gemini' ? 'Gemini' : 'OpenAI'}-output kon niet gelezen worden als geldige analyse.`,
    }
  } catch (error: any) {
    return {
      status: 'Mislukt' as const,
      analysis: null,
      error: error?.message ?? `${selection.provider === 'gemini' ? 'Gemini' : 'OpenAI'}-analyse mislukt.`,
    }
  }
}

export function parsePhotoPathsFromRow(row: unknown) {
  if (!row || typeof row !== 'object') return [] as string[]

  const value = (row as Record<string, unknown>).ai_fotos
  const parsedValue =
    typeof value === 'string'
      ? (() => {
          try {
            return JSON.parse(value)
          } catch {
            return []
          }
        })()
      : value
  if (!Array.isArray(parsedValue)) return [] as string[]

  return parsedValue
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const path = (entry as Record<string, unknown>).path
      return typeof path === 'string' && path ? path : null
    })
    .filter((entry): entry is string => entry != null)
}

export async function removePhotoPaths(supabase: any, paths: string[]) {
  const safePaths = Array.from(new Set(paths.filter(Boolean)))
  if (safePaths.length === 0) return

  const { error } = await (supabase as any)
    .storage
    .from(OFFERTES_MEDIA_BUCKET)
    .remove(safePaths)

  if (error) {
    console.error('Kon offerte-foto\'s niet verwijderen uit storage:', error)
  }
}

export async function uploadOffertePhotos(supabase: any, offerteId: number, files: Array<{ file: File, roomId?: string }>) {
  const normalizedFiles = files.filter(({ file }) => file.size > 0)
  if (normalizedFiles.length === 0) {
    return [] as OffertePhoto[]
  }

  // Check max photos globally or per room? The previous limit was global 6.
  // The user prompt mentioned "Photo’s per ruimte (max 6, limiet...)".
  // If I have 5 rooms, 6 photos each = 30 photos.
  // I should probably relax the global limit or apply it per room.
  // For now, I'll relax the global limit to something higher like 50, but maybe keep per-room checks in frontend.
  // Let's set a safe global limit to avoid abuse.
  if (normalizedFiles.length > 50) {
    throw new Error(`Maximaal 50 foto's in totaal toegestaan.`)
  }

  const uploaded: OffertePhoto[] = []
  const uploadedPaths: string[] = []

  try {
    for (const [index, { file, roomId }] of normalizedFiles.entries()) {
      if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
        throw new Error(`Bestandstype niet ondersteund: ${file.type || file.name}`)
      }

      if (file.size > MAX_SINGLE_FILE_BYTES) {
        throw new Error(`Bestand ${file.name} is groter dan 5 MB.`)
      }

      const safeName = cleanFileName(file.name)
      const extension = getFileExtension(file)
      const objectPath = `${offerteId}/${Date.now()}-${index + 1}-${crypto.randomUUID()}-${safeName}.${extension}`

      const { error: uploadError } = await (supabase as any)
        .storage
        .from(OFFERTES_MEDIA_BUCKET)
        .upload(objectPath, file, {
          cacheControl: '3600',
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const publicUrlResponse = (supabase as any)
        .storage
        .from(OFFERTES_MEDIA_BUCKET)
        .getPublicUrl(objectPath)
      const publicUrl = publicUrlResponse?.data?.publicUrl

      if (!publicUrl) {
        throw new Error(`Kon publieke URL niet genereren voor ${file.name}.`)
      }

      uploaded.push({
        path: objectPath,
        url: publicUrl,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
        roomId,
      })
      uploadedPaths.push(objectPath)
    }

    return uploaded
  } catch (error) {
    await removePhotoPaths(supabase, uploadedPaths)
    throw error
  }
}
