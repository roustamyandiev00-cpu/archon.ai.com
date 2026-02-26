/**
 * Environment variable validation
 * Checks if all required env vars are set
 */

export const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

export const OPTIONAL_ENV_VARS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_E2E',
] as const

export function validateEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = []
  
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }
  
  return {
    valid: missing.length === 0,
    missing
  }
}

export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name]
  
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  
  return value || defaultValue!
}

export function getPublicEnvVar(name: string): string {
  // Only allow NEXT_PUBLIC_ variables
  if (!name.startsWith('NEXT_PUBLIC_')) {
    throw new Error(`Public environment variable must start with NEXT_PUBLIC_: ${name}`)
  }
  
  return getEnvVar(name)
}

// Validated env object
export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    isE2E: process.env.NEXT_PUBLIC_E2E === 'true',
  },
}

// Validate on module load (server-side only)
if (typeof window === 'undefined') {
  const { valid, missing } = validateEnv()
  
  if (!valid) {
    console.warn(`
⚠️  Missing required environment variables:
${missing.map(v => `   - ${v}`).join('\n')}

Please check your .env.local file.
    `)
  }
}
