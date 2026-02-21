export function parseNumericId(rawId: string): number | null {
  const id = Number(rawId)
  if (!Number.isFinite(id) || id <= 0) return null
  return id
}

export function combineDateAndTime(dateValue: string, timeValue: string): string | null {
  const time = timeValue.length === 5 ? `${timeValue}:00` : timeValue
  const iso = `${dateValue}T${time}`
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

export function normalizeDeelnemers(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

export function normalizeAfspraakRow(row: any) {
  const company = Array.isArray(row?.bedrijven) ? row.bedrijven[0] : row?.bedrijven
  const companyName = row?.companyName ?? (company?.naam ? String(company.naam) : null)

  return {
    id: String(row.id),
    titel: String(row.titel ?? ''),
    beschrijving: row.beschrijving ? String(row.beschrijving) : null,
    startTijd: row.start_tijd ? String(row.start_tijd) : null,
    eindTijd: row.eind_tijd ? String(row.eind_tijd) : null,
    locatie: row.locatie ? String(row.locatie) : null,
    deelnemers: normalizeDeelnemers(row.deelnemers),
    bedrijf: companyName,
    bedrijfId: row.bedrijf_id == null ? null : Number(row.bedrijf_id),
    createdAt: row.created_at ? String(row.created_at) : null,
  }
}
