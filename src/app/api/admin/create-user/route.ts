import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/admin'

// POST /api/admin/create-user - Create admin user
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdmin(request)
    if (!(authCheck as any).ok) return authCheck as NextResponse

    const body = await request.json()
    const { email, password, name, role = 'ceo' } = body

    if (!email || !password || !name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email, wachtwoord en naam zijn verplicht' 
      }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
      },
    })

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json({ 
        success: false, 
        error: 'Kon account niet aanmaken: ' + (authError?.message || 'Onbekende fout') 
      }, { status: 500 })
    }

    const userId = authData.user.id

    // Create user record with admin role
    const { error: userError } = await (supabase
      .from('users') as any)
      .insert({
        id: userId,
        email,
        name,
        role,
        is_blocked: false,
        tokens_used: 0,
        tokens_limit: 10000,
      })

    if (userError) {
      console.error('Error creating user record:', userError)
      // Try update if exists
      await (supabase
        .from('users') as any)
        .update({ role })
        .eq('id', userId)
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        id: userId,
        email,
        name,
        role,
      },
      message: 'Admin account succesvol aangemaakt'
    })

  } catch (error) {
    console.error('Error in POST /api/admin/create-user:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Interne server fout' 
    }, { status: 500 })
  }
}
