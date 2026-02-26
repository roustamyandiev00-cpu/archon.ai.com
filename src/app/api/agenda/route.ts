// @ts-nocheck - Supabase type inference issues
import { NextRequest, NextResponse } from'next/server'
import { getSupabaseAdmin } from'@/lib/supabaseAdmin'
import { z } from'zod'

const agendaSchema = z.object({
 titel: z.string().min(1),
 beschrijving: z.string().optional(),
 start_tijd: z.string(),
 eind_tijd: z.string().optional(),
 locatie: z.string().optional(),
 deelnemers: z.array(z.string()).optional(),
 bedrijf_id: z.number().optional()
})

export async function GET(request: NextRequest) {
 try {
 const supabase = getSupabaseAdmin()
 const { data, error } = await supabase
 .from('afspraken')
 .select('*')
 .order('start_tijd', { ascending: true })

 if (error) throw error

 return NextResponse.json({
 success: true,
 data: data || []
 })
 } catch (error) {
 console.error('Error fetching agenda:', error)
 return NextResponse.json(
 { success: false, error:'Error fetching agenda items'},
 { status: 500 }
 )
 }
}

export async function POST(request: NextRequest) {
 try {
 const body = await request.json()
 const validatedData = agendaSchema.parse(body)

 const supabase = getSupabaseAdmin()
 const { data, error } = await supabase
 .from('afspraken')
 .insert(validatedData)
 .select()
 .single()

 if (error) throw error

 return NextResponse.json({
 success: true,
 data
 })
 } catch (error) {
 console.error('Error creating agenda item:', error)
 return NextResponse.json(
 { success: false, error:'Error creating agenda item'},
 { status: 500 }
 )
 }
}

// PUT /api/agenda?id={id} - Update agenda item
export async function PUT(request: NextRequest) {
 try {
 const { searchParams } = new URL(request.url)
 const id = searchParams.get('id')
 
 if (!id) {
 return NextResponse.json(
 { success: false, error:'ID is verplicht'},
 { status: 400 }
 )
 }

 const body = await request.json()
 const validatedData = agendaSchema.partial().parse(body)

 const supabase = getSupabaseAdmin()
 const { data, error } = await supabase
 .from('afspraken')
 .update(validatedData)
 .eq('id', id)
 .select()
 .single()

 if (error) throw error

 return NextResponse.json({
 success: true,
 data
 })
 } catch (error) {
 console.error('Error updating agenda item:', error)
 return NextResponse.json(
 { success: false, error:'Error updating agenda item'},
 { status: 500 }
 )
 }
}

// DELETE /api/agenda?id={id} - Verwijder agenda item
export async function DELETE(request: NextRequest) {
 try {
 const { searchParams } = new URL(request.url)
 const id = searchParams.get('id')
 
 if (!id) {
 return NextResponse.json(
 { success: false, error:'ID is verplicht'},
 { status: 400 }
 )
 }

 const supabase = getSupabaseAdmin()
 const { error } = await supabase
 .from('afspraken')
 .delete()
 .eq('id', id)

 if (error) throw error

 return NextResponse.json({
 success: true,
 message:'Agenda item verwijderd'
 })
 } catch (error) {
 console.error('Error deleting agenda item:', error)
 return NextResponse.json(
 { success: false, error:'Error deleting agenda item'},
 { status: 500 }
 )
 }
}
