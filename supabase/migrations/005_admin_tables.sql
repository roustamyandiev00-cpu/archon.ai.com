-- Modules table for subscription management
CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY DEFAULT gen_random_id(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  features TEXT DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subscriptions table (links users to modules)
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_id(),
  user_id TEXT NOT NULL,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User integrations table
CREATE TABLE IF NOT EXISTS user_integrations (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  is_connected BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Add missing columns to users table if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
    ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_blocked') THEN
    ALTER TABLE users ADD COLUMN is_blocked BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_tier') THEN
    ALTER TABLE users ADD COLUMN subscription_tier TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tokens_used') THEN
    ALTER TABLE users ADD COLUMN tokens_used INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tokens_limit') THEN
    ALTER TABLE users ADD COLUMN tokens_limit INTEGER DEFAULT 1000;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_active') THEN
    ALTER TABLE users ADD COLUMN last_active TIMESTAMPTZ;
  END IF;
END $$;

-- RLS Policies for modules
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Modules are viewable by everyone" ON modules
  FOR SELECT USING (true);

CREATE POLICY "Modules are editable by admins only" ON modules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'ceo')
    )
  );

-- RLS Policies for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all subscriptions" ON subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'ceo')
    )
  );

-- RLS Policies for user_integrations
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own integrations" ON user_integrations
  FOR ALL USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_module_id ON subscriptions(module_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);

-- Insert default modules if not exist
INSERT INTO modules (name, slug, description, price, features, is_active, sort_order)
VALUES 
  ('Basis', 'basis', 'Perfect voor starters', 29.00, '["Onbeperkt gebruik","5 projecten","Email support"]', true, 1),
  ('Pro', 'pro', 'Voor groeiende bedrijven', 79.00, '["Onbeperkt gebruik","Onbeperkt projecten","Priority support","API toegang"]', true, 2),
  ('Enterprise', 'enterprise', 'Voor grote organisaties', 199.00, '["Alles van Pro","Dedicated support","Custom integraties","SLA garantie"]', true, 3)
ON CONFLICT (slug) DO NOTHING;

-- Insert default integrations for existing users
INSERT INTO user_integrations (user_id, provider, is_enabled, is_connected)
SELECT id, 'slack', false, false FROM users
ON CONFLICT (user_id, provider) DO NOTHING;

INSERT INTO user_integrations (user_id, provider, is_enabled, is_connected)
SELECT id, 'google_calendar', false, false FROM users
ON CONFLICT (user_id, provider) DO NOTHING;

INSERT INTO user_integrations (user_id, provider, is_enabled, is_connected)
SELECT id, 'microsoft_teams', false, false FROM users
ON CONFLICT (user_id, provider) DO NOTHING;

INSERT INTO user_integrations (user_id, provider, is_enabled, is_connected)
SELECT id, 'dropbox', false, false FROM users
ON CONFLICT (user_id, provider) DO NOTHING;

INSERT INTO user_integrations (user_id, provider, is_enabled, is_connected)
SELECT id, 'zapier', false, false FROM users
ON CONFLICT (user_id, provider) DO NOTHING;

INSERT INTO user_integrations (user_id, provider, is_enabled, is_connected)
SELECT id, 'quickbooks', false, false FROM users
ON CONFLICT (user_id, provider) DO NOTHING;
