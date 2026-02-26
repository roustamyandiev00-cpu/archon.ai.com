-- ============================================
-- COMBINED MIGRATION FOR NEW SUPABASE PROJECT
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vqiyftyqfpfbpwhadpvn/sql
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bedrijven table
CREATE TABLE IF NOT EXISTS bedrijven (
  id BIGSERIAL PRIMARY KEY,
  naam VARCHAR(255) NOT NULL,
  adres TEXT,
  postcode VARCHAR(10),
  stad VARCHAR(100),
  email VARCHAR(255),
  telefoon VARCHAR(20),
  kvk VARCHAR(20),
  btw VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacten table
CREATE TABLE IF NOT EXISTS contacten (
  id BIGSERIAL PRIMARY KEY,
  voornaam VARCHAR(100) NOT NULL,
  achternaam VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  telefoon VARCHAR(20),
  bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL,
  functie VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
  id BIGSERIAL PRIMARY KEY,
  titel VARCHAR(255) NOT NULL,
  waarde DECIMAL(12, 2) DEFAULT 0,
  stadium VARCHAR(50) NOT NULL CHECK (stadium IN ('Lead', 'Gekwalificeerd', 'Voorstel', 'Onderhandeling', 'Gewonnen', 'Verloren')),
  bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL,
  contact_id BIGINT REFERENCES contacten(id) ON DELETE SET NULL,
  deadline DATE,
  kans INTEGER DEFAULT 50 CHECK (kans >= 0 AND kans <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projecten table
CREATE TABLE IF NOT EXISTS projecten (
  id BIGSERIAL PRIMARY KEY,
  naam VARCHAR(255) NOT NULL,
  beschrijving TEXT,
  bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Actief', 'On Hold', 'Afgerond')),
  voortgang INTEGER DEFAULT 0 CHECK (voortgang >= 0 AND voortgang <= 100),
  deadline DATE,
  budget DECIMAL(12, 2) DEFAULT 0,
  budget_gebruikt DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offertes table
CREATE TABLE IF NOT EXISTS offertes (
  id BIGSERIAL PRIMARY KEY,
  nummer VARCHAR(50) NOT NULL UNIQUE,
  klant VARCHAR(255) NOT NULL,
  bedrag DECIMAL(12, 2) NOT NULL,
  datum DATE NOT NULL,
  geldig_tot DATE NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Openstaand', 'Geaccepteerd', 'Afgewezen')),
  bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inkomsten table
CREATE TABLE IF NOT EXISTS inkomsten (
  id BIGSERIAL PRIMARY KEY,
  titel VARCHAR(255),
  omschrijving TEXT,
  bedrag DECIMAL(12,2) NOT NULL DEFAULT 0,
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL,
  contact_id BIGINT REFERENCES contacten(id) ON DELETE SET NULL,
  categorie VARCHAR(100),
  betaalmethode VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Uitgaven table
CREATE TABLE IF NOT EXISTS uitgaven (
  id BIGSERIAL PRIMARY KEY,
  titel VARCHAR(255),
  omschrijving TEXT,
  bedrag DECIMAL(12,2) NOT NULL DEFAULT 0,
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  leverancier VARCHAR(255),
  bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL,
  categorie VARCHAR(100),
  betaalmethode VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artikelen table
CREATE TABLE IF NOT EXISTS artikelen (
  id BIGSERIAL PRIMARY KEY,
  naam VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  beschrijving TEXT,
  prijs DECIMAL(12,2) DEFAULT 0,
  voorraad INTEGER DEFAULT 0,
  bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Timesheets table
CREATE TABLE IF NOT EXISTS timesheets (
  id BIGSERIAL PRIMARY KEY,
  gebruiker_id BIGINT,
  contact_id BIGINT REFERENCES contacten(id) ON DELETE SET NULL,
  project_id BIGINT REFERENCES projecten(id) ON DELETE SET NULL,
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  uren NUMERIC(5,2) NOT NULL DEFAULT 0,
  omschrijving TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Betalingen table
CREATE TABLE IF NOT EXISTS betalingen (
  id BIGSERIAL PRIMARY KEY,
  referentie VARCHAR(255),
  bedrag DECIMAL(12,2) NOT NULL DEFAULT 0,
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  betaalmethode VARCHAR(100),
  factuur_id BIGINT,
  offerte_id BIGINT REFERENCES offertes(id) ON DELETE SET NULL,
  bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Afspraken / Agenda table
CREATE TABLE IF NOT EXISTS afspraken (
  id BIGSERIAL PRIMARY KEY,
  titel VARCHAR(255) NOT NULL,
  beschrijving TEXT,
  start_tijd TIMESTAMP WITH TIME ZONE NOT NULL,
  eind_tijd TIMESTAMP WITH TIME ZONE,
  locatie VARCHAR(255),
  deelnemers JSONB,
  bedrijf_id BIGINT REFERENCES bedrijven(id) ON DELETE SET NULL,
  contact_id BIGINT REFERENCES contacten(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abonnementen table
CREATE TABLE IF NOT EXISTS abonnementen (
  id BIGSERIAL PRIMARY KEY,
  gebruiker_id BIGINT,
  plan VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('actief','opgezegd','inactief')),
  start_datum DATE,
  eind_datum DATE,
  prijs DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_bedrijven_updated_at ON bedrijven;
CREATE TRIGGER update_bedrijven_updated_at
  BEFORE UPDATE ON bedrijven
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contacten_updated_at ON contacten;
CREATE TRIGGER update_contacten_updated_at
  BEFORE UPDATE ON contacten
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projecten_updated_at ON projecten;
CREATE TRIGGER update_projecten_updated_at
  BEFORE UPDATE ON projecten
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_offertes_updated_at ON offertes;
CREATE TRIGGER update_offertes_updated_at
  BEFORE UPDATE ON offertes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inkomsten_updated_at ON inkomsten;
CREATE TRIGGER update_inkomsten_updated_at
  BEFORE UPDATE ON inkomsten
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_uitgaven_updated_at ON uitgaven;
CREATE TRIGGER update_uitgaven_updated_at
  BEFORE UPDATE ON uitgaven
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_artikelen_updated_at ON artikelen;
CREATE TRIGGER update_artikelen_updated_at
  BEFORE UPDATE ON artikelen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_timesheets_updated_at ON timesheets;
CREATE TRIGGER update_timesheets_updated_at
  BEFORE UPDATE ON timesheets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_betalingen_updated_at ON betalingen;
CREATE TRIGGER update_betalingen_updated_at
  BEFORE UPDATE ON betalingen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_afspraken_updated_at ON afspraken;
CREATE TRIGGER update_afspraken_updated_at
  BEFORE UPDATE ON afspraken
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_abonnementen_updated_at ON abonnementen;
CREATE TRIGGER update_abonnementen_updated_at
  BEFORE UPDATE ON abonnementen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bedrijven_naam ON bedrijven(naam);
CREATE INDEX IF NOT EXISTS idx_contacten_achternaam ON contacten(achternaam);
CREATE INDEX IF NOT EXISTS idx_deals_stadium ON deals(stadium);
CREATE INDEX IF NOT EXISTS idx_deals_bedrijf_id ON deals(bedrijf_id);
CREATE INDEX IF NOT EXISTS idx_projecten_status ON projecten(status);
CREATE INDEX IF NOT EXISTS idx_projecten_bedrijf_id ON projecten(bedrijf_id);
CREATE INDEX IF NOT EXISTS idx_offertes_status ON offertes(status);
CREATE INDEX IF NOT EXISTS idx_offertes_bedrijf_id ON offertes(bedrijf_id);
CREATE INDEX IF NOT EXISTS idx_inkomsten_datum ON inkomsten(datum);
CREATE INDEX IF NOT EXISTS idx_uitgaven_datum ON uitgaven(datum);
CREATE INDEX IF NOT EXISTS idx_artikelen_naam ON artikelen(naam);
CREATE INDEX IF NOT EXISTS idx_timesheets_gebruiker ON timesheets(gebruiker_id);
CREATE INDEX IF NOT EXISTS idx_betalingen_datum ON betalingen(datum);
CREATE INDEX IF NOT EXISTS idx_afspraken_start ON afspraken(start_tijd);
CREATE INDEX IF NOT EXISTS idx_abonnementen_status ON abonnementen(status);

-- Row Level Security (RLS) - Enable on all tables
ALTER TABLE bedrijven ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacten ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE projecten ENABLE ROW LEVEL SECURITY;
ALTER TABLE offertes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkomsten ENABLE ROW LEVEL SECURITY;
ALTER TABLE uitgaven ENABLE ROW LEVEL SECURITY;
ALTER TABLE artikelen ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE betalingen ENABLE ROW LEVEL SECURITY;
ALTER TABLE afspraken ENABLE ROW LEVEL SECURITY;
ALTER TABLE abonnementen ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
-- Bedrijven
DROP POLICY IF EXISTS "Enable all operations for public" ON bedrijven;
CREATE POLICY "Allow authenticated select on bedrijven" ON bedrijven
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert on bedrijven" ON bedrijven
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on bedrijven" ON bedrijven
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on bedrijven" ON bedrijven
  FOR DELETE USING (auth.role() = 'authenticated');

-- Contacten
DROP POLICY IF EXISTS "Enable all operations for public" ON contacten;
CREATE POLICY "Allow authenticated select on contacten" ON contacten
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert on contacten" ON contacten
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on contacten" ON contacten
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on contacten" ON contacten
  FOR DELETE USING (auth.role() = 'authenticated');

-- Deals
DROP POLICY IF EXISTS "Enable all operations for public" ON deals;
CREATE POLICY "Allow authenticated select on deals" ON deals
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert on deals" ON deals
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on deals" ON deals
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on deals" ON deals
  FOR DELETE USING (auth.role() = 'authenticated');

-- Projecten
DROP POLICY IF EXISTS "Enable all operations for public" ON projecten;
CREATE POLICY "Allow authenticated select on projecten" ON projecten
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert on projecten" ON projecten
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on projecten" ON projecten
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on projecten" ON projecten
  FOR DELETE USING (auth.role() = 'authenticated');

-- Offertes
DROP POLICY IF EXISTS "Enable all operations for public" ON offertes;
CREATE POLICY "Allow authenticated select on offertes" ON offertes
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert on offertes" ON offertes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on offertes" ON offertes
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on offertes" ON offertes
  FOR DELETE USING (auth.role() = 'authenticated');

-- Inkomsten
DROP POLICY IF EXISTS "Enable all operations for public" ON inkomsten;
CREATE POLICY "Allow authenticated select on inkomsten" ON inkomsten
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert on inkomsten" ON inkomsten
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on inkomsten" ON inkomsten
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on inkomsten" ON inkomsten
  FOR DELETE USING (auth.role() = 'authenticated');

-- Uitgaven
DROP POLICY IF EXISTS "Enable all operations for public" ON uitgaven;
CREATE POLICY "Allow authenticated select on uitgaven" ON uitgaven
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert on uitgaven" ON uitgaven
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on uitgaven" ON uitgaven
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on uitgaven" ON uitgaven
  FOR DELETE USING (auth.role() = 'authenticated');

-- Artikelen
DROP POLICY IF EXISTS "Enable all operations for public" ON artikelen;
CREATE POLICY "Allow authenticated select on artikelen" ON artikelen
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert on artikelen" ON artikelen
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on artikelen" ON artikelen
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on artikelen" ON artikelen
  FOR DELETE USING (auth.role() = 'authenticated');

-- Timesheets
DROP POLICY IF EXISTS "Enable all operations for public" ON timesheets;
CREATE POLICY "Allow authenticated select on timesheets" ON timesheets
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert on timesheets" ON timesheets
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on timesheets" ON timesheets
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on timesheets" ON timesheets
  FOR DELETE USING (auth.role() = 'authenticated');

-- Betalingen
DROP POLICY IF EXISTS "Enable all operations for public" ON betalingen;
CREATE POLICY "Allow authenticated select on betalingen" ON betalingen
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert on betalingen" ON betalingen
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on betalingen" ON betalingen
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on betalingen" ON betalingen
  FOR DELETE USING (auth.role() = 'authenticated');

-- Afspraken
DROP POLICY IF EXISTS "Enable all operations for public" ON afspraken;
CREATE POLICY "Allow authenticated select on afspraken" ON afspraken
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert on afspraken" ON afspraken
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on afspraken" ON afspraken
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on afspraken" ON afspraken
  FOR DELETE USING (auth.role() = 'authenticated');

-- Abonnementen
DROP POLICY IF EXISTS "Enable all operations for public" ON abonnementen;
CREATE POLICY "Allow authenticated select on abonnementen" ON abonnementen
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert on abonnementen" ON abonnementen
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on abonnementen" ON abonnementen
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on abonnementen" ON abonnementen
  FOR DELETE USING (auth.role() = 'authenticated');

-- Offertes: AI media columns
ALTER TABLE offertes
  ADD COLUMN IF NOT EXISTS ai_fotos JSONB,
  ADD COLUMN IF NOT EXISTS ai_afmetingen JSONB,
  ADD COLUMN IF NOT EXISTS ai_analyse JSONB,
  ADD COLUMN IF NOT EXISTS ai_analyse_status VARCHAR(40),
  ADD COLUMN IF NOT EXISTS ai_analyse_fout TEXT,
  ADD COLUMN IF NOT EXISTS ai_analyse_at TIMESTAMP WITH TIME ZONE;

UPDATE offertes SET ai_fotos = '[]'::jsonb WHERE ai_fotos IS NULL;
UPDATE offertes SET ai_afmetingen = '{}'::jsonb WHERE ai_afmetingen IS NULL;
UPDATE offertes SET ai_analyse_status = 'Niet geanalyseerd' WHERE ai_analyse_status IS NULL;

ALTER TABLE offertes
  ALTER COLUMN ai_fotos SET DEFAULT '[]'::jsonb,
  ALTER COLUMN ai_fotos SET NOT NULL,
  ALTER COLUMN ai_afmetingen SET DEFAULT '{}'::jsonb,
  ALTER COLUMN ai_afmetingen SET NOT NULL,
  ALTER COLUMN ai_analyse_status SET DEFAULT 'Niet geanalyseerd',
  ALTER COLUMN ai_analyse_status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'offertes_ai_analyse_status_check'
  ) THEN
    ALTER TABLE offertes
      ADD CONSTRAINT offertes_ai_analyse_status_check
      CHECK (ai_analyse_status IN ('Niet geanalyseerd', 'Bezig', 'Voltooid', 'Fallback', 'Mislukt'));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_offertes_ai_analyse_status
  ON offertes(ai_analyse_status);

-- Storage bucket for offerte media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'offerte-media',
  'offerte-media',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Mock data removed for production - users start with clean slate
-- Tables are ready for user data
-- No sample data inserted to ensure clean user experience
