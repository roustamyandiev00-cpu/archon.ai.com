import { NextRequest, NextResponse } from'next/server'
import { getSupabaseAdmin } from'@/lib/supabaseAdmin'
import { getUserFromRequest } from'@/lib/admin'

// GET /api/timesheets - Get all timesheets for user, optionally filtered by week
export async function GET(request: NextRequest) {
 try {
 const user = await getUserFromRequest(request)
 if (!user) {
 return NextResponse.json({ success: false, error:'Niet ingelogd'}, { status: 401 })
 }

 const { searchParams } = new URL(request.url)
 const weekStart = searchParams.get('weekStart')
 const weekEnd = searchParams.get('weekEnd')

 const supabase = getSupabaseAdmin()

 let query = (supabase
 .from('timesheets') as any)
 .select('*')
 .eq('user_id', user.id)
 .order('datum', { ascending: false })

 if (weekStart && weekEnd) {
 query = query.gte('datum', weekStart).lte('datum', weekEnd)
 }

 const { data: timesheets, error } = await query

 if (error) throw error

 return NextResponse.json(timesheets)
 } catch (error) {
 console.error('Error fetching timesheets:', error)
 return NextResponse.json(
 { success: false, error:'Kon timesheets niet laden'},
 { status: 500 }
 )
 }
}

// POST /api/timesheets - Create a new timesheet entry
export async function POST(request: NextRequest) {
 try {
 const user = await getUserFromRequest(request)
 if (!user) {
 return NextResponse.json({ success: false, error:'Niet ingelogd'}, { status: 401 })
 }

 const body = await request.json()
 const { datum, projectId, project, activiteit, uren, billable, notities } = body

 if (!project || !activiteit || uren === undefined) {
 return NextResponse.json(
 { success: false, error:'Project, activiteit en uren zijn verplicht'},
 { status: 400 }
 )
 }

 const supabase = getSupabaseAdmin()

 const { data: timesheet, error } = await (supabase
 .from('timesheets') as any)
 .insert({
 user_id: user.id,
 datum: datum || new Date().toISOString().split('T')[0],
 project_id: projectId || null,
 project,
 activiteit,
 uren: parseFloat(uren),
 billable: billable ?? true,
 notities: notities || null,
 })
 .select()
 .single()

 if (error) throw error

 return NextResponse.json({ success: true, data: timesheet })
 } catch (error) {
 console.error('Error creating timesheet:', error)
 return NextResponse.json(
 { success: false, error:'Kon timesheet niet aanmaken'},
 { status: 500 }
 )
 }
}
