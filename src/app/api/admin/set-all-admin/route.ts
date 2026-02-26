import { NextRequest, NextResponse } from'next/server'
import { getSupabaseAdmin } from'@/lib/supabaseAdmin'
import { requireAdmin } from'@/lib/admin'

// POST /api/admin/set-all-admin - Set all users to admin role
export async function POST(request: NextRequest) {
 try {
 const authCheck = await requireAdmin(request)
 if (!(authCheck as any).ok) return authCheck as NextResponse

 const supabase = getSupabaseAdmin()

 // Get all users from auth
 const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
 
 if (listError) {
 return NextResponse.json({ 
 success: false, 
 error:'Kon gebruikers niet ophalen:'+ listError.message 
 }, { status: 500 })
 }

 const results: Array<{
 id: string
 email?: string
 updated: boolean
 error?: string
 }> = []
 
 for (const user of users) {
 // Update role in users table
 const { error: updateError } = await (supabase
 .from('users') as any)
 .update({ role:'ceo'})
 .eq('id', user.id)
 
 results.push({
 id: user.id,
 email: user.email,
 updated: !updateError,
 error: updateError?.message
 })
 }

 return NextResponse.json({ 
 success: true, 
 data: results,
 message: `${users.length} gebruikers bijgewerkt naar ceo rol`
 })

 } catch (error) {
 console.error('Error in POST /api/admin/set-all-admin:', error)
 return NextResponse.json({ 
 success: false, 
 error:'Interne server fout'
 }, { status: 500 })
 }
}
