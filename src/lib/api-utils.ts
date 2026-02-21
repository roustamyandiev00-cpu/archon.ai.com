import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from './supabaseAdmin'

export function handleApiError(error: unknown, message = 'Er is een fout opgetreden') {
  if (
    error instanceof Error &&
    (error.message.includes('Supabase admin keys') || error.message.includes('missing'))
  ) {
    return NextResponse.json(
      { error: 'Supabase admin client is niet geconfigureerd.' },
      { status: 503 }
    )
  }

  console.error(message, error)
  return NextResponse.json({ error: message }, { status: 500 })
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
