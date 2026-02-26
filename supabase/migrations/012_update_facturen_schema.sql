-- Update facturen table to match the UI requirements

-- Add missing columns
ALTER TABLE facturen ADD COLUMN IF NOT EXISTS klant_email VARCHAR(255);
ALTER TABLE facturen ADD COLUMN IF NOT EXISTS verval_datum DATE;
ALTER TABLE facturen ADD COLUMN IF NOT EXISTS betaald_op DATE;
ALTER TABLE facturen ADD COLUMN IF NOT EXISTS betaal_methode VARCHAR(100);
ALTER TABLE facturen ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE facturen ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]'::jsonb;
ALTER TABLE facturen ADD COLUMN IF NOT EXISTS herinneringen_verstuurd INTEGER DEFAULT 0;
ALTER TABLE facturen ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Update status values to match UI
ALTER TABLE facturen DROP CONSTRAINT IF EXISTS facturen_status_check;
ALTER TABLE facturen ADD CONSTRAINT facturen_status_check 
  CHECK (status IN ('Concept', 'Verzonden', 'Openstaand', 'Achterstallig', 'Betaald', 'Gecrediteerd', 'Geannuleerd'));

-- Update default status
ALTER TABLE facturen ALTER COLUMN status SET DEFAULT 'Concept';

-- Handle vervaldatum column rename safely
DO $$
BEGIN
  -- Check if vervaldatum exists and verval_datum doesn't
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'facturen' AND column_name = 'vervaldatum')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'facturen' AND column_name = 'verval_datum') THEN
    ALTER TABLE facturen RENAME COLUMN vervaldatum TO verval_datum;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_facturen_klant_email ON facturen(klant_email);
CREATE INDEX IF NOT EXISTS idx_facturen_verval_datum ON facturen(verval_datum);
CREATE INDEX IF NOT EXISTS idx_facturen_betaald_op ON facturen(betaald_op);

-- Update RLS policy for facturen
DROP POLICY IF EXISTS "Allow authenticated select on facturen" ON facturen;
DROP POLICY IF EXISTS "Users can manage own facturen" ON facturen;

CREATE POLICY "Users can manage own facturen" ON facturen
  FOR ALL USING (user_id = auth.uid());