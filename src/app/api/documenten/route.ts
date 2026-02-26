// @ts-nocheck - Supabase type inference issues
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { z } from 'zod'

const documentSchema = z.object({
  titel: z.string().min(1),
  beschrijving: z.string().optional(),
  categorie: z.string().optional(),
  bedrijf_id: z.number().optional(),
  project_id: z.number().optional(),
  contact_id: z.number().optional()
})

// GET /api/documenten - Haal alle documenten op
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('documenten')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Error fetching documenten:', error)
    return NextResponse.json(
      { success: false, error: 'Error fetching documenten' },
      { status: 500 }
    )
  }
}

// POST /api/documenten - Upload nieuw document
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const metadataJson = formData.get('metadata') as string
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Bestand is verplicht' },
        { status: 400 }
      )
    }

    const metadata = metadataJson ? JSON.parse(metadataJson) : {}
    const validatedData = documentSchema.parse(metadata)

    const supabase = getSupabaseAdmin()
    
    // Upload file to storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    // Save metadata to database
    const { data, error } = await supabase
      .from('documenten')
      .insert({
        ...validatedData,
        bestandsnaam: file.name,
        bestandsgrootte: file.size,
        mime_type: file.type,
        storage_pad: fileName,
        public_url: urlData.publicUrl
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { success: false, error: 'Error uploading document' },
      { status: 500 }
    )
  }
}

// PUT /api/documenten?id={id} - Update document metadata
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is verplicht' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = documentSchema.partial().parse(body)

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('documenten')
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
    console.error('Error updating document:', error)
    return NextResponse.json(
      { success: false, error: 'Error updating document' },
      { status: 500 }
    )
  }
}

// DELETE /api/documenten?id={id} - Verwijder document
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is verplicht' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    
    // Get document info first
    const { data: doc, error: fetchError } = await supabase
      .from('documenten')
      .select('storage_pad')
      .eq('id', id)
      .single()
    
    if (fetchError) throw fetchError

    // Delete from storage
    if (doc?.storage_pad) {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.storage_pad])
      
      if (storageError) console.error('Error deleting from storage:', storageError)
    }

    // Delete from database
    const { error } = await supabase
      .from('documenten')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Document verwijderd'
    })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { success: false, error: 'Error deleting document' },
      { status: 500 }
    )
  }
}
