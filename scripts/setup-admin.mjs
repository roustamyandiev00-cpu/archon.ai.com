import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Supabase config from env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function makeUserAdmin(email) {
  try {
    // Find user by email
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single();

    if (findError || !user) {
      console.error(`❌ Gebruiker met email "${email}" niet gevonden`);
      console.log('\n💡 Tip: Registreer eerst via /register');
      return;
    }

    // Update role to admin
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Kon rol niet updaten:', updateError.message);
      return;
    }

    console.log(`✅ Gebruiker "${email}" is nu ADMIN!`);
    console.log(`   Gebruikers ID: ${user.id}`);
    console.log(`\n🚀 Je kunt nu naar: http://localhost:3000/admin`);

  } catch (error) {
    console.error('❌ Fout:', error.message);
  }
}

async function createDefaultAdmin() {
  try {
    const adminEmail = 'admin@archon.ai';
    const adminPassword = 'admin123';

    // Check if exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .single();

    if (existing) {
      console.log(`⚠️  Admin account "${adminEmail}" bestaat al`);
      const answer = await askQuestion('Wilt u het wachtwoord resetten? (ja/nee): ');
      if (answer.toLowerCase() === 'ja') {
        // Reset password via auth admin
        const { error } = await supabase.auth.admin.updateUserById(existing.id, {
          password: adminPassword
        });
        if (error) throw error;
        console.log(`✅ Wachtwoord gereset naar: ${adminPassword}`);
      }
      return;
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { name: 'System Admin' },
    });

    if (authError) throw authError;

    // Create user record with admin role
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: adminEmail,
        name: 'System Admin',
        role: 'admin',
        is_blocked: false,
        tokens_used: 0,
        tokens_limit: 100000,
      });

    if (userError) {
      // Cleanup auth user
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

    console.log('✅ Default admin account aangemaakt:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Wachtwoord: ${adminPassword}`);
    console.log(`\n🚀 Login op: http://localhost:3000/login`);
    console.log(`   Daarna naar: http://localhost:3000/admin`);

  } catch (error) {
    console.error('❌ Fout bij aanmaken:', error.message);
  }
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║         ArchonPro Admin Setup - Supabase CLI             ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('Opties:');
  console.log('1. Maak een bestaande gebruiker admin (via email)');
  console.log('2. Maak een nieuw default admin account');
  console.log('3. Annuleer\n');

  const choice = await askQuestion('Kies optie (1/2/3): ');

  if (choice === '1') {
    const email = await askQuestion('Email adres van gebruiker: ');
    await makeUserAdmin(email.trim());
  } else if (choice === '2') {
    await createDefaultAdmin();
  } else {
    console.log('Geannuleerd.');
  }

  rl.close();
}

main();
