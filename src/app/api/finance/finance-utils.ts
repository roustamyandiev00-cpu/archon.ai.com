export function parseNumericId(rawId: string): number | null {
  const id = Number(rawId)
  if (!Number.isFinite(id) || id <= 0) return null
  return id
}

export function toIsoDate(value: string | null | undefined, fallback = new Date()): string {
  if (!value) return fallback.toISOString().slice(0, 10)

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return fallback.toISOString().slice(0, 10)

  return parsed.toISOString().slice(0, 10)
}

export async function resolveCompanyId(params: {
  supabase: any
  companyName?: string | null
  requestedCompanyId?: number | null
  createIfMissing?: boolean
}): Promise<number | null> {
  const {
    supabase,
    companyName,
    requestedCompanyId,
    createIfMissing = true,
  } = params

  if (requestedCompanyId != null) return requestedCompanyId
  if (!companyName || !companyName.trim()) return null

  const trimmedName = companyName.trim()

  const existing = await supabase
    .from('bedrijven')
    .select('id')
    .ilike('naam', trimmedName)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (existing.error) throw existing.error
  if (existing.data?.id != null) return Number(existing.data.id)

  if (!createIfMissing) return null

  const created = await supabase
    .from('bedrijven')
    .insert([{ naam: trimmedName }])
    .select('id')
    .single()

  if (created.error) throw created.error

  return Number(created.data.id)
}

export async function mapCompanyNamesById(supabase: any, companyIds: Array<number | null | undefined>) {
  const ids = [...new Set(companyIds.filter((id): id is number => typeof id === 'number' && Number.isFinite(id)))]
  if (ids.length === 0) return new Map<number, string>()

  const { data, error } = await supabase
    .from('bedrijven')
    .select('id, naam')
    .in('id', ids)

  if (error) throw error

  return new Map<number, string>(
    ((data ?? []) as Array<{ id: number; naam: string }>).map((row) => [Number(row.id), String(row.naam)])
  )
}

function unpackCompany(row: any) {
  if (!row) return null
  if (Array.isArray(row.bedrijven)) return row.bedrijven[0] ?? null
  return row.bedrijven ?? null
}

export function normalizeInkomstRow(row: any) {
  const company = unpackCompany(row)
  const companyName = row?.companyName ?? (company?.naam ? String(company.naam) : null)

  return {
    id: String(row.id),
    titel: String(row.titel ?? row.omschrijving ?? `Inkomst ${row.id}`),
    omschrijving: row.omschrijving ? String(row.omschrijving) : null,
    bedrijf: companyName,
    bedrijfId: row.bedrijf_id == null ? null : Number(row.bedrijf_id),
    bedrag: Number(row.bedrag ?? 0),
    datum: row.datum ? String(row.datum).slice(0, 10) : null,
    categorie: row.categorie ? String(row.categorie) : null,
    betaalmethode: row.betaalmethode ? String(row.betaalmethode) : null,
    createdAt: row.created_at ? String(row.created_at) : null,
  }
}

export function normalizeUitgaveRow(row: any) {
  const company = unpackCompany(row)
  const companyName = row?.companyName ?? (company?.naam ? String(company.naam) : null)

  return {
    id: String(row.id),
    titel: String(row.titel ?? row.omschrijving ?? `Uitgave ${row.id}`),
    omschrijving: row.omschrijving ? String(row.omschrijving) : null,
    leverancier: row.leverancier ? String(row.leverancier) : null,
    bedrijf: companyName,
    bedrijfId: row.bedrijf_id == null ? null : Number(row.bedrijf_id),
    bedrag: Number(row.bedrag ?? 0),
    datum: row.datum ? String(row.datum).slice(0, 10) : null,
    categorie: row.categorie ? String(row.categorie) : null,
    betaalmethode: row.betaalmethode ? String(row.betaalmethode) : null,
    createdAt: row.created_at ? String(row.created_at) : null,
  }
}
