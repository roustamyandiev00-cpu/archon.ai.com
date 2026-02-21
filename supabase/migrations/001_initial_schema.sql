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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
-- Triggers for updated_at (drop if exists then create to be idempotent)
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

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bedrijven_naam ON bedrijven(naam);
CREATE INDEX IF NOT EXISTS idx_contacten_achternaam ON contacten(achternaam);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'stadium') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_deals_stadium ON deals(stadium)';
  END IF;
END$$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'bedrijf_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_deals_bedrijf_id ON deals(bedrijf_id)';
  END IF;
END$$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projecten' AND column_name = 'status') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_projecten_status ON projecten(status)';
  END IF;
END$$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projecten' AND column_name = 'bedrijf_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_projecten_bedrijf_id ON projecten(bedrijf_id)';
  END IF;
END$$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offertes' AND column_name = 'status') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_offertes_status ON offertes(status)';
  END IF;
END$$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offertes' AND column_name = 'bedrijf_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_offertes_bedrijf_id ON offertes(bedrijf_id)';
  END IF;
END$$;

-- Row Level Security (RLS) - Enable on all tables
ALTER TABLE bedrijven ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacten ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE projecten ENABLE ROW LEVEL SECURITY;
ALTER TABLE offertes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: tighten defaults
-- Replace permissive "FOR ALL USING (true)" policies with conservative defaults:
--  - Allow authenticated users to READ (SELECT)
--  - Do NOT allow anonymous or authenticated writes by default (use service role or add owner columns and policies)
-- Customize these policies further for multi-tenant or owner-based access.

-- Bedrijven
DROP POLICY IF EXISTS "Enable all operations for public" ON bedrijven;
CREATE POLICY "Allow authenticated select on bedrijven" ON bedrijven
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert into bedrijven
CREATE POLICY "Allow authenticated insert on bedrijven" ON bedrijven
  FOR INSERT USING (auth.role() = 'authenticated');

-- Contacten
DROP POLICY IF EXISTS "Enable all operations for public" ON contacten;
CREATE POLICY "Allow authenticated select on contacten" ON contacten
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert into contacten
CREATE POLICY "Allow authenticated insert on contacten" ON contacten
  FOR INSERT USING (auth.role() = 'authenticated');

-- Deals
DROP POLICY IF EXISTS "Enable all operations for public" ON deals;
CREATE POLICY "Allow authenticated select on deals" ON deals
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert into deals
CREATE POLICY "Allow authenticated insert on deals" ON deals
  FOR INSERT USING (auth.role() = 'authenticated');

-- Projecten
DROP POLICY IF EXISTS "Enable all operations for public" ON projecten;
CREATE POLICY "Allow authenticated select on projecten" ON projecten
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert into projecten
CREATE POLICY "Allow authenticated insert on projecten" ON projecten
  FOR INSERT USING (auth.role() = 'authenticated');

-- Offertes
DROP POLICY IF EXISTS "Enable all operations for public" ON offertes;
CREATE POLICY "Allow authenticated select on offertes" ON offertes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert into offertes
CREATE POLICY "Allow authenticated insert on offertes" ON offertes
  FOR INSERT USING (auth.role() = 'authenticated');

-- Insert sample data (optional - remove in production)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bedrijven' AND column_name = 'naam') THEN
    INSERT INTO bedrijven (naam, adres, postcode, stad, email, telefoon, kvk, btw) VALUES
      ('ACME BV', 'Straat 1', '1000AA', 'Amsterdam', 'info@acme.nl', '020-1234567', '12345678', 'NL123456789B01'),
      ('TechStart NV', 'Laan 5', '2000BB', 'Rotterdam', 'info@techstart.nl', '010-2345678', '23456789', 'NL234567890B02'),
      ('Global Solutions', 'Weg 10', '3000CC', 'Utrecht', 'info@global.nl', '030-3456789', '34567890', 'NL345678901B03')
    ON CONFLICT DO NOTHING;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacten' AND column_name = 'voornaam') THEN
    INSERT INTO contacten (voornaam, achternaam, email, telefoon, bedrijf_id, functie) VALUES
      ('Jan', 'de Vries', 'jan@acme.nl', '020-1234568', 1, 'Directeur'),
      ('Maria', 'Jansen', 'maria@acme.nl', '020-1234569', 1, 'Manager'),
      ('Peter', 'Smit', 'peter@techstart.nl', '010-2345679', 2, 'CTO')
    ON CONFLICT DO NOTHING;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'titel') THEN
    INSERT INTO deals (titel, waarde, stadium, bedrijf_id, contact_id, kans) VALUES
      ('Software License', 50000, 'Gekwalificeerd', 1, 1, 75),
      ('Consultancy Project', 25000, 'Voorstel', 2, 3, 60),
      ('Annual Support', 15000, 'Onderhandeling', 1, 2, 80)
    ON CONFLICT DO NOTHING;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projecten' AND column_name = 'naam') THEN
    INSERT INTO projecten (naam, beschrijving, bedrijf_id, status, voortgang, budget, budget_gebruikt) VALUES
      ('Website Redesign', 'Complete redesign of company website', 1, 'Actief', 75, 30000, 22500),
      ('Mobile App', 'Native mobile application for iOS and Android', 2, 'Actief', 40, 50000, 20000),
      ('CRM Integration', 'Integration with third-party CRM system', 1, 'On Hold', 60, 25000, 15000)
    ON CONFLICT DO NOTHING;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offertes' AND column_name = 'nummer') THEN
    INSERT INTO offertes (nummer, klant, bedrag, datum, geldig_tot, status, bedrijf_id) VALUES
      ('2025-001', 'ACME BV', 45000, '2025-02-01', '2025-02-15', 'Geaccepteerd', 1),
      ('2025-002', 'TechStart NV', 60000, '2025-02-05', '2025-02-19', 'Openstaand', 2),
      ('2025-003', 'Global Solutions', 35000, '2025-02-08', '2025-02-22', 'Afgewezen', 3)
    ON CONFLICT DO NOTHING;
  END IF;
END$$;