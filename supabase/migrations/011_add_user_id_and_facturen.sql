-- Migration: Add user_id to core tables for multi-tenancy and create missing facturen table
-- This is a CRITICAL security fix - all data was previously shared between users

-- ============================================
-- 1. Create missing facturen table
-- ============================================
CREATE TABLE IF NOT EXISTS facturen (
  id BIGSERIAL PRIMARY KEY,
  nummer VARCHAR(50) NOT NULL UNIQUE,
  klant VARCHAR(255) NOT NULL,
  bedrag DECIMAL(12, 2) NOT NULL DEFAULT 0,
  btw_bedrag DECIMAL(12, 2) DEFAULT 0,
  totaal_bedrag DECIMAL(12, 2) DEFAULT 0,
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  vervaldatum DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'concept' CHECK (status IN ('concept', 'verstuurd', 'betaald', 'verlopen')),
  bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL,
  contact_id BIGINT REFERENCES contacten(id) ON DELETE SET NULL,
  offerte_id BIGINT REFERENCES offertes(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notities TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger for facturen updated_at
DROP TRIGGER IF EXISTS update_facturen_updated_at ON facturen;
CREATE TRIGGER update_facturen_updated_at
  BEFORE UPDATE ON facturen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for facturen
CREATE INDEX IF NOT EXISTS idx_facturen_nummer ON facturen(nummer);
CREATE INDEX IF NOT EXISTS idx_facturen_datum ON facturen(datum);
CREATE INDEX IF NOT EXISTS idx_facturen_status ON facturen(status);
CREATE INDEX IF NOT EXISTS idx_facturen_user_id ON facturen(user_id);

-- Enable RLS for facturen
ALTER TABLE facturen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations for public" ON facturen;
CREATE POLICY "Allow authenticated select on facturen" ON facturen
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- 2. Add user_id to core tables for multi-tenancy
-- ============================================

-- Add user_id to bedrijven
ALTER TABLE bedrijven ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_bedrijven_user_id ON bedrijven(user_id);

-- Add user_id to contacten
ALTER TABLE contacten ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_contacten_user_id ON contacten(user_id);

-- Add user_id to deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals(user_id);

-- Add user_id to projecten
ALTER TABLE projecten ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_projecten_user_id ON projecten(user_id);

-- Add user_id to offertes
ALTER TABLE offertes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_offertes_user_id ON offertes(user_id);

-- Add user_id to inkomsten
ALTER TABLE inkomsten ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_inkomsten_user_id ON inkomsten(user_id);

-- Add user_id to uitgaven
ALTER TABLE uitgaven ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_uitgaven_user_id ON uitgaven(user_id);

-- Add user_id to betalingen
ALTER TABLE betalingen ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_betalingen_user_id ON betalingen(user_id);

-- Add user_id to afspraken
ALTER TABLE afspraken ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_afspraken_user_id ON afspraken(user_id);

-- Add user_id to artikelen
ALTER TABLE artikelen ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_artikelen_user_id ON artikelen(user_id);

-- Add user_id to timesheets (rename gebruiker_id to user_id for consistency)
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_timesheets_user_id ON timesheets(user_id);

-- ============================================
-- 3. Update RLS policies to filter by user_id
-- ============================================

-- Drop old policies and create new user-scoped policies

-- bedrijven
DROP POLICY IF EXISTS "Allow authenticated select on bedrijven" ON bedrijven;
CREATE POLICY "Users can manage own bedrijven" ON bedrijven
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- contacten
DROP POLICY IF EXISTS "Allow authenticated select on contacten" ON contacten;
CREATE POLICY "Users can manage own contacten" ON contacten
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- deals
DROP POLICY IF EXISTS "Allow authenticated select on deals" ON deals;
CREATE POLICY "Users can manage own deals" ON deals
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- projecten
DROP POLICY IF EXISTS "Allow authenticated select on projecten" ON projecten;
CREATE POLICY "Users can manage own projecten" ON projecten
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- offertes
DROP POLICY IF EXISTS "Allow authenticated select on offertes" ON offertes;
CREATE POLICY "Users can manage own offertes" ON offertes
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- inkomsten
DROP POLICY IF EXISTS "Allow authenticated select on inkomsten" ON inkomsten;
CREATE POLICY "Users can manage own inkomsten" ON inkomsten
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- uitgaven
DROP POLICY IF EXISTS "Allow authenticated select on uitgaven" ON uitgaven;
CREATE POLICY "Users can manage own uitgaven" ON uitgaven
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- betalingen
DROP POLICY IF EXISTS "Allow authenticated select on betalingen" ON betalingen;
CREATE POLICY "Users can manage own betalingen" ON betalingen
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- afspraken
DROP POLICY IF EXISTS "Allow authenticated select on afspraken" ON afspraken;
CREATE POLICY "Users can manage own afspraken" ON afspraken
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- artikelen
DROP POLICY IF EXISTS "Allow authenticated select on artikelen" ON artikelen;
CREATE POLICY "Users can manage own artikelen" ON artikelen
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- timesheets
DROP POLICY IF EXISTS "Allow authenticated select on timesheets" ON timesheets;
CREATE POLICY "Users can manage own timesheets" ON timesheets
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- facturen
CREATE POLICY "Users can manage own facturen" ON facturen
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- ============================================
-- 4. Add trial_notification_sent column to users if missing
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_notification_sent TIMESTAMP WITH TIME ZONE;

-- ============================================
-- NOTES:
-- - Existing data with user_id = NULL will be accessible to all users
--   This is intentional to allow migration of existing data
-- - After migrating existing data to specific users, remove the
--   "OR user_id IS NULL" clause from policies for strict multi-tenancy
-- ============================================
