import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const adminSupabase = getSupabaseAdmin()
    
    // Get current auth configuration
    const { data: config, error } = await adminSupabase.auth.admin.getConfig()
    
    if (error) {
      console.error('Error getting auth config:', error)
      return NextResponse.json(
        { error: 'Failed to get auth configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        email_confirm: config?.MAILER_SECURE_EMAIL_CHANGE_ENABLED || false,
        email_confirm_signup: config?.DISABLE_SIGNUP || false,
        // Add other relevant config fields
      }
    })

  } catch (error) {
    console.error('Error in supabase config check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { enable_email_confirmations } = body

    const adminSupabase = getSupabaseAdmin()
    
    // Update auth configuration
    const { data, error } = await adminSupabase.auth.admin.updateConfig({
      MAILER_SECURE_EMAIL_CHANGE_ENABLED: enable_email_confirmations,
      DISABLE_SIGNUP: false, // Keep signup enabled
    })
    
    if (error) {
      console.error('Error updating auth config:', error)
      return NextResponse.json(
        { error: 'Failed to update auth configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Auth configuration updated successfully',
      data
    })

  } catch (error) {
    console.error('Error updating supabase config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}