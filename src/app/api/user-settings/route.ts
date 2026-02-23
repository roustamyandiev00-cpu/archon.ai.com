import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { encrypt, decrypt, mask } from '@/lib/encryption'

// Helper to get user ID from request
async function getUserId(request: NextRequest): Promise<string | null> {
  // Try to get from header first (for server-to-server calls)
  const headerUserId = request.headers.get('x-user-id')
  if (headerUserId) return headerUserId
  
  // Try to get from authorization header (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    
    try {
      const supabase = getSupabaseAdmin()
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user) return null
      return user.id
    } catch {
      return null
    }
  }
  
  // Try to get from cookie (for browser requests)
  const cookieStore = request.cookies
  const accessToken = cookieStore.get('sb-access-token')?.value || 
                      cookieStore.get('supabase-auth-token')?.value
  
  if (accessToken) {
    try {
      const supabase = getSupabaseAdmin()
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      
      if (error || !user) return null
      return user.id
    } catch {
      return null
    }
  }
  
  return null
}

// GET - Fetch user settings
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    
    const { data, error } = await (supabase
      .from('user_settings') as any)
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user settings:', error)
      return NextResponse.json({ error: 'Instellingen ophalen mislukt' }, { status: 500 })
    }

    // Return empty settings if not found
    if (!data) {
      return NextResponse.json({ 
        settings: {
          company_name: null,
          company_logo: null,
          smtp_provider: null,
          smtp_gmail_user: null,
          smtp_gmail_password: null,
          smtp_outlook_user: null,
          smtp_outlook_password: null,
          smtp_custom_host: null,
          smtp_custom_port: null,
          smtp_custom_user: null,
          smtp_custom_password: null,
          smtp_custom_from: null,
          email_from_name: null,
          email_from_address: null,
          stripe_publishable_key: null,
          stripe_secret_key: null,
          stripe_webhook_secret: null,
          stripe_test_mode: true,
        }
      })
    }

    // Decrypt sensitive fields and mask for display
    const safeSettings = {
      ...data,
      smtp_gmail_password: data.smtp_gmail_password ? mask(decrypt(data.smtp_gmail_password)) : null,
      smtp_outlook_password: data.smtp_outlook_password ? mask(decrypt(data.smtp_outlook_password)) : null,
      smtp_custom_password: data.smtp_custom_password ? mask(decrypt(data.smtp_custom_password)) : null,
      stripe_secret_key: data.stripe_secret_key ? mask(decrypt(data.stripe_secret_key)) : null,
      stripe_webhook_secret: data.stripe_webhook_secret ? mask(decrypt(data.stripe_webhook_secret)) : null,
    }

    return NextResponse.json({ settings: safeSettings })
  } catch (error) {
    console.error('Error in GET /api/user-settings:', error)
    return NextResponse.json({ error: 'Interne server fout' }, { status: 500 })
  }
}

// POST - Create or update user settings
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = getSupabaseAdmin()

    // Check if settings exist
    const { data: existing } = await (supabase
      .from('user_settings') as any)
      .select('id, smtp_gmail_password, smtp_outlook_password, smtp_custom_password, stripe_secret_key, stripe_webhook_secret')
      .eq('user_id', userId)
      .single()

    // Prepare settings object
    const settingsData: Record<string, any> = {
      user_id: userId,
    }

    // Company settings
    if (body.company_name !== undefined) settingsData.company_name = body.company_name
    if (body.company_logo !== undefined) settingsData.company_logo = body.company_logo

    // SMTP settings
    if (body.smtp_provider !== undefined) settingsData.smtp_provider = body.smtp_provider
    if (body.smtp_gmail_user !== undefined) settingsData.smtp_gmail_user = body.smtp_gmail_user
    if (body.smtp_outlook_user !== undefined) settingsData.smtp_outlook_user = body.smtp_outlook_user
    if (body.smtp_custom_host !== undefined) settingsData.smtp_custom_host = body.smtp_custom_host
    if (body.smtp_custom_port !== undefined) settingsData.smtp_custom_port = body.smtp_custom_port
    if (body.smtp_custom_user !== undefined) settingsData.smtp_custom_user = body.smtp_custom_user
    if (body.smtp_custom_from !== undefined) settingsData.smtp_custom_from = body.smtp_custom_from
    if (body.email_from_name !== undefined) settingsData.email_from_name = body.email_from_name
    if (body.email_from_address !== undefined) settingsData.email_from_address = body.email_from_address

    // Encrypt sensitive fields if provided and not masked
    if (body.smtp_gmail_password && !body.smtp_gmail_password.includes('•')) {
      settingsData.smtp_gmail_password = encrypt(body.smtp_gmail_password)
    } else if (existing?.smtp_gmail_password && body.smtp_gmail_password?.includes('•')) {
      settingsData.smtp_gmail_password = existing.smtp_gmail_password
    }
    
    if (body.smtp_outlook_password && !body.smtp_outlook_password.includes('•')) {
      settingsData.smtp_outlook_password = encrypt(body.smtp_outlook_password)
    } else if (existing?.smtp_outlook_password && body.smtp_outlook_password?.includes('•')) {
      settingsData.smtp_outlook_password = existing.smtp_outlook_password
    }
    
    if (body.smtp_custom_password && !body.smtp_custom_password.includes('•')) {
      settingsData.smtp_custom_password = encrypt(body.smtp_custom_password)
    } else if (existing?.smtp_custom_password && body.smtp_custom_password?.includes('•')) {
      settingsData.smtp_custom_password = existing.smtp_custom_password
    }

    // Stripe settings
    if (body.stripe_publishable_key !== undefined) settingsData.stripe_publishable_key = body.stripe_publishable_key
    if (body.stripe_test_mode !== undefined) settingsData.stripe_test_mode = body.stripe_test_mode

    // Encrypt Stripe sensitive fields
    if (body.stripe_secret_key && !body.stripe_secret_key.includes('•')) {
      settingsData.stripe_secret_key = encrypt(body.stripe_secret_key)
    } else if (existing?.stripe_secret_key && body.stripe_secret_key?.includes('•')) {
      settingsData.stripe_secret_key = existing.stripe_secret_key
    }
    
    if (body.stripe_webhook_secret && !body.stripe_webhook_secret.includes('•')) {
      settingsData.stripe_webhook_secret = encrypt(body.stripe_webhook_secret)
    } else if (existing?.stripe_webhook_secret && body.stripe_webhook_secret?.includes('•')) {
      settingsData.stripe_webhook_secret = existing.stripe_webhook_secret
    }

    let result
    if (existing) {
      result = await (supabase
        .from('user_settings') as any)
        .update(settingsData)
        .eq('user_id', userId)
        .select()
        .single()
    } else {
      result = await (supabase
        .from('user_settings') as any)
        .insert(settingsData)
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error saving user settings:', result.error)
      return NextResponse.json({ error: 'Instellingen opslaan mislukt' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Instellingen opgeslagen' 
    })
  } catch (error) {
    console.error('Error in POST /api/user-settings:', error)
    return NextResponse.json({ error: 'Interne server fout' }, { status: 500 })
  }
}
