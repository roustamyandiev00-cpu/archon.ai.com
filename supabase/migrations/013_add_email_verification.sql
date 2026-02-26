-- Add email verification column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Update existing users to be verified (for backwards compatibility)
UPDATE users 
SET email_verified = TRUE 
WHERE email_verified IS NULL;

-- Add index for email verification queries
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Add comment
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address';