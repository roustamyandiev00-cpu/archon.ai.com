const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ENCRYPTION_KEY',
  'GEMINI_API_KEY',
  'DATABASE_URL'
];

const missing = required.filter((k) => !process.env[k] || process.env[k] === '' );

if (missing.length === 0) {
  console.log('All required environment variables are present.');
  process.exit(0);
}

console.error('Missing required environment variables:');
missing.forEach((k) => console.error('- ' + k));

// If CI_STRICT_ENV is set to 'true' we fail with non-zero exit code (useful in gated CI).
if (process.env.CI_STRICT_ENV === 'true') {
  process.exit(2);
} else {
  console.warn('Environment audit produced warnings but will not fail. Set CI_STRICT_ENV=true to make this step fail in CI.');
  process.exit(0);
}
