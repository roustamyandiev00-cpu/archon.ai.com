const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
})

async function seedPlans() {
  console.log('📦 Pakketten configureren volgens ArchonPro model...')

  // 1. Basis (Start)
  const basisFeatures = [
    "home", "bedrijven", "contacten", "deals", "offertes", "artikelen", "agenda"
  ]
  
  // 2. Groei (Pro) - Basis + Projecten + Inkomsten (Facturen)
  const groeiFeatures = [
    ...basisFeatures,
    "projecten", "facturen", "inkomsten", "betalingen" 
  ]

  // 3. Premium (Expert) - Groei + Uitgaven + AI
  const premiumFeatures = [
    ...groeiFeatures,
    "uitgaven", "ai-assistant", "timesheets"
  ]

  const plans = [
    {
      name: 'Basis (Start)',
      slug: 'basis',
      description: 'Voor de startende ondernemer: Klanten & Verkoop.',
      price: 35.00,
      features: JSON.stringify(basisFeatures),
      sort_order: 1,
      is_active: true,
      stripe_price_id: 'price_basis_placeholder'
    },
    {
      name: 'Groei (Pro)',
      slug: 'groei',
      description: 'Voor uitvoerende bedrijven: Projecten & Facturatie.',
      price: 55.00,
      features: JSON.stringify(groeiFeatures),
      sort_order: 2,
      is_active: true,
      stripe_price_id: 'price_groei_placeholder'
    },
    {
      name: 'Premium (Expert)',
      slug: 'premium',
      description: 'Volledige controle: Finance & AI Automation.',
      price: 75.00,
      features: JSON.stringify(premiumFeatures),
      sort_order: 3,
      is_active: true,
      stripe_price_id: 'price_premium_placeholder'
    }
  ]

  for (const plan of plans) {
    const { data, error } = await supabase
      .from('modules')
      .upsert(plan, { onConflict: 'slug' })
      .select()

    if (error) {
      console.error(`❌ Fout bij aanmaken ${plan.name}:`, error.message)
    } else {
      console.log(`✅ ${plan.name} geconfigureerd met ${JSON.parse(plan.features).length} features.`)
    }
  }

  console.log('\n✨ Database is bijgewerkt met de nieuwe pakketstructuur!')
}

seedPlans()
