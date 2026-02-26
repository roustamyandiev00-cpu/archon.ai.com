import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

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
    const supabase = createClient()
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
      { success: false, error: 'Error fetching agenda items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = agendaSchema.parse(body)

    const supabase = createClient()
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
      { success: false, error: 'Error creating agenda item' },
      { status: 500 }
    )
  }
}
