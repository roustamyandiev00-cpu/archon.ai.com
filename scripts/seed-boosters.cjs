const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
})

async function seedBoosters() {
  console.log('🚀 Nieuwe Booster modules toevoegen...')

  const boosterFeatures = [
    "ai-email", 
    "ai-reminders", 
    "whatsapp-integration", 
    "ai-inbox-sorting",
    "ai-chasing"
  ]

  const booster = {
    name: 'AI Communicatie & Opvolging',
    slug: 'ai-communicatie',
    description: 'Automatiseer je inbox, stuur WhatsApp berichten en laat AI je betalingen opvolgen.',
    price: 25.00,
    features: JSON.stringify(boosterFeatures),
    sort_order: 10, 
    is_active: true,
    stripe_price_id: 'price_ai_comm_placeholder'
  }

  const { data, error } = await supabase
    .from('modules')
    .upsert(booster, { onConflict: 'slug' })
    .select()

  if (error) {
    console.error('❌ Fout bij aanmaken booster:', error.message)
  } else {
    console.log(`✅ Booster '${booster.name}' succesvol toegevoegd aan het aanbod!`)
  }

  console.log('\n✨ Klaar! Je kunt de booster nu beheren in het Admin Dashboard.')
}

seedBoosters()
