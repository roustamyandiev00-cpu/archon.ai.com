// Script to reset admin user password
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const ADMIN_EMAIL = 'roustamyandiev00@gmail.com';
const ADMIN_USER_ID = '6e77d5bf-27f5-4990-b3ac-4033a1c2274c';
const NEW_PASSWORD = 'Test1234';

async function resetPassword() {
  console.log(`Resetting password for ${ADMIN_EMAIL}...`);
  
  // Update password directly by user ID
  const { data, error } = await supabase.auth.admin.updateUserById(
    ADMIN_USER_ID,
    { password: NEW_PASSWORD }
  );
  
  if (error) {
    console.error('Error updating password:', error);
    process.exit(1);
  }
  
  console.log('Password updated successfully!');
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`New password: ${NEW_PASSWORD}`);
}

resetPassword();
