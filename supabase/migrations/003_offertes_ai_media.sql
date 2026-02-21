-- Offertes: media upload + AI analyse metadata

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
