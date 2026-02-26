import { NextRequest, NextResponse } from'next/server'
import { getSupabaseAdmin } from'@/lib/supabaseAdmin'
import { getUserFromRequest } from'@/lib/admin'

export async function POST(request: NextRequest) {
 try {
 // Get the current user
 const user = await getUserFromRequest(request)
 if (!user) {
 return NextResponse.json(
 { success: false, error:'Niet geautoriseerd'},
 { status: 401 }
 )
 }

 const formData = await request.formData()
 const file = formData.get('file') as File
 const type = formData.get('type') as string
 const projectId = formData.get('projectId') as string | null

 if (!file) {
 return NextResponse.json(
 { success: false, error:'Geen bestand gevonden'},
 { status: 400 }
 )
 }

 // Validate file size (max 10MB)
 const maxSize = 10 * 1024 * 1024 // 10MB
 if (file.size > maxSize) {
 return NextResponse.json(
 { success: false, error:'Bestand is te groot (max 10MB)'},
 { status: 400 }
 )
 }

 // Generate unique filename
 const timestamp = Date.now()
 const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g,'_')
 const fileName = `${timestamp}_${sanitizedName}`
 
 // Determine file path based on project context
 let filePath: string
 if (projectId && projectId !=='all') {
 filePath = `${user.id}/projects/${projectId}/${fileName}`
 } else {
 filePath = `${user.id}/${fileName}`
 }

 // Convert file to buffer
 const bytes = await file.arrayBuffer()
 const buffer = Buffer.from(bytes)

 // Upload to Supabase Storage using admin client
 const supabase = getSupabaseAdmin()
 const { data, error } = await supabase.storage
 .from('user-assets')
 .upload(filePath, buffer, {
 contentType: file.type,
 upsert: false
 })

 if (error) {
 console.error('Upload error:', error)
 return NextResponse.json(
 { success: false, error:'Upload mislukt'},
 { status: 500 }
 )
 }

 return NextResponse.json({
 success: true,
 data: {
 path: data.path,
 fileName: fileName,
 size: file.size,
 type: file.type
 }
 })

 } catch (error) {
 console.error('Upload API error:', error)
 return NextResponse.json(
 { success: false, error:'Server fout'},
 { status: 500 }
 )
 }
}