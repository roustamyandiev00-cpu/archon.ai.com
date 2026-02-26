const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl ? 'SET' : 'NOT SET');
console.log('Service Role Key:', serviceKey ? 'SET (' + serviceKey.substring(0, 20) + '...)' : 'NOT SET');

if (!supabaseUrl || !serviceKey) {
  console.error('Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function checkTables() {
  console.log('Checking database tables...\n');
  
  // Check modules
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('name, slug, price')
    .limit(5);
  
  console.log('MODULES TABLE:');
  if (modulesError) {
    console.log('  Status: NOT EXISTS');
    console.log('  Error:', modulesError.message);
  } else {
    console.log('  Status: EXISTS');
    console.log('  Rows:', modules.length);
    modules.forEach(m => console.log('  -', m.name, '(€' + m.price + ')'));
  }
  
  // Check user_integrations
  const { data: integrations, error: intError } = await supabase
    .from('user_integrations')
    .select('provider, is_enabled')
    .limit(5);
  
  console.log('\nUSER_INTEGRATIONS TABLE:');
  if (intError) {
    console.log('  Status: NOT EXISTS');
    console.log('  Error:', intError.message);
  } else {
    console.log('  Status: EXISTS');
    console.log('  Rows:', integrations.length);
  }
  
  // Check subscriptions
  const { data: subs, error: subsError } = await supabase
    .from('subscriptions')
    .select('user_id, status')
    .limit(5);
  
  console.log('\nSUBSCRIPTIONS TABLE:');
  if (subsError) {
    console.log('  Status: NOT EXISTS');
    console.log('  Error:', subsError.message);
  } else {
    console.log('  Status: EXISTS');
    console.log('  Rows:', subs.length);
  }
  
  // Check users columns
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, role, is_blocked, subscription_tier, tokens_used, tokens_limit')
    .limit(1);
  
  console.log('\nUSERS TABLE (admin columns):');
  if (usersError) {
    console.log('  Status: COLUMNS MISSING');
    console.log('  Error:', usersError.message);
  } else {
    console.log('  Status: COLUMNS EXIST');
    if (users && users[0]) {
      console.log('  Sample user:', users[0].email);
      console.log('  Has role column:', 'role' in users[0]);
      console.log('  Has is_blocked column:', 'is_blocked' in users[0]);
    }
  }
}

checkTables().catch(console.error);
