#!/usr/bin/env node
/**
 * Simple script to fetch first 10 rows from `bedrijven` using public anon key.
 * Usage: create `.env.local` next to project root with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * Then run: `node scripts/fetch-companies.mjs`
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment (.env.local).')
  process.exit(2)
}

const supabase = createClient(url, anon)

async function main() {
  try {
    const { data, error } = await supabase.from('bedrijven').select('*').limit(10)
    if (error) {
      console.error('Supabase error:', error)
      process.exit(3)
    }
    console.log(JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('Unexpected error:', err)
    process.exit(1)
  }
}

void main()
