import { NextRequest, NextResponse } from'next/server'
import { getSupabaseAdmin } from'@/lib/supabaseAdmin'
import { getUserFromRequest } from'@/lib/admin'

// GET /api/timesheets/[id] - Get a single timesheet
export async function GET(
 request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 const user = await getUserFromRequest(request)
 if (!user) {
 return NextResponse.json({ success: false, error:'Niet ingelogd'}, { status: 401 })
 }

 const { id } = await params
 const supabase = getSupabaseAdmin()

 const { data: timesheet, error } = await (supabase
 .from('timesheets') as any)
 .select('*')
 .eq('id', id)
 .eq('user_id', user.id)
 .single()

 if (error || !timesheet) {
 return NextResponse.json(
 { success: false, error:'Timesheet niet gevonden'},
 { status: 404 }
 )
 }

 return NextResponse.json({ success: true, data: timesheet })
 } catch (error) {
 console.error('Error fetching timesheet:', error)
 return NextResponse.json(
 { success: false, error:'Kon timesheet niet laden'},
 { status: 500 }
 )
 }
}

// PATCH /api/timesheets/[id] - Update a timesheet
export async function PATCH(
 request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 const user = await getUserFromRequest(request)
 if (!user) {
 return NextResponse.json({ success: false, error:'Niet ingelogd'}, { status: 401 })
 }

 const { id } = await params
 const body = await request.json()
 const { datum, projectId, project, activiteit, uren, billable, notities } = body

 const supabase = getSupabaseAdmin()

 const updateData: Record<string, any> = {}
 if (datum !== undefined) updateData.datum = datum
 if (projectId !== undefined) updateData.project_id = projectId
 if (project !== undefined) updateData.project = project
 if (activiteit !== undefined) updateData.activiteit = activiteit
 if (uren !== undefined) updateData.uren = parseFloat(uren)
 if (billable !== undefined) updateData.billable = billable
 if (notities !== undefined) updateData.notities = notities

 const { data: timesheet, error } = await (supabase
 .from('timesheets') as any)
 .update(updateData)
 .eq('id', id)
 .eq('user_id', user.id)
 .select()
 .single()

 if (error) throw error

 return NextResponse.json({ success: true, data: timesheet })
 } catch (error) {
 console.error('Error updating timesheet:', error)
 return NextResponse.json(
 { success: false, error:'Kon timesheet niet bijwerken'},
 { status: 500 }
 )
 }
}

// DELETE /api/timesheets/[id] - Delete a timesheet
export async function DELETE(
 request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 const user = await getUserFromRequest(request)
 if (!user) {
 return NextResponse.json({ success: false, error:'Niet ingelogd'}, { status: 401 })
 }

 const { id } = await params
 const supabase = getSupabaseAdmin()

 const { error } = await (supabase
 .from('timesheets') as any)
 .delete()
 .eq('id', id)
 .eq('user_id', user.id)

 if (error) throw error

 return NextResponse.json({ success: true })
 } catch (error) {
 console.error('Error deleting timesheet:', error)
 return NextResponse.json(
 { success: false, error:'Kon timesheet niet verwijderen'},
 { status: 500 }
 )
 }
}
