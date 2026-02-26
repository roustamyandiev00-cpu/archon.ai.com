-- Add PDF template settings to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS pdf_offerte_template VARCHAR(20) DEFAULT 'modern',
ADD COLUMN IF NOT EXISTS pdf_factuur_template VARCHAR(20) DEFAULT 'modern',
ADD COLUMN IF NOT EXISTS pdf_language VARCHAR(5) DEFAULT 'nl',
ADD COLUMN IF NOT EXISTS pdf_currency VARCHAR(5) DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS pdf_footer_text TEXT DEFAULT '';

-- Add check constraints for valid template values
ALTER TABLE user_settings 
ADD CONSTRAINT check_pdf_offerte_template 
CHECK (pdf_offerte_template IN ('modern', 'classic', 'minimal'));

ALTER TABLE user_settings 
ADD CONSTRAINT check_pdf_factuur_template 
CHECK (pdf_factuur_template IN ('modern', 'classic', 'minimal'));

-- Add check constraints for valid language values
ALTER TABLE user_settings 
ADD CONSTRAINT check_pdf_language 
CHECK (pdf_language IN ('nl', 'en', 'de', 'fr'));

-- Add check constraints for valid currency values
ALTER TABLE user_settings 
ADD CONSTRAINT check_pdf_currency 
CHECK (pdf_currency IN ('EUR', 'USD', 'GBP'));

-- Add comment for documentation
COMMENT ON COLUMN user_settings.pdf_offerte_template IS 'PDF template style for offertes: modern, classic, or minimal';
COMMENT ON COLUMN user_settings.pdf_factuur_template IS 'PDF template style for facturen: modern, classic, or minimal';
COMMENT ON COLUMN user_settings.pdf_language IS 'Default language for PDF documents';
COMMENT ON COLUMN user_settings.pdf_currency IS 'Default currency for PDF documents';
COMMENT ON COLUMN user_settings.pdf_footer_text IS 'Custom footer text for PDF documents';