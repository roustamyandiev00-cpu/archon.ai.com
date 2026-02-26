let cachedSupportsArtikelUserScope: boolean | null = null

export function isMissingArtikelUserIdColumn(error: unknown): boolean {
 if (!error || typeof error !== 'object') return false

 const code = 'code' in error ? (error as { code?: string }).code : undefined
 const message = 'message' in error ? String((error as { message?: unknown }).message ?? '') : ''

 return code === '42703' && message.includes('artikelen.user_id')
}

export async function supportsArtikelUserScope(supabase: any): Promise<boolean> {
 if (cachedSupportsArtikelUserScope != null) return cachedSupportsArtikelUserScope

 const probe = await (supabase as any)
 .from('artikelen')
 .select('id, user_id')
 .limit(1)

 if (!probe.error) {
 cachedSupportsArtikelUserScope = true
 return true
 }

 if (isMissingArtikelUserIdColumn(probe.error)) {
 cachedSupportsArtikelUserScope = false
 return false
 }

 throw probe.error
}

export function normalizeArtikelRow(row: any) {
 return {
 id: String(row.id),
 naam: String(row.naam ?? ''),
 categorie: String(row.categorie ?? 'Diensten'),
 prijs: Number(row.prijs ?? 0),
 eenheid: String(row.eenheid ?? 'stuk'),
 voorraad: row.voorraad ? String(row.voorraad) : null,
 status: String(row.status ?? 'Actief'),
 beschrijving: row.beschrijving ? String(row.beschrijving) : null,
 createdAt: row.created_at ? String(row.created_at) : null,
 updatedAt: row.updated_at ? String(row.updated_at) : null,
 }
}
