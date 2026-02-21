import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27' as any,
});

export async function POST(request: NextRequest) {
  try {
    const { email, userId, moduleName, priceId, moduleId } = await request.json();

    if (!email || !userId || !priceId) {
      return NextResponse.json({ error: 'Ontbrekende gegevens' }, { status: 400 });
    }

    // Maak een Stripe Checkout sessie aan met 14 dagen trial
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
