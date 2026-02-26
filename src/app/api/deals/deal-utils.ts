export const dealStageValues = [
'Lead',
'Gekwalificeerd',
'Voorstel',
'Onderhandeling',
'Gewonnen',
'Verloren',
] as const

export type DealStage = (typeof dealStageValues)[number]

export type DealsSchemaVariant ='dutch'|'english'

export function parseNumericId(rawId: string): number | null {
 const id = Number(rawId)
 if (!Number.isFinite(id) || id <= 0) return null
 return id
}

export function toIsoDate(value: string | null | undefined): string | null {
 if (!value) return null
 const parsed = new Date(value)
 if (Number.isNaN(parsed.getTime())) return null
 return parsed.toISOString().slice(0, 10)
}

export async function detectDealsSchemaVariant(supabase: any): Promise<DealsSchemaVariant> {
 // Database heeft Nederlandse kolommen: titel, waarde, stadium, etc.
 return'dutch'
}

export function selectColumnsForVariant(variant: DealsSchemaVariant) {
 // Database kolommen: id, titel, waarde, stadium, deadline, kans, bedrijf_id, created_at
 // notities bestaat NIET
 return'id, titel, waarde, stadium, deadline, kans, bedrijf_id, created_at'
}

export function normalizeDealRow(row: any) {
 const companyName = row?.companyName ?? null

 const companyIdRaw = row.bedrijf_id ?? row.company_id
 const titleRaw = row.titel ?? row.title
 const amountRaw = row.waarde ?? row.amount
 const stageRaw = row.stadium ?? row.stage
 const probabilityRaw = row.kans ?? row.probability
 const notesRaw = row.notities ?? row.notes
 const deadlineRaw = row.deadline ?? row.expected_close_date

 return {
 id: String(row.id),
 titel: String(titleRaw ??''),
 bedrijf: companyName,
 bedrijfId: companyIdRaw == null ? null : Number(companyIdRaw),
 waarde: Number(amountRaw ?? 0),
 stadium: (stageRaw ??'Lead') as DealStage,
 kans: Number(probabilityRaw ?? 0),
 deadline: deadlineRaw ? String(deadlineRaw).slice(0, 10) : null,
 notities: notesRaw ? String(notesRaw) : null,
 createdAt: row.created_at ? String(row.created_at) : null,
 }
}
