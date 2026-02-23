-- Add missing columns to artikelen table if they don't exist
DO $$
BEGIN
    -- Check if table exists and add missing columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artikelen') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artikelen' AND column_name = 'categorie') THEN
            ALTER TABLE artikelen ADD COLUMN categorie TEXT DEFAULT 'Diensten';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artikelen' AND column_name = 'eenheid') THEN
            ALTER TABLE artikelen ADD COLUMN eenheid TEXT DEFAULT 'stuk';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artikelen' AND column_name = 'voorraad') THEN
            ALTER TABLE artikelen ADD COLUMN voorraad TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artikelen' AND column_name = 'status') THEN
            ALTER TABLE artikelen ADD COLUMN status TEXT DEFAULT 'Actief';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artikelen' AND column_name = 'beschrijving') THEN
            ALTER TABLE artikelen ADD COLUMN beschrijving TEXT;
        END IF;
    ELSE
        -- Create table if it doesn't exist
        CREATE TABLE artikelen (
            id TEXT PRIMARY KEY DEFAULT (substr(lower(hex(randomblob(16))),1,25) || substr(lower(hex(randomblob(16))),1,25)),
            naam TEXT NOT NULL,
            categorie TEXT DEFAULT 'Diensten',
            prijs REAL DEFAULT 0,
            eenheid TEXT DEFAULT 'stuk',
            voorraad TEXT,
            status TEXT DEFAULT 'Actief',
            beschrijving TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Create indexes only if columns exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artikelen' AND column_name = 'naam') THEN
        CREATE INDEX IF NOT EXISTS idx_artikelen_naam ON artikelen(naam);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artikelen' AND column_name = 'categorie') THEN
        CREATE INDEX IF NOT EXISTS idx_artikelen_categorie ON artikelen(categorie);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artikelen' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_artikelen_status ON artikelen(status);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE artikelen ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artikelen
CREATE POLICY "Users can view own artikelen" ON artikelen FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create artikelen" ON artikelen FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update artikelen" ON artikelen FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete artikelen" ON artikelen FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for timesheets
CREATE POLICY "Users can view own timesheets" ON timesheets FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create timesheets" ON timesheets FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update timesheets" ON timesheets FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete timesheets" ON timesheets FOR DELETE USING (auth.uid() IS NOT NULL);