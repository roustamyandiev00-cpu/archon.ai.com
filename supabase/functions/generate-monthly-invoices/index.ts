
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

serve(async (req) => {
  // Only allow POST or GET (depending on how it's triggered)
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
    // Optionally check for a cron secret if triggered via external cron
    const url = new URL(req.url)
    if (url.searchParams.get('secret') !== Deno.env.get('CRON_SECRET')) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  console.log('Starting monthly invoice generation...')

  // 1. Get all active subscriptions that are not 'free'
  const { data: subs, error: subError } = await supabase
    .from('user_subscriptions')
    .select(`
      user_id,
      plan,
      plan_pricing!inner (
        price_monthly
      )
    `)
    .neq('plan', 'free')
    .eq('status', 'active')

  if (subError) {
    console.error('Error fetching subscriptions:', subError)
    return new Response(JSON.stringify({ error: subError.message }), { status: 500 })
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const results = {
    total: subs.length,
    created: 0,
    skipped: 0,
    errors: 0,
    details: [] as any[]
  }

  for (const sub of subs) {
    try {
      // Check if invoice already exists for this period
      const { data: existing } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', sub.user_id)
        .eq('period_start', monthStart)
        .maybeSingle()

      if (existing) {
        results.skipped++
        continue
      }

      // Generate invoice number using the SQL function via RPC if possible, 
      // or just insert and let the database handle it if we set a default.
      // Since we don't have a default yet, we'll call the function via select.
      const { data: invoiceNumber } = await supabase.rpc('next_invoice_number')

      const { data: inv, error: invError } = await supabase
        .from('invoices')
        .insert({
          user_id: sub.user_id,
          period_start: monthStart,
          period_end: monthEnd,
          amount_excl: sub.plan_pricing.price_monthly,
          vat_rate: 21.00,
          status: 'open',
          invoice_number: invoiceNumber || `INV-${now.getFullYear()}-${Math.floor(Math.random() * 1000000)}`
        })
        .select()
        .single()

      if (invError) {
        console.error(`Error creating invoice for user ${sub.user_id}:`, invError)
        results.errors++
        results.details.push({ user_id: sub.user_id, error: invError.message })
      } else {
        results.created++
      }
    } catch (err) {
      console.error(`Unexpected error for user ${sub.user_id}:`, err)
      results.errors++
    }
  }

  console.log(`Finished: ${results.created} created, ${results.skipped} skipped, ${results.errors} errors.`)

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  })
})
