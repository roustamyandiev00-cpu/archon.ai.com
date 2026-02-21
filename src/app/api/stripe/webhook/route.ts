import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(key, { apiVersion: '2025-01-27' as any });
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const supabase = getSupabase();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, moduleId } = session.metadata || {};

      if (userId && moduleId) {
        const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

        // Registreer het abonnement en de proefperiode
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          module_id: moduleId,
          status: 'trialing',
          start_date: new Date().toISOString(),
          end_date: trialEndDate,
          amount: session.amount_total ? session.amount_total / 100 : 0,
        });

        // Update de user tier en trial info
        const { data: moduleData } = await supabase.from('modules').select('slug').eq('id', moduleId).single();
        if (moduleData) {
          await supabase.from('users').update({ 
            subscription_tier: moduleData.slug,
            trial_ends_at: trialEndDate,
            is_blocked: false 
          }).eq('id', userId);
        }
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerEmail = invoice.customer_email;
      
      // Zoek de gebruiker op basis van email
      const { data: userData } = await supabase.from('users').select('id').eq('email', customerEmail).single();
      
      if (userData) {
        // Maak automatisch een factuur aan in jouw systeem (tabel: facturen)
        const invoiceNumber = `INV-${Date.now()}`;
        const amount = invoice.amount_paid / 100;
        const total = invoice.total / 100;
        const btw = total - amount;

        await supabase.from('facturen').insert({
          user_id: userData.id,
          nummer: invoiceNumber,
          klant: customerEmail,
          klant_email: customerEmail,
          bedrag: amount,
          btw_bedrag: btw,
          totaal_bedrag: total,
          status: 'Betaald',
          datum: new Date().toISOString(),
          verval_datum: new Date().toISOString(),
          betaald_op: new Date().toISOString(),
          betaal_methode: 'Creditcard (Stripe)',
          items: JSON.stringify([{
            id: '1',
            omschrijving: invoice.lines.data[0]?.description || 'Abonnement',
            aantal: 1,
            prijs: amount,
            btw: 21
          }]),
          timeline: JSON.stringify([{
            id: String(Date.now()),
            type: 'paid',
            date: new Date().toISOString(),
            description: 'Betaald via Stripe',
            user: 'Systeem'
          }]),
          herinneringen_verstuurd: 0,
          notities: `Stripe Invoice: ${invoice.id}`
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
