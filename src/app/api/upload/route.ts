import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

// Helper to get user ID from request
async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    // Check cookies fallback
    const token = request.cookies.get('sb-access-token')?.value || 
                  request.cookies.get('session')?.value
    if (!token) return null
    
    try {
      const supabase = getSupabaseAdmin()
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (error || !user) return null
      return user.id
    } catch {
      return null
    }
  }
  
  const token = authHeader.slice(7)
  
  try {
    const supabase = getSupabaseAdmin()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return null
    return user.id
  } catch {
    return null
  }
}

// POST - Upload file to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'general'

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand gevonden' }, { status: 400 })
    }

    // Validate file
    const maxSize = 5 * 1024 * 1024 // 5MB limit matched with migration
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Bestand is te groot (max 5MB)' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Formaat niet toegestaan (JPG, PNG, WEBP, PDF)' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Generate unique path: {userId}/{type}_{timestamp}.{ext}
    const timestamp = Date.now()
    const ext = file.name.split('.').pop()
    const filePath = `${userId}/${type}_${timestamp}.${ext}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Supabase Storage Error:', uploadError)
      return NextResponse.json({ error: 'Fout bij opslaan in cloud storage' }, { status: 500 })
    }

    // Generate Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-assets')
      .getPublicUrl(filePath)

    // Update database metadata based on type
    if (type === 'avatar') {
      await (supabase
        .from('users') as any)
        .update({ avatar_url: publicUrl })
        .eq('id', userId)
    }

    if (type === 'logo') {
      await (supabase
        .from('user_settings') as any)
        .update({ company_logo: publicUrl })
        .eq('user_id', userId)
    }

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      path: filePath,
      message: 'Bestand succesvol opgeslagen in ArchonPro Storage' 
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Upload mislukt' }, { status: 500 })
  }
}
