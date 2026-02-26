
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
})

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!

serve(async (req) => {
  const signature = req.headers.get("stripe-signature")!
  const body = await req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  const data = event.data.object

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = data as any
      const { userId, planId, billingCycle } = session.metadata || {}

      if (userId) {
        // Update user_subscriptions
        const { error: subError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            plan: planId || 'starter',
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })

        if (subError) console.error('Error updating subscription:', subError)

        // Update user tier
        await supabase
          .from('users')
          .update({ 
            subscription_tier: planId || 'starter',
            is_blocked: false 
          })
          .eq('id', userId)
      }
      break
    }

    case 'invoice.paid': {
      const stripeInvoice = data as any
      const customerId = stripeInvoice.customer
      
      // Find subscription by customer ID
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('user_id, plan')
        .eq('stripe_customer_id', customerId)
        .single()

      if (subData) {
        // Create internal invoice
        const { error: invError } = await supabase
          .from('invoices')
          .insert({
            user_id: subData.user_id,
            period_start: new Date(stripeInvoice.period_start * 1000).toISOString(),
            period_end: new Date(stripeInvoice.period_end * 1000).toISOString(),
            amount_excl: stripeInvoice.amount_paid / 100,
            vat_rate: 21.00,
            status: 'paid',
            stripe_invoice_id: stripeInvoice.id,
            invoice_number: stripeInvoice.number,
            paid_at: new Date().toISOString()
          })

        if (invError) console.error('Error creating invoice:', invError)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = data as any
      await supabase
        .from('user_subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscription.id)
      
      // Optionally fallback user to free tier
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single()
      
      if (subData) {
        await supabase
          .from('users')
          .update({ subscription_tier: 'free' })
          .eq('id', subData.user_id)
      }
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  })
})
