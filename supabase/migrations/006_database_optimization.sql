-- =====================================================
-- Database Optimalisatie Migratie
-- Gegenereerd door database analyse
-- =====================================================

-- =====================================================
-- 1. PERFORMANCE: Ontbrekende indexes voor foreign keys
-- =====================================================

-- Afspraken
CREATE INDEX IF NOT EXISTS idx_afspraken_bedrijf_id ON public.afspraken(bedrijf_id);
CREATE INDEX IF NOT EXISTS idx_afspraken_contact_id ON public.afspraken(contact_id);

-- Artikelen
CREATE INDEX IF NOT EXISTS idx_artikelen_bedrijf_id ON public.artikelen(bedrijf_id);

-- Betalingen
CREATE INDEX IF NOT EXISTS idx_betalingen_bedrijf_id ON public.betalingen(bedrijf_id);
CREATE INDEX IF NOT EXISTS idx_betalingen_offerte_id ON public.betalingen(offerte_id);

-- Calendar events
CREATE INDEX IF NOT EXISTS idx_calendar_events_company_id ON public.calendar_events(company_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_contact_id ON public.calendar_events(contact_id);

-- Contacten
CREATE INDEX IF NOT EXISTS idx_contacten_bedrijf_id ON public.contacten(bedrijf_id);

-- Facturen
CREATE INDEX IF NOT EXISTS idx_facturen_bedrijf_id ON public.facturen(bedrijf_id);

-- Inkomsten
CREATE INDEX IF NOT EXISTS idx_inkomsten_bedrijf_id ON public.inkomsten(bedrijf_id);
CREATE INDEX IF NOT EXISTS idx_inkomsten_contact_id ON public.inkomsten(contact_id);

-- Tenant activity log
CREATE INDEX IF NOT EXISTS idx_tenant_activity_log_user_id ON public.tenant_activity_log(user_id);

-- Uitgaven
CREATE INDEX IF NOT EXISTS idx_uitgaven_bedrijf_id ON public.uitgaven(bedrijf_id);

-- User onboarding
CREATE INDEX IF NOT EXISTS idx_user_onboarding_selected_plan_id ON public.user_onboarding(selected_plan_id);

-- =====================================================
-- 2. PERFORMANCE: Verwijder dubbele indexes
-- =====================================================

DROP INDEX IF EXISTS public.idx_user_subscriptions_provider_subscription_id;
DROP INDEX IF EXISTS public.idx_user_subscriptions_user_id;

-- =====================================================
-- 3. SECURITY: Beveilig functie search_path
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = p_user_id
    AND status IN ('active', 'trial')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_plan(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_plan TEXT;
BEGIN
  SELECT sp.name INTO v_plan
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id
  AND us.status IN ('active', 'trial')
  LIMIT 1;
  
  RETURN COALESCE(v_plan, 'free');
END;
$$;

CREATE OR REPLACE FUNCTION public.check_feature_access(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_modules JSONB;
BEGIN
  SELECT COALESCE(sp.modules, '[]'::jsonb) INTO v_modules
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id
  AND us.status IN ('active', 'trial')
  LIMIT 1;
  
  RETURN p_feature IN (SELECT jsonb_array_elements_text(v_modules));
END;
$$;

CREATE OR REPLACE FUNCTION public.user_has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = p_user_id
    AND status IN ('active', 'trial')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.user_active_modules(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_modules JSONB;
BEGIN
  SELECT COALESCE(sp.modules, '[]'::jsonb) INTO v_modules
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id
  AND us.status IN ('active', 'trial')
  LIMIT 1;
  
  RETURN v_modules;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_usage_limit(p_user_id UUID, p_limit_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_limits JSONB;
  v_limit_value INTEGER;
  v_current_usage INTEGER;
BEGIN
  -- Haal limieten op
  SELECT COALESCE(sp.limits, '{}'::jsonb) INTO v_limits
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id
  AND us.status IN ('active', 'trial')
  LIMIT 1;
  
  v_limit_value := (v_limits->p_limit_type)::INTEGER;
  
  IF v_limit_value IS NULL THEN
    RETURN TRUE; -- Geen limiet = onbeperkt
  END IF;
  
  -- Haal huidig gebruik op
  SELECT COUNT(*)::INTEGER INTO v_current_usage
  FROM public.usage_tracking
  WHERE user_id = p_user_id
  AND limit_type = p_limit_type
  AND created_at >= date_trunc('month', CURRENT_DATE);
  
  RETURN v_current_usage < v_limit_value;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_trial_subscription(p_user_id UUID, p_plan_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_subscription_id UUID;
  v_plan_id UUID;
BEGIN
  -- Gebruik opgegeven plan_id of haal starter plan
  IF p_plan_id IS NULL THEN
    SELECT id INTO v_plan_id FROM public.subscription_plans
    WHERE slug = 'starter' LIMIT 1;
  ELSE
    v_plan_id := p_plan_id;
  END IF;
  
  INSERT INTO public.user_subscriptions (user_id, plan_id, status, trial_ends_at, current_period_start, current_period_end)
  VALUES (
    p_user_id,
    v_plan_id,
    'trial',
    CURRENT_DATE + INTERVAL '14 days',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 month'
  )
  RETURNING id INTO v_subscription_id;
  
  RETURN v_subscription_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- =====================================================
-- 4. SECURITY: Verbeter RLS policies
-- =====================================================

-- Facturen: Vervang te ruime policy
DROP POLICY IF EXISTS "Allow all operations on facturen" ON public.facturen;

CREATE POLICY "Users can view own company facturen"
  ON public.facturen FOR SELECT
  USING (bedrijf_id IN (
    SELECT id FROM public.bedrijven WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own company facturen"
  ON public.facturen FOR INSERT
  WITH CHECK (bedrijf_id IN (
    SELECT id FROM public.bedrijven WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own company facturen"
  ON public.facturen FOR UPDATE
  USING (bedrijf_id IN (
    SELECT id FROM public.bedrijven WHERE user_id = auth.uid()
  ))
  WITH CHECK (bedrijf_id IN (
    SELECT id FROM public.bedrijven WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own company facturen"
  ON public.facturen FOR DELETE
  USING (bedrijf_id IN (
    SELECT id FROM public.bedrijven WHERE user_id = auth.uid()
  ));

-- Subscription invoices: Vervang te ruime policy
DROP POLICY IF EXISTS "System can insert subscription invoices" ON public.subscription_invoices;

CREATE POLICY "Users can view own subscription invoices"
  ON public.subscription_invoices FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage subscription invoices"
  ON public.subscription_invoices FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Usage tracking: Vervang te ruime policy
DROP POLICY IF EXISTS "System can manage usage tracking" ON public.usage_tracking;

CREATE POLICY "Users can view own usage tracking"
  ON public.usage_tracking FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own usage tracking"
  ON public.usage_tracking FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage usage tracking"
  ON public.usage_tracking FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 5. SECURITY: Voeg RLS policies toe voor tabellen zonder policies
-- =====================================================

-- AI Actions
CREATE POLICY "Users can view own AI actions"
  ON public.ai_actions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own AI actions"
  ON public.ai_actions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own AI actions"
  ON public.ai_actions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Tasks
CREATE POLICY "Users can view own tasks"
  ON public.tasks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tasks"
  ON public.tasks FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own tasks"
  ON public.tasks FOR DELETE
  USING (user_id = auth.uid());
