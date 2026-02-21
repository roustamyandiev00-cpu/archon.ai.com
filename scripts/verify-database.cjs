// Script to verify database setup
const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})

async function verifyDatabase() {
  console.log('=== Verifying Database Setup ===\n')

  // Check tables
  const tables = [
    'users', 'modules', 'subscriptions', 'user_integrations', 'user_settings',
    'bedrijven', 'contacten', 'deals', 'projecten', 'offertes',
    'inkomsten', 'uitgaven', 'artikelen', 'timesheets', 'betalingen', 'afspraken', 'abonnementen'
  ]

  console.log('1. Checking tables...')
  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`)
    } else {
      console.log(`   ✅ ${table}: ${count} rows`)
    }
  }

  // Check admin user
  console.log('\n2. Checking admin user...')
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
  
  if (userError) {
    console.log('   ❌ Error:', userError.message)
  } else {
    console.log(`   ✅ Found ${users.length} user(s):`)
    users.forEach(u => {
      console.log(`      - ${u.email} (${u.role})`)
    })
  }

  // Check auth users
  console.log('\n3. Checking auth users...')
  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    console.log('   ❌ Error:', authError.message)
  } else {
    console.log(`   ✅ Found ${authUsers.length} auth user(s):`)
    authUsers.forEach(u => {
      console.log(`      - ${u.email} (${u.id})`)
    })
  }

  console.log('\n=== Verification Complete ===')
}

verifyDatabase()
