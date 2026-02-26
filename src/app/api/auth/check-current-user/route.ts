import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        message: 'No user session found'
      })
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      data: {
        user_id: session.user.id,
        email: session.user.email,
        email_confirmed_at: session.user.email_confirmed_at,
        email_verified: !!session.user.email_confirmed_at,
        created_at: session.user.created_at,
        last_sign_in_at: session.user.last_sign_in_at,
        user_metadata: session.user.user_metadata
      }
    })

  } catch (error) {
    console.error('Error checking current user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}