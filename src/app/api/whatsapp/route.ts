import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { z } from 'zod'

const messageSchema = z.object({
  chat_id: z.string(),
  content: z.string().min(1),
  type: z.enum(['text', 'image', 'document']).default('text')
})

const chatSchema = z.object({
  phone_number: z.string().min(1),
  name: z.string().min(1),
  contact_id: z.number().optional()
})

// GET /api/whatsapp - Haal chats en templates op
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'chats'
    
    const supabase = getSupabaseAdmin()
    
    if (type === 'templates') {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('status', 'approved')
        .order('name')

      if (error) throw error
      return NextResponse.json({ success: true, data: data || [] })
    }
    
    if (type === 'messages') {
      const chatId = searchParams.get('chat_id')
      if (!chatId) {
        return NextResponse.json(
          { success: false, error: 'chat_id is verplicht' },
          { status: 400 }
        )
      }
      
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return NextResponse.json({ success: true, data: data || [] })
    }
    
    // Default: return chats
    const { data, error } = await supabase
      .from('whatsapp_chats')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Error fetching WhatsApp:', error)
    return NextResponse.json(
      { success: false, error: 'Error fetching WhatsApp data' },
      { status: 500 }
    )
  }
}

// POST /api/whatsapp - Verstuur bericht of maak chat aan
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'message'
    
    const supabase = getSupabaseAdmin()
    
    if (action === 'chat') {
      const body = await request.json()
      const validatedData = chatSchema.parse(body)
      
      const { data, error } = await supabase
        .from('whatsapp_chats')
        .insert(validatedData)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, data })
    }
    
    // Default: send message
    const body = await request.json()
    const validatedData = messageSchema.parse(body)
    
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .insert({
        ...validatedData,
        direction: 'outgoing',
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    
    // Update chat timestamp
    await supabase
      .from('whatsapp_chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', validatedData.chat_id)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in WhatsApp POST:', error)
    return NextResponse.json(
      { success: false, error: 'Error processing WhatsApp request' },
      { status: 500 }
    )
  }
}

// PUT /api/whatsapp - Update chat of bericht
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type') || 'chat'
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is verplicht' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const supabase = getSupabaseAdmin()
    
    const table = type === 'message' ? 'whatsapp_messages' : 'whatsapp_chats'
    
    const { data, error } = await supabase
      .from(table)
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error updating WhatsApp:', error)
    return NextResponse.json(
      { success: false, error: 'Error updating WhatsApp data' },
      { status: 500 }
    )
  }
}

// DELETE /api/whatsapp?id={id} - Verwijder chat
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type') || 'chat'
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is verplicht' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const table = type === 'message' ? 'whatsapp_messages' : 'whatsapp_chats'
    
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'WhatsApp data verwijderd'
    })
  } catch (error) {
    console.error('Error deleting WhatsApp data:', error)
    return NextResponse.json(
      { success: false, error: 'Error deleting WhatsApp data' },
      { status: 500 }
    )
  }
}
