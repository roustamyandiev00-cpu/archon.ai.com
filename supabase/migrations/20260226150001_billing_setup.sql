-- =====================================================
-- COMPLETE BILLING SETUP - PER USER BILLING
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Invoice numbering sequence (race-safe)
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;

-- =====================================================
-- BILLING TABLES
-- =====================================================

-- User subscriptions (billing per user)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan text CHECK (plan IN ('free','starter','pro','enterprise')) DEFAULT 'free',
    status text CHECK (status IN ('active','trialing','canceled','past_due','incomplete','incomplete_expired','unpaid')) DEFAULT 'active',
    stripe_customer_id text UNIQUE,
    stripe_subscription_id text UNIQUE,
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Monthly invoices per user
CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period_start date NOT NULL,
    period_end date NOT NULL,
    amount_excl numeric(12,2) NOT NULL,
    vat_rate numeric(5,2) NOT NULL DEFAULT 21.00,
    vat_amount numeric(12,2) GENERATED ALWAYS AS (amount_excl * vat_rate / 100) STORED,
    amount_incl numeric(12,2) GENERATED ALWAYS AS (amount_excl + (amount_excl * vat_rate / 100)) STORED,
    currency text DEFAULT 'EUR',
    status text CHECK (status IN ('draft','open','paid','void','uncollectible')) DEFAULT 'open',
    stripe_invoice_id text UNIQUE,
    invoice_number text UNIQUE,
    issued_at timestamptz DEFAULT now(),
    paid_at timestamptz,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, period_start)
);

-- Plan pricing configuration
CREATE TABLE IF NOT EXISTS public.plan_pricing (
    plan text PRIMARY KEY CHECK (plan IN ('free','starter','pro','enterprise')),
    price_monthly numeric(10,2) NOT NULL,
    price_yearly numeric(10,2),
    features jsonb DEFAULT '[]',
    created_at timestamptz DEFAULT now()
);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_subscriptions 
        WHERE user_id = COALESCE(p_user_id, auth.uid())
        AND status IN ('active', 'trialing')
        AND (current_period_end IS NULL OR current_period_end > now())
    );
$$;

-- Generate next invoice number (race-safe)
CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_num bigint;
    invoice_num text;
BEGIN
    SELECT nextval('invoice_number_seq') INTO next_num;
    invoice_num := 'INV-' || EXTRACT(YEAR FROM now()) || '-' || LPAD(next_num::text, 6, '0');
    RETURN invoice_num;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-create subscription on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    INSERT INTO public.user_subscriptions (user_id, plan, status)
    VALUES (NEW.id, 'free', 'active')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_subscription();

DROP TRIGGER IF EXISTS handle_updated_at_user_subscriptions ON public.user_subscriptions;
CREATE TRIGGER handle_updated_at_user_subscriptions
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_pricing ENABLE ROW LEVEL SECURITY;

-- Users can only view their own subscription
CREATE POLICY "Users can view own subscription"
    ON public.user_subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role can modify subscriptions
CREATE POLICY "Service role full access to subscriptions"
    ON public.user_subscriptions
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can only view their own invoices
CREATE POLICY "Users can view own invoices"
    ON public.invoices
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role can create/modify invoices
CREATE POLICY "Service role full access to invoices"
    ON public.invoices
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Anyone can view pricing
CREATE POLICY "Anyone can view plan pricing"
    ON public.plan_pricing
    FOR SELECT
    USING (true);

-- Only service role can modify pricing
CREATE POLICY "Service role can modify pricing"
    ON public.plan_pricing
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- INSERT DEFAULT PRICING
-- =====================================================

INSERT INTO public.plan_pricing (plan, price_monthly, price_yearly, features) VALUES
('free', 0.00, 0.00, '["basic_crm"]'),
('starter', 29.99, 299.99, '["basic_crm", "email_integration"]'),
('pro', 79.99, 799.99, '["basic_crm", "email_integration", "advanced_reports", "api_access"]'),
('enterprise', 199.99, 1999.99, '["basic_crm", "email_integration", "advanced_reports", "api_access", "white_label", "priority_support"]')
ON CONFLICT (plan) DO NOTHING;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_period_start ON public.invoices(period_start);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);