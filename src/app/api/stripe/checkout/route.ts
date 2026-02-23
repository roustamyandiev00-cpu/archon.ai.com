import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUserFromRequest } from '@/lib/admin';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(key, { apiVersion: '2025-01-27' as any });
}

export async function POST(request: NextRequest) {
  try {
    // Auth check - user must be logged in
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { email, userId, moduleName, priceId, moduleId } = await request.json();

    // Security: Only allow checkout for own account
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 403 });
    }

    if (!email || !userId || !priceId) {
      return NextResponse.json({ error: 'Ontbrekende gegevens' }, { status: 400 });
    }

    // Maak een Stripe Checkout sessie aan met 14 dagen trial
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'ideal'],
      line_items: [
        {
          price: priceId, // Dit moet een Stripe Price ID zijn van de gekozen module
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: email,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          userId,
          moduleId,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/register?payment=cancelled`,
      metadata: {
        userId,
        moduleId,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
