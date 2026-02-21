export const projectStatusValues = ['Actief', 'On Hold', 'Afgerond'] as const

export type ProjectStatus = (typeof projectStatusValues)[number]

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
