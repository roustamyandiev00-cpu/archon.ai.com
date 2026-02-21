import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/admin'

// GET - List all users
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdmin(request)
    if (!(authCheck as any).ok) return authCheck as NextResponse

    const supabase = getSupabaseAdmin()
    
    // Get all users with their settings
    const { data: users, error } = await (supabase
      .from('users') as any)
      .select(`
        id,
        email,
        created_at,
        role,
        is_blocked,
        subscription_tier,
        trial_ends_at,
        tokens_used,
        tokens_limit
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Kon gebruikers niet ophalen' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: users || [] 
    })
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json({ error: 'Interne server fout' }, { status: 500 })
  }
}

// PUT - Update user (block/unblock, change subscription)
export async function PUT(request: NextRequest) {
  try {
    const authCheck = await requireAdmin(request)
    if (!(authCheck as any).ok) return authCheck as NextResponse

    const body = await request.json()
    const { userId: targetUserId, is_blocked, subscription_tier, tokens_limit } = body

    if (!targetUserId) {
      return NextResponse.json({ error: 'Gebruiker ID vereist' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const updateData: Record<string, any> = {}

    if (is_blocked !== undefined) updateData.is_blocked = is_blocked
    if (subscription_tier !== undefined) updateData.subscription_tier = subscription_tier
    if (tokens_limit !== undefined) updateData.tokens_limit = tokens_limit

    const { error } = await (supabase
      .from('users') as any)
      .update(updateData)
      .eq('id', targetUserId)

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json({ error: 'Kon gebruiker niet bijwerken' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Gebruiker bijgewerkt' 
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/users:', error)
    return NextResponse.json({ error: 'Interne server fout' }, { status: 500 })
  }
}

