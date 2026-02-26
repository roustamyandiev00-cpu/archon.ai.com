import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { getUserFromRequest } from '@/lib/admin'

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const CreateTimesheetSchema = z.object({
 datum: IsoDateSchema.optional(),
 projectId: z.string().trim().min(1).nullable().optional(),
 project: z.string().trim().min(1, 'Project is verplicht.'),
 activiteit: z.string().trim().min(1, 'Activiteit is verplicht.'),
 uren: z.coerce
  .number()
  .positive('Uren moeten groter zijn dan 0.')
  .max(24, 'Uren mogen maximaal 24 per dag zijn.'),
 billable: z.boolean().optional(),
 notities: z.string().trim().nullable().optional(),
})

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

 if ((weekStart && !weekEnd) || (!weekStart && weekEnd)) {
 return NextResponse.json(
 { success: false, error: 'Gebruik weekStart en weekEnd samen.' },
 { status: 400 }
 )
 }

 if (weekStart && weekEnd) {
 const parsedStart = IsoDateSchema.safeParse(weekStart)
 const parsedEnd = IsoDateSchema.safeParse(weekEnd)
 if (!parsedStart.success || !parsedEnd.success) {
 return NextResponse.json(
 { success: false, error: 'Week filters moeten in formaat YYYY-MM-DD zijn.' },
 { status: 400 }
 )
 }
 }

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
 const validated = CreateTimesheetSchema.parse(body)

 const supabase = getSupabaseAdmin()

 const { data: timesheet, error } = await (supabase
 .from('timesheets') as any)
 .insert({
 user_id: user.id,
 datum: validated.datum || new Date().toISOString().split('T')[0],
 project_id: validated.projectId || null,
 project: validated.project,
 activiteit: validated.activiteit,
 uren: validated.uren,
 billable: validated.billable ?? true,
 notities: validated.notities || null,
 })
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
 console.error('Error creating timesheet:', error)
 return NextResponse.json(
 { success: false, error:'Kon timesheet niet aanmaken'},
 { status: 500 }
 )
 }
}
