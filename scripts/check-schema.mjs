import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function checkSchema() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  console.log('🔍 Database schema controleren...')
  
  const { data: users, error: usersError } = await supabase.from('users').select('role').limit(1)
  if (usersError) {
    console.log(`❌ Fout bij users tabel: ${usersError.message}`)
  } else {
    console.log('✅ Users tabel met role kolom gevonden.')
  }

  const { data: modules, error: modulesError } = await supabase.from('modules').select('id').limit(1)
  if (modulesError) {
    console.log(`❌ Fout bij modules tabel: ${modulesError.message}`)
  } else {
    console.log('✅ Modules tabel gevonden.')
  }
}

checkSchema()
