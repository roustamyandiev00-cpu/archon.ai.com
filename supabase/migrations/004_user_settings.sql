-- Add UserSettings table for per-user SMTP and Stripe configuration
-- This enables SaaS multi-tenant where each user has their own email and payment settings

-- First, ensure users table exists (it should from initial schema)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_settings table for per-user configuration
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Company info
  company_name TEXT,
  company_logo TEXT,

  -- SMTP Configuration (per user)
  smtp_provider TEXT CHECK (smtp_provider IN ('gmail', 'outlook', 'custom')),
  smtp_gmail_user TEXT,
  smtp_gmail_password TEXT, -- Should be encrypted
  smtp_outlook_user TEXT,
  smtp_outlook_password TEXT, -- Should be encrypted
  smtp_custom_host TEXT,
  smtp_custom_port INTEGER,
  smtp_custom_user TEXT,
  smtp_custom_password TEXT, -- Should be encrypted
  smtp_custom_from TEXT,
  email_from_name TEXT,
  email_from_address TEXT,

  -- Stripe Configuration (per user)
  stripe_publishable_key TEXT,
  stripe_secret_key TEXT, -- Should be encrypted
  stripe_webhook_secret TEXT,
  stripe_test_mode BOOLEAN DEFAULT TRUE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) for multi-tenant security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see and edit their own settings
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can delete own settings" ON user_settings
  FOR DELETE USING (user_id = auth.uid()::TEXT);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON user_settings TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
