/**
 * set-admin-credentials.mjs
 * Stelt het wachtwoord in voor windowpro.be@gmail.com en zet de rol op 'admin'.
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bpgcfjrxtjcmjruhcngn.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZ2NmanJ4dGpjbWpydWhjbmduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE3MjgxMywiZXhwIjoyMDg0NzQ4ODEzfQ.wKW2XE43OnKe85pe-rGDh1GT54A-TlsYDbUCxzZG22k'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

const TARGET_EMAIL = 'windowpro.be@gmail.com'
const NEW_PASSWORD = 'Admin111admin111'
const NEW_ROLE = 'admin'

async function main() {
  console.log(`=== Gebruiker configureren: ${TARGET_EMAIL} ===\n`)

  // 1. Zoek de gebruiker op in Auth
  console.log('🔍 Gebruiker zoeken in Auth...')
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  
  if (listError) {
    console.error('❌ Fout bij ophalen gebruikers:', listError.message)
    return
  }

  const user = users.find(u => u.email === TARGET_EMAIL)
  if (!user) {
    console.error(`❌ Gebruiker met email ${TARGET_EMAIL} niet gevonden.`)
    return
  }

  console.log(`✅ Gebruiker gevonden (ID: ${user.id})`)

  // 2. Wachtwoord updaten via Admin API
  console.log(`\n🔐 Wachtwoord instellen op: ${NEW_PASSWORD}...`)
  const { error: pwdError } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: NEW_PASSWORD }
  )

  if (pwdError) {
    console.error('❌ Fout bij instellen wachtwoord:', pwdError.message)
  } else {
    console.log('✅ Wachtwoord succesvol bijgewerkt.')
  }

  // 3. Rol updaten in de public.users tabel
  console.log(`\n🛡️  Rol instellen op: ${NEW_ROLE} in de database...`)
  const { error: roleError } = await supabase
    .from('users')
    .update({ role: NEW_ROLE })
    .eq('id', user.id)

  if (roleError) {
    console.error('❌ Fout bij instellen rol:', roleError.message)
  } else {
    console.log('✅ Rol succesvol bijgewerkt naar admin.')
  }

  console.log('\n✨ Klaar! Je kunt nu inloggen.')
}

main().catch(console.error)
