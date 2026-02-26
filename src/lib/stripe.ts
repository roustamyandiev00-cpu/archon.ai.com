import 'server-only'
import Stripe from 'stripe'

// ============================================
// Stripe Payment Service - Multi-Tenant SaaS
// ============================================
// Each user has their own Stripe configuration stored in user_settings table

import { getSupabaseAdmin } from './supabaseAdmin'
import { decrypt } from './encryption'

export type UserStripeConfig = {
  publishableKey: string
  secretKey: string
  webhookSecret: string
  testMode: boolean
}

// Get Stripe configuration for a specific user from database
export async function getUserStripeConfig(userId: string): Promise<UserStripeConfig | null> {
  const supabase = getSupabaseAdmin()
  
  const { data, error } = await (supabase
    .from('user_settings') as any)
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    console.warn(`No Stripe config found for user ${userId}`)
    return null
  }

  const settings = data as any
  const publishableKey = settings.stripe_publishable_key
  const encryptedSecretKey = settings.stripe_secret_key
  const encryptedWebhookSecret = settings.stripe_webhook_secret
  const testMode = settings.stripe_test_mode ?? true

  if (!publishableKey || !encryptedSecretKey) {
    return null
  }

  // Decrypt sensitive keys
  const secretKey = decrypt(encryptedSecretKey)
  const webhookSecret = encryptedWebhookSecret ? decrypt(encryptedWebhookSecret) : ''

  return {
    publishableKey,
    secretKey,
    webhookSecret,
    testMode,
  }
}

// Check if user has Stripe configured
export async function isUserStripeConfigured(userId: string): Promise<boolean> {
  const config = await getUserStripeConfig(userId)
  return config !== null && config.secretKey.startsWith('sk_')
}

// Check if using test mode
export async function isUserStripeTestMode(userId: string): Promise<boolean> {
  const config = await getUserStripeConfig(userId)
  return config?.secretKey.startsWith('sk_test_') ?? true
}

// Get Stripe client instance for a specific user
export async function getUserStripe(userId: string): Promise<Stripe | null> {
  const config = await getUserStripeConfig(userId)
  if (!config) return null

  return new Stripe(config.secretKey, {
    apiVersion: '2026-02-25.clover' as any,
  })
}

// ============================================
// Payment Intent (One-time payments)
// ============================================

export type CreatePaymentIntentParams = {
  userId: string
  amount: number // in cents (e.g., €10.00 = 1000)
  currency: string // e.g., 'eur', 'usd'
  description?: string
  metadata?: Record<string, string>
  customerId?: string
}

export type PaymentIntentResult = {
  success: boolean
  clientSecret?: string
  paymentIntentId?: string
  error?: string
}

export async function createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
  const { userId, ...rest } = params
  const stripe = await getUserStripe(userId)
  
  if (!stripe) {
    return { success: false, error: 'Stripe niet geconfigureerd. Configureer je Stripe instellingen in Instellingen.' }
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: rest.amount,
      currency: rest.currency,
      description: rest.description,
      metadata: rest.metadata,
      customer: rest.customerId,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return {
      success: true,
      clientSecret: paymentIntent.client_secret || undefined,
      paymentIntentId: paymentIntent.id,
    }
  } catch (error: any) {
    console.error('Failed to create payment intent:', error)
    return { success: false, error: error?.message || 'Onbekende fout' }
  }
}

// ============================================
// Customer Management
// ============================================

export type CreateCustomerParams = {
  userId: string
  email: string
  name: string
  phone?: string
  metadata?: Record<string, string>
}

export async function createStripeCustomer(params: CreateCustomerParams): Promise<{ success: boolean; customerId?: string; error?: string }> {
  const { userId, ...rest } = params
  const stripe = await getUserStripe(userId)
  
  if (!stripe) {
    return { success: false, error: 'Stripe niet geconfigureerd' }
  }

  try {
    const customer = await stripe.customers.create({
      email: rest.email,
      name: rest.name,
      phone: rest.phone,
      metadata: rest.metadata,
    })

    return { success: true, customerId: customer.id }
  } catch (error: any) {
    console.error('Failed to create Stripe customer:', error)
    return { success: false, error: error?.message || 'Onbekende fout' }
  }
}

// ============================================
// Subscriptions (Recurring payments)
// ============================================

export type CreateSubscriptionParams = {
  userId: string
  customerId: string
  priceId: string // Stripe Price ID
  metadata?: Record<string, string>
  trialDays?: number
}

export async function createSubscription(params: CreateSubscriptionParams): Promise<{ 
  success: boolean
  subscriptionId?: string
  clientSecret?: string
  status?: string
  error?: string 
}> {
  const { userId, ...rest } = params
  const stripe = await getUserStripe(userId)
  
  if (!stripe) {
    return { success: false, error: 'Stripe niet geconfigureerd' }
  }

  try {
    const subscription = await stripe.subscriptions.create({
      customer: rest.customerId,
      items: [{ price: rest.priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: rest.metadata,
      trial_period_days: rest.trialDays,
    })

    const invoice = subscription.latest_invoice as Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent }
    const paymentIntent = invoice?.payment_intent

    return {
      success: true,
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret || undefined,
      status: subscription.status,
    }
  } catch (error: any) {
    console.error('Failed to create subscription:', error)
    return { success: false, error: error?.message || 'Onbekende fout' }
  }
}

export async function cancelSubscription(userId: string, subscriptionId: string): Promise<{ success: boolean; error?: string }> {
  const stripe = await getUserStripe(userId)
  
  if (!stripe) {
    return { success: false, error: 'Stripe niet geconfigureerd' }
  }

  try {
    await stripe.subscriptions.cancel(subscriptionId)
    return { success: true }
  } catch (error: any) {
    console.error('Failed to cancel subscription:', error)
    return { success: false, error: error?.message || 'Onbekende fout' }
  }
}

// ============================================
// Webhook Handling
// ============================================

export type WebhookEvent = {
  type: string
  data: {
    object: any
  }
}

export async function verifyWebhookSignature(userId: string, payload: string | Buffer, signature: string): Promise<Stripe.Event | null> {
  const config = await getUserStripeConfig(userId)
  
  if (!config?.webhookSecret) {
    console.error('Stripe webhook secret niet geconfigureerd')
    return null
  }

  const stripe = await getUserStripe(userId)
  if (!stripe) return null

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, config.webhookSecret)
    return event
  } catch (error: any) {
    console.error('Webhook signature verificatie mislukt:', error)
    return null
  }
}

// ============================================
// Invoice Payment Link
// ============================================

export type CreatePaymentLinkParams = {
  userId: string
  amount: number
  currency: string
  description: string
  invoiceNumber: string
  customerEmail?: string
  customerName?: string
  successUrl?: string
  cancelUrl?: string
}

export async function createPaymentLink(params: CreatePaymentLinkParams): Promise<{ 
  success: boolean
  paymentUrl?: string
  paymentLinkId?: string
  error?: string 
}> {
  const { userId, ...rest } = params
  const stripe = await getUserStripe(userId)
  
  if (!stripe) {
    return { success: false, error: 'Stripe niet geconfigureerd' }
  }

  try {
    // Create a product for this payment
    const product = await stripe.products.create({
      name: `Factuur ${rest.invoiceNumber}`,
      description: rest.description,
      metadata: {
        invoice_number: rest.invoiceNumber,
      },
    })

    // Create a price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: rest.amount,
      currency: rest.currency,
    })

    // Create payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: rest.successUrl || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/betalingen/success`,
        },
      },
      metadata: {
        invoice_number: rest.invoiceNumber,
        customer_email: rest.customerEmail || '',
        customer_name: rest.customerName || '',
      },
    })

    return {
      success: true,
      paymentUrl: paymentLink.url,
      paymentLinkId: paymentLink.id,
    }
  } catch (error: any) {
    console.error('Failed to create payment link:', error)
    return { success: false, error: error?.message || 'Onbekende fout' }
  }
}

// ============================================
// Convenience: Get Publishable Key for Frontend
// ============================================

export async function getUserStripePublishableKey(userId: string): Promise<string | null> {
  const config = await getUserStripeConfig(userId)
  return config?.publishableKey || null
}
