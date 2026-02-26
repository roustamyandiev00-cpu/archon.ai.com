-- =====================================================
-- COMPLETE BILLING & MISSING TABLES MIGRATION
-- Merge van billing_setup + missing_tables met fixes
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Invoice numbering sequence (race-safe)
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;

-- =====================================================
-- 1. SUBSCRIPTION PLANS (vervangt plan_pricing)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL CHECK (slug IN ('basis', 'groei', 'premium', 'free', 'starter', 'pro', 'enterprise')),
    price_monthly numeric(10,2) NOT NULL DEFAULT 0,
    price_yearly numeric(10,2),
    features jsonb DEFAULT '[]',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Insert alle plan variants (Nederlands + Engels voor compatibiliteit)
INSERT INTO public.subscription_plans (name, slug, price_monthly, price_yearly, features) VALUES
('Gratis',    'free',       0.00,    0.00,   '["basic_crm"]'),
('Starter',   'starter',   29.99,  299.99,  '["basic_crm", "email_integration"]'),
('Pro',       'pro',       79.99,  799.99,  '["basic_crm", "email_integration", "advanced_reports", "api_access"]'),
('Enterprise','enterprise',199.99, 1999.99, '["basic_crm", "email_integration", "advanced_reports", "api_access", "white_label", "priority_support"]'),
('Basis',     'basis',     19.00,  190.00,  '["crm","offertes","agenda","artikelen","documenten"]'),
('Groei',     'groei',     39.00,  390.00,  '["crm","offertes","agenda","artikelen","documenten","facturen","projecten","inkomsten","betalingen"]'),
('Premium',   'premium',   69.00,  690.00,  '["crm","offertes","agenda","artikelen","documenten","facturen","projecten","inkomsten","betalingen","uitgaven","ai_assistant","timesheets","whatsapp","ai_inbox"]')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subscription_plans"
    ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "Service role manages subscription_plans"
    ON public.subscription_plans FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 2. USER SUBSCRIPTIONS (bijgewerkt voor code compatibiliteit)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id uuid REFERENCES public.subscription_plans(id),
    plan text CHECK (plan IN ('free','starter','pro','enterprise','basis','groei','premium')) DEFAULT 'free',
    status text CHECK (status IN ('active','trialing','canceled','past_due','incomplete','incomplete_expired','unpaid','cancelled','expired')) DEFAULT 'active',
    billing_cycle text CHECK (billing_cycle IN ('monthly','yearly')) DEFAULT 'monthly',
    stripe_customer_id text UNIQUE,
    stripe_subscription_id text UNIQUE,
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean DEFAULT false,
    cancelled_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Indexen
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON public.user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON public.user_subscriptions(stripe_customer_id);

-- RLS Policies
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription"
    ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to subscriptions"
    ON public.user_subscriptions FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 3. INVOICES (van originele billing_setup)
-- =====================================================
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

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_period_start ON public.invoices(period_start);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own invoices"
    ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to invoices"
    ON public.invoices FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 4. PAYMENT HISTORY (van missing_tables)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payment_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id text,
    stripe_payment_intent_id text UNIQUE,
    amount_paid integer NOT NULL DEFAULT 0,
    currency text DEFAULT 'eur',
    status text CHECK (status IN ('pending','paid','failed','refunded')) DEFAULT 'pending',
    invoice_pdf text,
    paid_at timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON public.payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON public.payment_history(created_at);

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own payment_history"
    ON public.payment_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages payment_history"
    ON public.payment_history FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 5. COMMUNICATION LOGS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.communication_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    channel text CHECK (channel IN ('email','whatsapp','telegram','sms')) NOT NULL,
    recipient text NOT NULL,
    subject text,
    body text,
    status text CHECK (status IN ('sent','delivered','failed','pending')) DEFAULT 'pending',
    error_message text,
    metadata jsonb DEFAULT '{}',
    sent_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_communication_logs_user_id ON public.communication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_channel ON public.communication_logs(channel);
CREATE INDEX IF NOT EXISTS idx_communication_logs_sent_at ON public.communication_logs(sent_at);

ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own communication_logs"
    ON public.communication_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages communication_logs"
    ON public.communication_logs FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 6. SUPPORT TICKETS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email text,
    subject text NOT NULL,
    status text CHECK (status IN ('open','in_progress','resolved','closed')) DEFAULT 'open',
    priority text CHECK (priority IN ('low','medium','high','urgent')) DEFAULT 'medium',
    telegram_message_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender text CHECK (sender IN ('user','admin','system')) NOT NULL,
    message text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own support_tickets"
    ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own support_tickets"
    ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role manages support_tickets"
    ON public.support_tickets FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users view own ticket_messages"
    ON public.support_ticket_messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()));
CREATE POLICY "Service role manages ticket_messages"
    ON public.support_ticket_messages FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 7. DOCUMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    storage_path text NOT NULL,
    mime_type text,
    size_bytes integer,
    bucket text DEFAULT 'user-assets',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own documents"
    ON public.documents FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 8. HELPER FUNCTIONS
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
-- 9. TRIGGERS
-- =====================================================

-- Auto-create subscription on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    free_plan_id uuid;
BEGIN
    -- Get the free plan id
    SELECT id INTO free_plan_id FROM public.subscription_plans WHERE slug = 'free' LIMIT 1;
    
    INSERT INTO public.user_subscriptions (user_id, plan_id, plan, status)
    VALUES (NEW.id, free_plan_id, 'free', 'active')
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

-- Drop bestaande triggers voor hercreatie
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
DROP TRIGGER IF EXISTS handle_updated_at_user_subscriptions ON public.user_subscriptions;
DROP TRIGGER IF EXISTS set_updated_at_subscription_plans ON public.subscription_plans;
DROP TRIGGER IF EXISTS set_updated_at_support_tickets ON public.support_tickets;
DROP TRIGGER IF EXISTS set_updated_at_documents ON public.documents;

-- Create triggers
CREATE TRIGGER on_auth_user_created_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_subscription();

CREATE TRIGGER handle_updated_at_user_subscriptions
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_subscription_plans
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_support_tickets
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_documents
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
