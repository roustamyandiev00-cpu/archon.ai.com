-- Migration: User Integrations table for per-user feature toggles
-- Created: 2025-01-21

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Integrations table
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- AI Features
  ai_assistant_enabled BOOLEAN DEFAULT false,
  ai_multimodal_enabled BOOLEAN DEFAULT false,
  ai_pdf_analysis_enabled BOOLEAN DEFAULT false,
  
  -- PDF & Document Features
  pdf_generation_enabled BOOLEAN DEFAULT false,
  pdf_templates_enabled BOOLEAN DEFAULT false,
  
  -- Email Integration
  email_sending_enabled BOOLEAN DEFAULT false,
  smtp_provider TEXT CHECK (smtp_provider IN ('gmail', 'outlook', 'custom')),
  smtp_gmail_user TEXT,
  smtp_gmail_password TEXT,
  smtp_outlook_user TEXT,
  smtp_outlook_password TEXT,
  smtp_custom_host TEXT,
  smtp_custom_port INTEGER,
  smtp_custom_user TEXT,
  smtp_custom_password TEXT,
  
  -- WhatsApp Integration
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_business_id TEXT,
  whatsapp_phone_number_id TEXT,
  whatsapp_access_token TEXT,
  
  -- Other Integrations
  stripe_enabled BOOLEAN DEFAULT false,
  stripe_secret_key TEXT,
  stripe_webhook_secret TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one row per user
  CONSTRAINT unique_user_integrations UNIQUE (user_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);

-- Enable RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own integration settings
CREATE POLICY "Users can view own integrations"
  ON user_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own integrations"
  ON user_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON user_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
  ON user_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to auto-create user integrations on signup
CREATE OR REPLACE FUNCTION create_user_integrations_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_integrations (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger on auth.users table (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'create_user_integrations_trigger'
  ) THEN
    CREATE TRIGGER create_user_integrations_trigger
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION create_user_integrations_on_signup();
  END IF;
END $$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert integrations for existing users (if any)
INSERT INTO user_integrations (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_integrations)
ON CONFLICT DO NOTHING;
