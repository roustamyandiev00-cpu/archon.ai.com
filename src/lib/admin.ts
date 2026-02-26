import { NextRequest, NextResponse } from'next/server'
import { getSupabaseAdmin } from'./supabaseAdmin'

function extractToken(req: NextRequest) {
 const auth = req.headers.get('authorization')
 if (auth && auth.startsWith('Bearer')) return auth.split('')[1]

 // Supabase stores access token in cookies with names like'sb-access-token'or'session'
 const token = req.cookies.get('sb-access-token')?.value || req.cookies.get('session')?.value || req.cookies.get('token')?.value
 return token ?? null
}

export async function requireAdmin(req: NextRequest): Promise<{ ok: true; userId: string } | NextResponse> {
 const token = extractToken(req)
 if (!token) {
 return NextResponse.json({ success: false, error:'Unauthorized'}, { status: 401 })
 }

 const supabaseAdmin = getSupabaseAdmin()
 try {
 const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token as string)
 if (authError || !user) {
 console.error('Auth error in requireAdmin:', authError)
 return NextResponse.json({ success: false, error:'Unauthorized'}, { status: 401 })
 }

 // Check role and blocked status - columns added by migrations
 const { data, error } = await (supabaseAdmin.from('users') as any).select('id, role, is_blocked').eq('id', user.id).limit(1).single()
 if (error) {
 console.error('Error fetching user role:', error)
 return NextResponse.json({ success: false, error:'Interne server fout'}, { status: 500 })
 }

 if (data.is_blocked) {
 return NextResponse.json({ success: false, error:'Account geblokkeerd'}, { status: 403 })
 }

 if (!['admin','ceo','super_admin'].includes((data.role ||'').toLowerCase())) {
 return NextResponse.json({ success: false, error:'Forbidden'}, { status: 403 })
 }

 return { ok: true, userId: user.id }
 } catch (err) {
 console.error('Unexpected error in requireAdmin:', err)
 return NextResponse.json({ success: false, error:'Interne server fout'}, { status: 500 })
 }
}

export async function getUserFromRequest(req: NextRequest) {
 const token = extractToken(req)
 if (!token) return null
 const supabaseAdmin = getSupabaseAdmin()
 const { data: { user }, error } = await supabaseAdmin.auth.getUser(token as string)
 if (error) return null
 return user
}
