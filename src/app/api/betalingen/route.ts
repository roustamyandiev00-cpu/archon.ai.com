import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export interface Betaling {
  id: string
  userId: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  method: string
  paidAt: string | null
  createdAt: string
  invoiceUrl: string | null
}

export async function GET(request: Request) {
  let supabase: ReturnType<typeof getSupabaseAdmin>

  try {
    supabase = getSupabaseAdmin()
  } catch {
    return NextResponse.json(
      { error: 'Supabase admin client is niet geconfigureerd.' },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')

    let query = (supabase as any)
      .from('payment_history')
      .select('id, user_id, amount_paid, currency, status, invoice_pdf, paid_at, created_at, subscription_id')
      .order('created_at', { ascending: false })
      .limit(500)

    // Filter op datum
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // Filter op status
    if (status && status !== 'alle') {
      query = query.eq('status', status)
    }

    const result = await query

    if (result.error) throw result.error

    const betalingen: Betaling[] = (result.data ?? []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      amount: row.amount_paid / 100, // Stripe bedragen zijn in centen
      currency: row.currency?.toUpperCase() ?? 'EUR',
      status: row.status,
      method: 'stripe',
      paidAt: row.paid_at,
      createdAt: row.created_at,
      invoiceUrl: row.invoice_pdf,
    }))

    return NextResponse.json(betalingen)
  } catch (error) {
    console.error('Error fetching betalingen:', error)
    return NextResponse.json({ error: 'Kon betalingen niet laden.' }, { status: 500 })
  }
}
