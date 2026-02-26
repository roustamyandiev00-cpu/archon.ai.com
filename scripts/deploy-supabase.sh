#!/bin/bash

# Script to deploy Supabase Edge Functions and set secrets
# Requires Supabase CLI to be installed and logged in (supabase login)

echo "🚀 Starting Supabase Edge Function deployment..."

# Set project ID if not already set
PROJECT_ID=$(supabase target 2>/dev/null | grep -oE "[a-z0-9]{20}")
if [ -z "$PROJECT_ID" ]; then
  echo "❌ Error: No Supabase project linked. Run 'supabase link --project-ref your-project-ref' first."
  exit 1
fi

echo "✅ Linked to project: $PROJECT_ID"

# Set Secrets
echo "🔐 Setting secrets..."

# Load from .env.local if available
if [ -f .env.local ]; then
  STRIPE_SECRET_KEY=$(grep STRIPE_SECRET_KEY .env.local | cut -d '=' -f2)
  STRIPE_WEBHOOK_SECRET=$(grep STRIPE_WEBHOOK_SECRET .env.local | cut -d '=' -f2)
  CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)
  
  if [ ! -z "$STRIPE_SECRET_KEY" ]; then
    supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
  fi
  
  if [ ! -z "$STRIPE_WEBHOOK_SECRET" ]; then
    supabase secrets set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"
  fi

  if [ ! -z "$CRON_SECRET" ]; then
    supabase secrets set CRON_SECRET="$CRON_SECRET"
  fi
fi

# Deploy Functions
echo "deploying stripe-webhook..."
supabase functions deploy stripe-webhook --no-verify-jwt

echo "deploying generate-monthly-invoices..."
supabase functions deploy generate-monthly-invoices --no-verify-jwt

echo "✅ Deployment complete!"
echo "📍 Webhook URL for Stripe: https://$PROJECT_ID.supabase.co/functions/v1/stripe-webhook"
