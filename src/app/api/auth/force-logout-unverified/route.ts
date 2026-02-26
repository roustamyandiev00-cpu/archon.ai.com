import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if email is verified
    if (!session.user.email_confirmed_at) {
      // Force logout unverified user
      await supabase.auth.signOut()
      
      return NextResponse.json({
        success: true,
        message: 'Unverified user logged out',
        email: session.user.email,
        redirect: `/auth/verify-email?email=${encodeURIComponent(session.user.email || '')}`
      })
    }

    return NextResponse.json({
      success: true,
      message: 'User is verified',
      verified: true
    })

  } catch (error) {
    console.error('Error in force logout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}