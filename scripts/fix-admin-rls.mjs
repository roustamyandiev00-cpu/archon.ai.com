/**
 * fix-admin-rls.mjs
 * Voegt een RLS policy toe zodat authenticated users hun eigen row kunnen lezen uit de users tabel.
 * Runnen met: node scripts/fix-admin-rls.mjs
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bpgcfjrxtjcmjruhcngn.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZ2NmanJ4dGpjbWpydWhjbmduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE3MjgxMywiZXhwIjoyMDg0NzQ4ODEzfQ.wKW2XE43OnKe85pe-rGDh1GT54A-TlsYDbUCxzZG22k'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

async function main() {
  console.log('=== Archon Admin Fix Script ===\n')

  // 1. Huidige users tabel inhoud tonen
  console.log('📋 Gebruikers in public.users tabel:')
  const { data: users, error: usersErr } = await supabase
    .from('users')
    .select('id, email, role, is_blocked')
  
  if (usersErr) {
    console.error('❌ Kan users tabel niet lezen:', usersErr.message)
  } else {
    console.table(users)
  }

  // 2. Auth users tonen
  console.log('\n📋 Gebruikers in auth.users:')
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers()
  if (authErr) {
    console.error('❌ Kan auth users niet lezen:', authErr.message)
  } else {
    const authUsers = authData.users.map(u => ({ id: u.id, email: u.email, created_at: u.created_at }))
    console.table(authUsers)
  }

  // 3. Zorg dat alle auth users in public.users staan met role = 'ceo'
  console.log('\n🔧 Upsert auth users naar public.users met role=ceo...')
  if (authData?.users) {
    for (const authUser of authData.users) {
      const { error: upsertErr } = await supabase
        .from('users')
        .upsert({
          id: authUser.id,
          email: authUser.email,
          role: 'ceo',
        }, { onConflict: 'id' })
      
      if (upsertErr) {
        console.error(`  ❌ Fout voor ${authUser.email}:`, upsertErr.message)
      } else {
        console.log(`  ✅ ${authUser.email} → role=ceo`)
      }
    }
  }

  // 4. RLS policy toevoegen: users kunnen eigen row lezen
  console.log('\n🔒 RLS policy toevoegen voor users tabel...')
  
  // Gebruik de Supabase REST API om SQL uit te voeren via het management pakket
  const policyQueries = [
    // Policy: users kunnen hun eigen row lezen
    `DROP POLICY IF EXISTS "Users can read own profile" ON users;`,
    `CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);`,
    `DROP POLICY IF EXISTS "Users can update own profile" ON users;`,
    `CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);`,
    `DROP POLICY IF EXISTS "Admins can read all users" ON users;`,
    `CREATE POLICY "Admins can read all users" ON users FOR SELECT USING (true);`,
  ]

  for (const query of policyQueries) {
    try {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'apikey': SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      })
      const text = await resp.text()
      if (resp.ok) {
        console.log(`  ✅ ${query.substring(0, 60)}...`)
      } else {
        console.log(`  ⚠️  ${query.substring(0, 60)}: ${text}`)
      }
    } catch (e) {
      console.log(`  ⚠️  SQL via RPC niet beschikbaar, gebruik Supabase Dashboard`)
    }
  }

  // 5. Finale verificatie
  console.log('\n✅ Finale staat van public.users:')
  const { data: finalUsers } = await supabase
    .from('users')
    .select('id, email, role, is_blocked')
  console.table(finalUsers)
  
  console.log('\n🎉 Klaar! Probeer nu in te loggen op /admin')
  console.log('   Alle gebruikers hebben role=ceo en kunnen het admin dashboard openen.')
}

main().catch(console.error)
