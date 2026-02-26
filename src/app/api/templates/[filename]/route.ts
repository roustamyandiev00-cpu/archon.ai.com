import { NextRequest, NextResponse } from'next/server'
import { getUserFromRequest } from'@/lib/admin'
import { readFile } from'fs/promises'
import { join } from'path'

export async function GET(
 request: NextRequest,
 { params }: { params: Promise<{ filename: string }> }
) {
 try {
 const user = await getUserFromRequest(request)
 if (!user) {
 return NextResponse.json(
 { success: false, error:'Niet geautoriseerd'},
 { status: 401 }
 )
 }

 const { filename } = await params
 
 // Validate filename to prevent directory traversal
 if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
 return NextResponse.json(
 { success: false, error:'Ongeldige bestandsnaam'},
 { status: 400 }
 )
 }

 // Only allow specific template files
 const allowedTemplates = [
'quotation-variant-1a-basic.docx',
'quotation-variant-3-header.docx',
'invoice-variant-1-basic.docx',
'invoice-variant-3-header.docx',
'example-quotation-template.docx'
 ]

 if (!allowedTemplates.includes(filename)) {
 return NextResponse.json(
 { success: false, error:'Template niet gevonden'},
 { status: 404 }
 )
 }

 // Read the template file
 const filePath = join(process.cwd(),'templates', filename)
 const fileBuffer = await readFile(filePath)
 
 // Set appropriate headers for Word document download
 const headers = new Headers()
 headers.set('Content-Type','application/vnd.openxmlformats-officedocument.wordprocessingml.document')
 headers.set('Content-Disposition', `inline; filename="${filename}"`)
 headers.set('Cache-Control','public, max-age=3600') // Cache for 1 hour

 return new NextResponse(fileBuffer, {
 status: 200,
 headers
 })

 } catch (error) {
 console.error('Error serving template:', error)
 return NextResponse.json(
 { success: false, error:'Template niet gevonden'},
 { status: 404 }
 )
 }
}
