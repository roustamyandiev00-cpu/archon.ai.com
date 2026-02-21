import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  const tables = [
    'bedrijven',
    'contacten',
    'deals',
    'projecten',
    'offertes',
    'inkomsten',
    'uitgaven',
    'artikelen',
    'timesheets',
    'betalingen',
    'afspraken',
    'abonnementen',
  ]

  let supabaseAdmin: ReturnType<typeof getSupabaseAdmin>
  try {
    supabaseAdmin = getSupabaseAdmin()
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Supabase admin client is not configured.',
        details: String((err as Error)?.message ?? err),
      },
      { status: 503 }
    )
  }

  const results = Object.fromEntries(
    await Promise.all(
      tables.map(async (table) => {
        try {
          const { data, error } = await supabaseAdmin.from(table).select('id').limit(1)
          if (error) {
            return [table, { ok: false, error: String(error.message ?? error) }]
          }
          return [table, { ok: true, example: data?.[0] ?? null }]
        } catch (err: unknown) {
          return [table, { ok: false, error: String((err as Error)?.message ?? err) }]
        }
      })
    )
  )

  return NextResponse.json({ results }, { status: 200 })
}
