import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { getUserFromRequest } from '@/lib/admin'

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const UpdateTimesheetSchema = z.object({
 datum: IsoDateSchema.optional(),
 projectId: z.string().trim().min(1).nullable().optional(),
 project: z.string().trim().min(1).optional(),
 activiteit: z.string().trim().min(1).optional(),
 uren: z.coerce.number().positive().max(24).optional(),
 billable: z.boolean().optional(),
 notities: z.string().trim().nullable().optional(),
})

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
 const validated = UpdateTimesheetSchema.parse(body)

 const supabase = getSupabaseAdmin()

 const updateData: Record<string, any> = {}
 if (validated.datum !== undefined) updateData.datum = validated.datum
 if (validated.projectId !== undefined) updateData.project_id = validated.projectId
 if (validated.project !== undefined) updateData.project = validated.project
 if (validated.activiteit !== undefined) updateData.activiteit = validated.activiteit
 if (validated.uren !== undefined) updateData.uren = validated.uren
 if (validated.billable !== undefined) updateData.billable = validated.billable
 if (validated.notities !== undefined) updateData.notities = validated.notities

 if (Object.keys(updateData).length === 0) {
 return NextResponse.json(
 { success: false, error: 'Geen wijzigingen opgegeven' },
 { status: 400 }
 )
 }

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
 if (error instanceof z.ZodError) {
 return NextResponse.json(
 { success: false, error: 'Validatiefout', details: error.issues },
 { status: 400 }
 )
 }
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
