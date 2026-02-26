import { NextRequest, NextResponse } from'next/server'
import { getUserFromRequest } from'@/lib/admin'
import { PDFDocument, rgb, StandardFonts } from'pdf-lib'

type PreviewType = 'offerte'|'factuur'
type PreviewTemplate = 'modern'|'classic'|'minimal'

function getTemplateAccent(template: PreviewTemplate) {
 if (template ==='classic') return rgb(0.18, 0.24, 0.33)
 if (template ==='minimal') return rgb(0.12, 0.12, 0.12)
 return rgb(0.1, 0.42, 0.85)
}

async function buildPreviewPdf(type: PreviewType, template: PreviewTemplate) {
 const pdfDoc = await PDFDocument.create()
 const page = pdfDoc.addPage([595.28, 841.89]) // A4
 const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
 const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
 const accent = getTemplateAccent(template)
 const { width, height } = page.getSize()

 page.drawRectangle({
 x: 0,
 y: height - 92,
 width,
 height: 92,
 color: accent,
 })

 page.drawText(type ==='offerte'?'Offerte Preview':'Factuur Preview', {
 x: 40,
 y: height - 56,
 size: 24,
 font: bold,
 color: rgb(1, 1, 1),
 })

 page.drawText(`Template: ${template}`, {
 x: 40,
 y: height - 82,
 size: 12,
 font,
 color: rgb(0.9, 0.95, 1),
 })

 page.drawRectangle({
 x: 40,
 y: height - 230,
 width: width - 80,
 height: 120,
 borderColor: rgb(0.85, 0.88, 0.93),
 borderWidth: 1,
 color: rgb(0.97, 0.98, 1),
 })

 page.drawText('Bedrijf: ArchonPro', { x: 56, y: height - 142, size: 11, font, color: rgb(0.2, 0.22, 0.26) })
 page.drawText('Klant: Voorbeeld BV', { x: 56, y: height - 160, size: 11, font, color: rgb(0.2, 0.22, 0.26) })
 page.drawText('Datum: 26-02-2026', { x: 56, y: height - 178, size: 11, font, color: rgb(0.2, 0.22, 0.26) })

 page.drawRectangle({
 x: 40,
 y: height - 520,
 width: width - 80,
 height: 250,
 borderColor: rgb(0.85, 0.88, 0.93),
 borderWidth: 1,
 })

 page.drawText('Omschrijving', { x: 56, y: height - 296, size: 10, font: bold, color: rgb(0.16, 0.18, 0.22) })
 page.drawText('Aantal', { x: 340, y: height - 296, size: 10, font: bold, color: rgb(0.16, 0.18, 0.22) })
 page.drawText('Prijs', { x: 410, y: height - 296, size: 10, font: bold, color: rgb(0.16, 0.18, 0.22) })
 page.drawText('Totaal', { x: 490, y: height - 296, size: 10, font: bold, color: rgb(0.16, 0.18, 0.22) })

 page.drawText('Consultancy diensten', { x: 56, y: height - 324, size: 10, font, color: rgb(0.24, 0.26, 0.31) })
 page.drawText('8', { x: 348, y: height - 324, size: 10, font, color: rgb(0.24, 0.26, 0.31) })
 page.drawText('€95', { x: 414, y: height - 324, size: 10, font, color: rgb(0.24, 0.26, 0.31) })
 page.drawText('€760', { x: 492, y: height - 324, size: 10, font, color: rgb(0.24, 0.26, 0.31) })

 page.drawText('Template weergave gegenereerd door ArchonPro', {
 x: 40,
 y: 36,
 size: 9,
 font,
 color: rgb(0.45, 0.48, 0.54),
 })

 return pdfDoc.save()
}

export async function POST(request: NextRequest) {
 try {
 const user = await getUserFromRequest(request)
 if (!user) {
 return NextResponse.json(
 { success: false, error:'Niet geautoriseerd'},
 { status: 401 }
 )
 }

 const body = await request.json()
 const { type, template } = body as { type?: string; template?: string }

 if (type !=='offerte'&& type !=='factuur') {
 return NextResponse.json(
 { success: false, error:'Ongeldig type. Gebruik offerte of factuur.' },
 { status: 400 }
 )
 }

 if (template !=='modern'&& template !=='classic'&& template !=='minimal') {
 return NextResponse.json(
 { success: false, error:'Ongeldig template. Gebruik modern, classic of minimal.' },
 { status: 400 }
 )
 }

 const pdfBytes = await buildPreviewPdf(type, template)
 const previewBase64 = Buffer.from(pdfBytes).toString('base64')

 return NextResponse.json({
 success: true,
 previewBase64,
 mimeType:'application/pdf',
 message: `${type} preview met ${template} template gegenereerd`
 })
 } catch (error) {
 console.error('Error in /api/pdf-preview POST:', error)
 return NextResponse.json(
 { success: false, error:'Server fout'},
 { status: 500 }
 )
 }
}
