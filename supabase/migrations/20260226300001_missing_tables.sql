-- =====================================================
-- ONTBREKENDE TABELLEN MIGRATION
-- Tabellen die de code gebruikt maar nog niet bestaan
-- =====================================================

-- =====================================================
-- 1. SUBSCRIPTION_PLANS
-- (code gebruikt dit, migrations hadden alleen plan_pricing)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    price_monthly numeric(10,2) NOT NULL DEFAULT 0,
    price_yearly numeric(10,2),
    features jsonb DEFAULT '[]',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

INSERT INTO public.subscription_plans (name, slug, price_monthly, price_yearly, features) VALUES
('Basis',   'basis',   19.00,  190.00, '["crm","offertes","agenda","artikelen","documenten"]'),
('Groei',   'groei',   39.00,  390.00, '["crm","offertes","agenda","artikelen","documenten","facturen","projecten","inkomsten","betalingen"]'),
('Premium', 'premium', 69.00,  690.00, '["crm","offertes","agenda","artikelen","documenten","facturen","projecten","inkomsten","betalingen","uitgaven","ai_assistant","timesheets","whatsapp","ai_inbox"]')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subscription_plans"
    ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "Service role manages subscription_plans"
    ON public.subscription_plans FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 2. PAYMENT_HISTORY
-- (betalingen route gebruikt dit voor Stripe webhook data)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payment_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id text,
    stripe_payment_intent_id text UNIQUE,
    amount_paid integer NOT NULL DEFAULT 0, -- in centen (Stripe formaat)
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
-- 3. COMMUNICATION_LOGS
-- (communicatie via email/whatsapp/telegram loggen)
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
-- 4. SUPPORT_TICKETS & SUPPORT_TICKET_MESSAGES
-- (support module via Telegram)
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
-- 5. DOCUMENTS
-- (document metadata tabel - storage is via user-assets bucket)
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
-- 6. FIX: user_subscriptions - voeg subscription_plan_id toe
-- (subscriptions route doet JOIN op subscription_plans)
-- =====================================================
ALTER TABLE public.user_subscriptions
    ADD COLUMN IF NOT EXISTS subscription_plan_id uuid REFERENCES public.subscription_plans(id);

-- =====================================================
-- 7. UPDATED_AT TRIGGERS voor nieuwe tabellen
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS set_updated_at_subscription_plans ON public.subscription_plans;
CREATE TRIGGER set_updated_at_subscription_plans
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_support_tickets ON public.support_tickets;
CREATE TRIGGER set_updated_at_support_tickets
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_documents ON public.documents;
CREATE TRIGGER set_updated_at_documents
    BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
