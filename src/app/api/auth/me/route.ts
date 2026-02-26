import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Niet geautoriseerd' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        phone: user.user_metadata?.phone || null,
        language: user.user_metadata?.language || 'nl',
        avatar: user.user_metadata?.avatar_url || null,
        role: user.user_metadata?.role || 'user'
      }
    })
  } catch (error) {
    console.error('Error in /api/auth/me:', error)
    return NextResponse.json(
      { success: false, error: 'Server fout' },
      { status: 500 }
    )
  }
}