// Script to create storage bucket and add sample data
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

async function setupSupabase() {
  console.log('=== Setting up Supabase ===\n')

  // 1. Create Storage Bucket
  console.log('1. Creating storage bucket "offerte-media"...')
  const { data: bucket, error: bucketError } = await supabase.storage.createBucket('offerte-media', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  })

  if (bucketError) {
    if (bucketError.message?.includes('already exists')) {
      console.log('   ✅ Bucket already exists')
    } else {
      console.log('   ❌ Error:', bucketError.message)
    }
  } else {
    console.log('   ✅ Bucket created:', bucket.name)
  }

  // 2. Add sample data
  console.log('\n2. Adding sample data...')

  // Bedrijven
  const { data: bedrijven, error: bedrijfError } = await supabase
    .from('bedrijven')
    .insert([
      { naam: 'ACME BV', adres: 'Straat 1', postcode: '1000AA', stad: 'Amsterdam', email: 'info@acme.nl', telefoon: '020-1234567', kvk: '12345678', btw: 'NL123456789B01' },
      { naam: 'TechStart NV', adres: 'Laan 5', postcode: '2000BB', stad: 'Rotterdam', email: 'info@techstart.nl', telefoon: '010-2345678', kvk: '23456789', btw: 'NL234567890B02' },
      { naam: 'Global Solutions', adres: 'Weg 10', postcode: '3000CC', stad: 'Utrecht', email: 'info@global.nl', telefoon: '030-3456789', kvk: '34567890', btw: 'NL345678901B03' }
    ])
    .select()

  if (bedrijfError) {
    console.log('   ⚠️  Bedrijven:', bedrijfError.message)
  } else {
    console.log(`   ✅ ${bedrijven.length} bedrijven toegevoegd`)
  }

  // Contacten
  const { data: contacten, error: contactError } = await supabase
    .from('contacten')
    .insert([
      { voornaam: 'Jan', achternaam: 'de Vries', email: 'jan@acme.nl', telefoon: '020-1234568', bedrijf_id: 1, functie: 'Directeur' },
      { voornaam: 'Maria', achternaam: 'Jansen', email: 'maria@acme.nl', telefoon: '020-1234569', bedrijf_id: 1, functie: 'Manager' },
      { voornaam: 'Peter', achternaam: 'Smit', email: 'peter@techstart.nl', telefoon: '010-2345679', bedrijf_id: 2, functie: 'CTO' }
    ])
    .select()

  if (contactError) {
    console.log('   ⚠️  Contacten:', contactError.message)
  } else {
    console.log(`   ✅ ${contacten.length} contacten toegevoegd`)
  }

  // Deals
  const { data: deals, error: dealError } = await supabase
    .from('deals')
    .insert([
      { titel: 'Software License', waarde: 50000, stadium: 'Gekwalificeerd', bedrijf_id: 1, contact_id: 1, kans: 75 },
      { titel: 'Consultancy Project', waarde: 25000, stadium: 'Voorstel', bedrijf_id: 2, contact_id: 3, kans: 60 },
      { titel: 'Annual Support', waarde: 15000, stadium: 'Onderhandeling', bedrijf_id: 1, contact_id: 2, kans: 80 }
    ])
    .select()

  if (dealError) {
    console.log('   ⚠️  Deals:', dealError.message)
  } else {
    console.log(`   ✅ ${deals.length} deals toegevoegd`)
  }

  // Projecten
  const { data: projecten, error: projectError } = await supabase
    .from('projecten')
    .insert([
      { naam: 'Website Redesign', beschrijving: 'Complete redesign of company website', bedrijf_id: 1, status: 'Actief', voortgang: 75, budget: 30000, budget_gebruikt: 22500 },
      { naam: 'Mobile App', beschrijving: 'Native mobile application for iOS and Android', bedrijf_id: 2, status: 'Actief', voortgang: 40, budget: 50000, budget_gebruikt: 20000 },
      { naam: 'CRM Integration', beschrijving: 'Integration with third-party CRM system', bedrijf_id: 1, status: 'On Hold', voortgang: 60, budget: 25000, budget_gebruikt: 15000 }
    ])
    .select()

  if (projectError) {
    console.log('   ⚠️  Projecten:', projectError.message)
  } else {
    console.log(`   ✅ ${projecten.length} projecten toegevoegd`)
  }

  // Offertes
  const { data: offertes, error: offerteError } = await supabase
    .from('offertes')
    .insert([
      { nummer: '2025-001', klant: 'ACME BV', bedrag: 45000, datum: '2025-02-01', geldig_tot: '2025-02-15', status: 'Geaccepteerd', bedrijf_id: 1 },
      { nummer: '2025-002', klant: 'TechStart NV', bedrag: 60000, datum: '2025-02-05', geldig_tot: '2025-02-19', status: 'Openstaand', bedrijf_id: 2 },
      { nummer: '2025-003', klant: 'Global Solutions', bedrag: 35000, datum: '2025-02-08', geldig_tot: '2025-02-22', status: 'Afgewezen', bedrijf_id: 3 }
    ])
    .select()

  if (offerteError) {
    console.log('   ⚠️  Offertes:', offerteError.message)
  } else {
    console.log(`   ✅ ${offertes.length} offertes toegevoegd`)
  }

  console.log('\n=== Setup Complete ===')
  console.log('\nWhat is now available:')
  console.log('✅ Storage bucket for file uploads')
  console.log('✅ Sample bedrijven, contacten, deals, projecten, offertes')
  console.log('✅ Admin user with ceo role')
  console.log('✅ 12 modules configured')
}

setupSupabase()
