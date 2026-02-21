export const uiOfferteStatusValues = ['Openstaand', 'Geaccepteerd', 'Afgewezen'] as const

export type UiOfferteStatus = (typeof uiOfferteStatusValues)[number]
export const offerteDimensionUnitValues = ['mm', 'cm', 'm'] as const
export type OfferteDimensionUnit = (typeof offerteDimensionUnitValues)[number]
export const offerteAiProviderValues = ['openai', 'gemini'] as const
export type OfferteAiProvider = (typeof offerteAiProviderValues)[number]
export const offerteAiStatusValues = [
  'Niet geanalyseerd',
  'Bezig',
  'Voltooid',
  'Fallback',
  'Mislukt',
] as const
export type OfferteAiStatus = (typeof offerteAiStatusValues)[number]

export interface OfferteRoom {
  id: string
  name: string
  description?: string
  length: number | null
  width: number | null
  height: number | null
  area: number | null // m2
  volume: number | null // m3
  unit?: string // e.g. 'm', 'cm'
}

export interface OfferteDimensions {
  // Legacy fields (optional) for backward compatibility
  lengte?: number | null
  breedte?: number | null
  hoogte?: number | null
  
  // New fields
  rooms?: OfferteRoom[]
  eenheid: OfferteDimensionUnit
}

export interface OffertePhoto {
  path: string
  url: string
  name: string
  size: number
  mimeType: string
  uploadedAt: string
  roomId?: string // Link to a specific room
}

export interface OfferteAiAnalysis {
  summary: string
  scope: string[]
  recommendations: string[]
  riskFlags: string[]
  complexity: 'Laag' | 'Middel' | 'Hoog'
  confidence: number
  source: 'openai' | 'gemini' | 'fallback'
  generatedAt: string
  estimatedCost?: {
    min: number
    max: number
    currency: string
  }
  materials?: Array<{
    name: string
    quantity: number | string
    unit: string
  }>
}

export const offerteBaseSelect = `
  id,
  nummer,
  klant,
  bedrag,
  datum,
  geldig_tot,
  status,
  bedrijf_id,
  created_at
`

export const offerteAiSelect = `
  id,
  nummer,
  klant,
  bedrag,
  datum,
  geldig_tot,
  status,
  bedrijf_id,
  ai_fotos,
  ai_afmetingen,
  ai_analyse,
  ai_analyse_status,
  ai_analyse_fout,
  ai_analyse_at,
  created_at
`

export function mapUiStatusToDb(status: UiOfferteStatus): 'Openstaand' | 'Geaccepteerd' | 'Afgewezen' {
  if (status === 'Geaccepteerd') return 'Geaccepteerd'
  if (status === 'Afgewezen') return 'Afgewezen'
  return 'Openstaand'
}

export function mapDbStatusToUi(status: string | null | undefined): UiOfferteStatus {
  if (status === 'Geaccepteerd') return 'Geaccepteerd'
  if (status === 'Afgewezen') return 'Afgewezen'
  return 'Openstaand'
}

export function toIsoDate(value: string | null | undefined, fallback: Date): string {
  if (!value) return fallback.toISOString().slice(0, 10)

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return fallback.toISOString().slice(0, 10)

  return parsed.toISOString().slice(0, 10)
}

export function generateOfferteNumber() {
  const year = new Date().getFullYear()
  const suffix = String(Date.now()).slice(-6)
  return `OFF-${year}-${suffix}`
}

export async function supportsOfferteAiColumns(supabase: any) {
  const probe = await (supabase as any)
    .from('offertes')
    .select('id, ai_fotos')
    .limit(1)

  if (!probe.error) return true

  const errorCode = (probe.error as { code?: string }).code
  if (errorCode === '42703') {
    return false
  }

  throw probe.error
}

function isDimensionUnit(value: unknown): value is OfferteDimensionUnit {
  return typeof value === 'string' && offerteDimensionUnitValues.includes(value as OfferteDimensionUnit)
}

function isAiStatus(value: unknown): value is OfferteAiStatus {
  return typeof value === 'string' && offerteAiStatusValues.includes(value as OfferteAiStatus)
}

function parseJsonField(value: unknown) {
  if (value == null) return null
  if (typeof value === 'object') return value
  if (typeof value !== 'string') return null

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function parsePositiveNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return null
}

function normalizeDimensions(value: unknown): OfferteDimensions | null {
  const parsed = parseJsonField(value)
  if (!parsed || typeof parsed !== 'object') return null

  const record = parsed as Record<string, unknown>
  const eenheid = isDimensionUnit(record.eenheid) ? record.eenheid : 'cm'
  
  // Check for new rooms structure
  if (Array.isArray(record.rooms)) {
    const rooms = record.rooms.map((r: any) => ({
      id: String(r.id || crypto.randomUUID()),
      name: String(r.name || 'Naamloze ruimte'),
      description: r.description ? String(r.description) : undefined,
      length: parsePositiveNumber(r.length),
      width: parsePositiveNumber(r.width),
      height: parsePositiveNumber(r.height),
      area: parsePositiveNumber(r.area),
      volume: parsePositiveNumber(r.volume),
    }))
    
    return { rooms, eenheid }
  }

  // Fallback to legacy single dimensions
  const lengte = parsePositiveNumber(record.lengte)
  const breedte = parsePositiveNumber(record.breedte)
  const hoogte = parsePositiveNumber(record.hoogte)

  if (lengte == null && breedte == null && hoogte == null) return null

  return { lengte, breedte, hoogte, eenheid }
}

function normalizePhotos(value: unknown): OffertePhoto[] {
  const parsed = parseJsonField(value)
  if (!Array.isArray(parsed)) return []

  return parsed
    .map((entry): OffertePhoto | null => {
      if (!entry || typeof entry !== 'object') return null

      const record = entry as Record<string, unknown>
      const path = typeof record.path === 'string' ? record.path : ''
      const url = typeof record.url === 'string' ? record.url : ''
      const name = typeof record.name === 'string' ? record.name : 'foto'
      const size = typeof record.size === 'number' && Number.isFinite(record.size) ? record.size : 0
      const mimeType = typeof record.mimeType === 'string' ? record.mimeType : 'application/octet-stream'
      const uploadedAt = typeof record.uploadedAt === 'string' ? record.uploadedAt : new Date().toISOString()
      const roomId = typeof record.roomId === 'string' ? record.roomId : undefined

      if (!path || !url) return null

      const photo: OffertePhoto = {
        path,
        url,
        name,
        size,
        mimeType,
        uploadedAt,
      }

      if (roomId) {
        photo.roomId = roomId
      }

      return photo
    })
    .filter((entry): entry is OffertePhoto => entry != null)
}

function normalizeAiAnalysis(value: unknown): OfferteAiAnalysis | null {
  const parsed = parseJsonField(value)
  if (!parsed || typeof parsed !== 'object') return null

  const record = parsed as Record<string, unknown>
  const summary = typeof record.summary === 'string' ? record.summary : ''
  if (!summary.trim()) return null

  const scope = Array.isArray(record.scope)
    ? record.scope.filter((entry): entry is string => typeof entry === 'string')
    : []
  const recommendations = Array.isArray(record.recommendations)
    ? record.recommendations.filter((entry): entry is string => typeof entry === 'string')
    : []
  const riskFlags = Array.isArray(record.riskFlags)
    ? record.riskFlags.filter((entry): entry is string => typeof entry === 'string')
    : []
  const complexity: OfferteAiAnalysis['complexity'] =
    record.complexity === 'Laag' || record.complexity === 'Hoog' ? record.complexity : 'Middel'
  const confidence =
    typeof record.confidence === 'number' && Number.isFinite(record.confidence)
      ? Math.max(0, Math.min(1, record.confidence))
      : 0.5
  const source: OfferteAiAnalysis['source'] =
    record.source === 'openai'
      ? 'openai'
      : record.source === 'gemini'
        ? 'gemini'
        : 'fallback'
  const generatedAt =
    typeof record.generatedAt === 'string' ? record.generatedAt : new Date().toISOString()

  const estimatedCost =
    record.estimatedCost && typeof record.estimatedCost === 'object'
      ? {
          min: Number((record.estimatedCost as any).min) || 0,
          max: Number((record.estimatedCost as any).max) || 0,
          currency: String((record.estimatedCost as any).currency || 'EUR'),
        }
      : undefined

  const materials = Array.isArray(record.materials)
    ? record.materials.map((m: any) => ({
        name: String(m.name || ''),
        quantity: m.quantity,
        unit: String(m.unit || ''),
      }))
    : undefined

  return {
    summary,
    scope,
    recommendations,
    riskFlags,
    complexity,
    confidence,
    source,
    generatedAt,
    estimatedCost,
    materials,
  }
}

export function normalizeOfferteRow(row: any) {
  return {
    id: String(row.id),
    nummer: String(row.nummer ?? ''),
    klant: String(row.klant ?? ''),
    bedrag: Number(row.bedrag ?? 0),
    datum: row.datum ? String(row.datum).slice(0, 10) : null,
    geldigTot: row.geldig_tot ? String(row.geldig_tot).slice(0, 10) : null,
    status: mapDbStatusToUi(row.status),
    bedrijfId: row.bedrijf_id == null ? null : Number(row.bedrijf_id),
    createdAt: row.created_at ? String(row.created_at) : null,
    fotos: row.ai_fotos ? normalizePhotos(row.ai_fotos) : [],
    afmetingen: row.ai_afmetingen ? normalizeDimensions(row.ai_afmetingen) : null,
    aiAnalyse: row.ai_analyse ? normalizeAiAnalysis(row.ai_analyse) : null,
    aiAnalyseStatus: isAiStatus(row.ai_analyse_status) ? row.ai_analyse_status : 'Niet geanalyseerd',
    aiAnalyseFout: row.ai_analyse_fout ? String(row.ai_analyse_fout) : null,
    aiAnalyseAt: row.ai_analyse_at ? String(row.ai_analyse_at) : null,
  }
}

export function parseNumericId(rawId: string): number | null {
  const parsed = Number(rawId)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}
