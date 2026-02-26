export const projectStatusValues = ['Actief', 'On Hold', 'Afgerond'] as const

export type ProjectStatus = (typeof projectStatusValues)[number]

let cachedSupportsProjectUserScope: boolean | null = null

export function isMissingProjectUserIdColumn(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const code = 'code' in error ? (error as { code?: string }).code : undefined
  const message = 'message' in error ? String((error as { message?: unknown }).message ?? '') : ''

  return code === '42703' && message.includes('projecten.user_id')
}

export async function supportsProjectUserScope(supabase: any): Promise<boolean> {
  if (cachedSupportsProjectUserScope != null) return cachedSupportsProjectUserScope

  const probe = await (supabase as any)
    .from('projecten')
    .select('id, user_id')
    .limit(1)

  if (!probe.error) {
    cachedSupportsProjectUserScope = true
    return true
  }

  if (isMissingProjectUserIdColumn(probe.error)) {
    cachedSupportsProjectUserScope = false
    return false
  }

  throw probe.error
}

export function parseNumericId(rawId: string): number | null {
  const id = Number(rawId)
  if (!Number.isFinite(id) || id <= 0) return null
  return id
}

export function normalizeProjectRow(row: any) {
  const company = Array.isArray(row?.bedrijven) ? row.bedrijven[0] : row?.bedrijven
  const companyName = row?.companyName ?? (company?.naam ? String(company.naam) : null)

  return {
    id: String(row.id),
    naam: String(row.naam ?? ''),
    beschrijving: row.beschrijving ? String(row.beschrijving) : null,
    bedrijf: companyName,
    bedrijfId: row.bedrijf_id == null ? null : Number(row.bedrijf_id),
    status: (row.status ?? 'Actief') as ProjectStatus,
    voortgang: Number(row.voortgang ?? 0),
    deadline: row.deadline ? String(row.deadline).slice(0, 10) : null,
    budget: Number(row.budget ?? 0),
    budgetGebruikt: Number(row.budget_gebruikt ?? 0),
    createdAt: row.created_at ? String(row.created_at) : null,
  }
}
