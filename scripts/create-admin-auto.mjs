import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local file
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2].replace(/^"|"$/g, '');
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing env variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

const ADMIN_EMAIL = 'roustamyandiev00@gmail.com';
const ADMIN_PASSWORD = 'admin123';

async function createAdmin() {
  try {
    console.log('🚀 Admin account aanmaken...\n');

    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', ADMIN_EMAIL)
      .single();

    if (existing) {
      console.log(`⚠️  Gebruiker "${ADMIN_EMAIL}" bestaat al`);
      console.log('   Rol wordt geupgrade naar admin...');
      
      // Make existing user admin
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', existing.id);

      if (updateError) throw updateError;
      
      // Reset password
      const { error: pwdError } = await supabase.auth.admin.updateUserById(existing.id, {
        password: ADMIN_PASSWORD
      });
      
      if (pwdError) {
        console.log('   ⚠️  Wachtwoord kon niet worden gereset (kan via password reset)');
      } else {
        console.log('   ✅ Wachtwoord gereset');
      }
      
      console.log(`\n✅ Gebruiker is nu ADMIN!`);
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Wachtwoord: ${ADMIN_PASSWORD}`);
    } else {
      // Create new admin user
      console.log('   Nieuwe gebruiker aanmaken...');
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { name: 'Admin User' },
      });

      if (authError) throw authError;

      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: ADMIN_EMAIL,
          name: 'Admin User',
          role: 'admin',
          is_blocked: false,
          tokens_used: 0,
          tokens_limit: 100000,
        });

      if (userError) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw userError;
      }

      // Create integrations
      const integrations = [
        { user_id: authData.user.id, provider: 'slack', is_enabled: false, is_connected: false },
        { user_id: authData.user.id, provider: 'google_calendar', is_enabled: false, is_connected: false },
        { user_id: authData.user.id, provider: 'microsoft_teams', is_enabled: false, is_connected: false },
        { user_id: authData.user.id, provider: 'dropbox', is_enabled: false, is_connected: false },
        { user_id: authData.user.id, provider: 'zapier', is_enabled: false, is_connected: false },
        { user_id: authData.user.id, provider: 'quickbooks', is_enabled: false, is_connected: false },
      ];

      await supabase.from('user_integrations').insert(integrations);

      console.log(`\n✅ Admin account succesvol aangemaakt!`);
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Wachtwoord: ${ADMIN_PASSWORD}`);
    }

    console.log(`\n🚀 Login op: http://localhost:3000/login`);
    console.log(`   Admin dashboard: http://localhost:3000/admin`);

  } catch (error) {
    console.error('❌ Fout:', error.message);
    process.exit(1);
  }
}

createAdmin();
