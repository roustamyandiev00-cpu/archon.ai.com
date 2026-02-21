// Script to check what's still missing in Supabase
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

async function checkSupabase() {
  console.log('=== Supabase Setup Check ===\n')

  // 1. Check Storage Buckets
  console.log('1. Storage Buckets:')
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
  
  if (bucketError) {
    console.log('   ❌ Error:', bucketError.message)
  } else if (buckets.length === 0) {
    console.log('   ⚠️  No storage buckets found')
    console.log('   → Need to create: offerte-media bucket')
  } else {
    console.log('   ✅ Found buckets:')
    buckets.forEach(b => console.log(`      - ${b.name} (public: ${b.public})`))
  }

  // 2. Check RLS Policies
  console.log('\n2. RLS Policies:')
  const { data: rlsData, error: rlsError } = await supabase.rpc('exec_sql', {
    query: `SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`
  }).catch(() => ({ data: null, error: true }))
  
  if (rlsError || !rlsData) {
    console.log('   ⚠️  Could not check RLS status')
  } else {
    console.log('   Tables with RLS enabled:')
    rlsData?.forEach(t => {
      if (t.rowsecurity) console.log(`      ✅ ${t.tablename}`)
    })
  }

  // 3. Check sample data
  console.log('\n3. Sample Data:')
  
  const tables = ['bedrijven', 'contacten', 'deals', 'projecten', 'offertes']
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`)
    } else {
      console.log(`   ${count > 0 ? '✅' : '⚠️ '} ${table}: ${count} rows`)
    }
  }

  // 4. Check triggers
  console.log('\n4. Triggers (updated_at):')
  console.log('   ⚠️  Need to verify triggers exist for auto-updating timestamps')

  console.log('\n=== Summary ===')
  console.log('What might still be needed:')
  console.log('1. Storage bucket "offerte-media" for file uploads')
  console.log('2. Sample data for testing (optional)')
  console.log('3. Verify RLS policies are working correctly')
}

checkSupabase()
