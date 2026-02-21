import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function listTables() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  console.log(`📊 Tabellen ophalen voor project: ${supabaseUrl}...`)
  
  // We gebruiken een RPC-achtige benadering of we proberen gewoon tabellen te selecteren
  const tablesToCheck = [
    'bedrijven', 'contacten', 'deals', 'projecten', 'offertes', 
    'users', 'modules', 'subscriptions', 'user_settings'
  ]
  
  for (const table of tablesToCheck) {
    const { error } = await supabase.from(table).select('id').limit(1)
    if (error) {
      console.log(`❌ ${table}: ${error.code === 'PGRST116' ? 'Bestaat niet' : error.message}`)
    } else {
      console.log(`✅ ${table}: Bestaat al`)
    }
  }
}

listTables()
