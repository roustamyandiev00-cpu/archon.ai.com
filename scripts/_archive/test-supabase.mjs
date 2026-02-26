import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function testConnection() {
  console.log(`📡 Verbinding testen met ${supabaseUrl}...`)
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data, error } = await supabase.from('bedrijven').select('count', { count: 'exact', head: true })
  
  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('not found')) {
      console.log('✅ API bereikbaar, maar tabel "bedrijven" bestaat nog niet (zoals verwacht).')
    } else {
      console.error('❌ Fout bij verbinden met API:', error.message)
    }
  } else {
    console.log('✅ Succesvol verbonden! Er zijn al bedrijven in de database.')
  }
}

testConnection()
