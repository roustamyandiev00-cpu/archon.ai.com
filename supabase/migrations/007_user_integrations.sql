-- User Integrations table for per-user app connections (Slack, Google Calendar, etc.)
CREATE TABLE IF NOT EXISTS user_integrations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL CHECK (provider IN (
    'slack', 'google_calendar', 'microsoft_teams', 'dropbox', 
    'zapier', 'quickbooks', 'notion', 'trello', 'asana', 'hubspot'
  )),
  is_enabled BOOLEAN DEFAULT FALSE,
  is_connected BOOLEAN DEFAULT FALSE,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_provider ON user_integrations(provider);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_user_integrations_updated_at ON user_integrations;
CREATE TRIGGER update_user_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own integrations
CREATE POLICY "Users can view own integrations" ON user_integrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own integrations" ON user_integrations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own integrations" ON user_integrations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own integrations" ON user_integrations
  FOR DELETE USING (user_id = auth.uid());

-- Insert default integrations for all existing users (disabled by default)
INSERT INTO user_integrations (user_id, provider, is_enabled, is_connected, settings)
SELECT 
  id as user_id,
  provider,
  FALSE as is_enabled,
  FALSE as is_connected,
  '{}' as settings
FROM auth.users
CROSS JOIN (VALUES 
  ('slack'), ('google_calendar'), ('microsoft_teams'), ('dropbox'), 
  ('zapier'), ('quickbooks')
) AS t(provider)
ON CONFLICT (user_id, provider) DO NOTHING;

-- Function to auto-create integrations for new users
CREATE OR REPLACE FUNCTION create_default_user_integrations()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_integrations (user_id, provider, is_enabled, is_connected)
  VALUES 
    (NEW.id, 'slack', FALSE, FALSE),
    (NEW.id, 'google_calendar', FALSE, FALSE),
    (NEW.id, 'microsoft_teams', FALSE, FALSE),
    (NEW.id, 'dropbox', FALSE, FALSE),
    (NEW.id, 'zapier', FALSE, FALSE),
    (NEW.id, 'quickbooks', FALSE, FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create integrations for new users
DROP TRIGGER IF EXISTS trigger_create_user_integrations ON auth.users;
CREATE TRIGGER trigger_create_user_integrations
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_integrations();
