import fs from 'node:fs'
import path from 'node:path'

import { createClient } from '@supabase/supabase-js'

function readEnvFile(filePath) {
  const env = {}
  if (!fs.existsSync(filePath)) return env

  const content = fs.readFileSync(filePath, 'utf8')
  content.split(/\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/)
    if (!m) return

    const key = m[1]
    let val = m[2] ?? ''
    // strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    env[key] = val
  })

  return env
}

async function main() {
  const envPath = path.join(process.cwd(), '.env.local')
  const env = readEnvFile(envPath)

  const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase keys missing in .env.local (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
    process.exit(2)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const tables = [
    'bedrijven',
    'contacten',
    'deals',
    'projecten',
    'offertes',
    'inkomsten',
    'uitgaven',
    'artikelen',
    'timesheets',
    'betalingen',
    'afspraken',
    'abonnementen',
  ]

  const results = Object.fromEntries(
    await Promise.all(
      tables.map(async (t) => {
        try {
          const { data, error } = await supabase.from(t).select('id').limit(1)
          if (error) return [t, { ok: false, error: error.message }]
          return [t, { ok: true, example: data?.[0] ?? null }]
        } catch (err) {
          return [t, { ok: false, error: err?.message || String(err) }]
        }
      })
    )
  )

  console.log(JSON.stringify({ results }, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
