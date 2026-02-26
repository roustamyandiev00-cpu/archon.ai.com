import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { getUserFromRequest } from '@/lib/admin'

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Niet geautoriseerd' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const supabase = getSupabaseAdmin()

    // Update user metadata in auth.users
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        full_name: body.name,
        name: body.name,
        phone: body.phone,
        language: body.language
      }
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in /api/user/profile PUT:', error)
    return NextResponse.json(
      { success: false, error: 'Server fout' },
      { status: 500 }
    )
  }
}