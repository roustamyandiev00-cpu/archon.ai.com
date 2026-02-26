-- Add template settings to user_settings table
-- This enables users to select document templates for quotations and invoices

-- Add template columns to user_settings
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS quotation_template TEXT DEFAULT 'quotation-variant-1a-basic',
ADD COLUMN IF NOT EXISTS invoice_template TEXT DEFAULT 'invoice-variant-1-basic';

-- Add comments for documentation
COMMENT ON COLUMN user_settings.quotation_template IS 'Selected template for quotations (e.g., quotation-variant-1a-basic)';
COMMENT ON COLUMN user_settings.invoice_template IS 'Selected template for invoices (e.g., invoice-variant-1-basic)';

-- Create index for faster template lookups (optional)
CREATE INDEX IF NOT EXISTS idx_user_settings_quotation_template ON user_settings(quotation_template);
CREATE INDEX IF NOT EXISTS idx_user_settings_invoice_template ON user_settings(invoice_template);
