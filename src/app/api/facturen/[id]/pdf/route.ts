import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { factuurSelect, normalizeFactuurRow } from '@/app/api/facturen/factuur-utils'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  let supabase: ReturnType<typeof getSupabaseAdmin>
  try {
    supabase = getSupabaseAdmin()
  } catch {
    return NextResponse.json({ error: 'Supabase admin client is niet geconfigureerd.' }, { status: 503 })
  }

  try {
    const { id: idParam } = await params
    const id = Number(idParam)
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })
    }

    // Fetch facture data
    const { data: raw, error } = await supabase
      .from('facturen')
      .select(factuurSelect)
      .eq('id', id)
      .single()

    if (error || !raw) {
      return NextResponse.json({ error: 'Factuur niet gevonden' }, { status: 404 })
    }

    const factuur = normalizeFactuurRow(raw)

    // Generate PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89]) // A4 size in points
    const { width, height } = page.getSize()

    // Load fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Colors
    const black = rgb(0, 0, 0)
    const gray = rgb(0.5, 0.5, 0.5)
    const lightGray = rgb(0.9, 0.9, 0.9)

    let yPosition = height - 50

    // Header
    page.drawText('FACTUUR', {
      x: 50,
      y: yPosition,
      size: 24,
      font: helveticaBoldFont,
      color: black,
    })

    page.drawText(`Factuurnummer: ${factuur.nummer}`, {
      x: 350,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    })

    yPosition -= 30

    // Facture details
    page.drawText(`Datum: ${factuur.datum || 'Niet opgegeven'}`, {
      x: 350,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    })

    if (factuur.vervalDatum) {
      yPosition -= 20
      page.drawText(`Vervaldatum: ${factuur.vervalDatum}`, {
        x: 350,
        y: yPosition,
        size: 12,
        font: helveticaFont,
        color: black,
      })
    }

    yPosition -= 40

    // Customer info
    page.drawText('Factuur aan:', {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
      color: black,
    })

    yPosition -= 20
    page.drawText(factuur.klant, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    })

    if (factuur.klantEmail) {
      yPosition -= 15
      page.drawText(factuur.klantEmail, {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaFont,
        color: black,
      })
    }

    yPosition -= 40

    // Items table header
    const tableTop = yPosition
    page.drawRectangle({
      x: 50,
      y: yPosition - 15,
      width: width - 100,
      height: 25,
      color: lightGray,
    })

    page.drawText('Omschrijving', {
      x: 60,
      y: yPosition - 5,
      size: 12,
      font: helveticaBoldFont,
      color: black,
    })

    page.drawText('Aantal', {
      x: 350,
      y: yPosition - 5,
      size: 12,
      font: helveticaBoldFont,
      color: black,
    })

    page.drawText('Prijs', {
      x: 400,
      y: yPosition - 5,
      size: 12,
      font: helveticaBoldFont,
      color: black,
    })

    page.drawText('Totaal', {
      x: 480,
      y: yPosition - 5,
      size: 12,
      font: helveticaBoldFont,
      color: black,
    })

    yPosition -= 25

    // Items
    factuur.items.forEach((item: any) => {
      const description = item.description || item.omschrijving || 'Geen omschrijving'
      const quantity = Number(item.quantity || item.aantal || 0)
      const price = Number(item.price || item.prijs || 0)
      const total = quantity * price

      page.drawText(description, {
        x: 60,
        y: yPosition,
        size: 11,
        font: helveticaFont,
        color: black,
      })

      page.drawText(quantity.toString(), {
        x: 350,
        y: yPosition,
        size: 11,
        font: helveticaFont,
        color: black,
      })

      page.drawText(`€${price.toFixed(2)}`, {
        x: 400,
        y: yPosition,
        size: 11,
        font: helveticaFont,
        color: black,
      })

      page.drawText(`€${total.toFixed(2)}`, {
        x: 480,
        y: yPosition,
        size: 11,
        font: helveticaFont,
        color: black,
      })

      yPosition -= 20
    })

    // Totals
    yPosition -= 20
    const totalsY = yPosition

    // Line above totals
    page.drawLine({
      start: { x: 350, y: yPosition + 10 },
      end: { x: width - 50, y: yPosition + 10 },
      thickness: 1,
      color: gray,
    })

    page.drawText('Subtotaal:', {
      x: 350,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    })

    page.drawText(`€${factuur.bedrag.toFixed(2)}`, {
      x: 480,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    })

    yPosition -= 20
    page.drawText('BTW:', {
      x: 350,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    })

    page.drawText(`€${factuur.btwBedrag.toFixed(2)}`, {
      x: 480,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    })

    yPosition -= 20
    page.drawText('Totaal:', {
      x: 350,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
      color: black,
    })

    page.drawText(`€${factuur.totaalBedrag.toFixed(2)}`, {
      x: 480,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
      color: black,
    })

    // Status
    yPosition -= 60
    page.drawText(`Status: ${factuur.status}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    })

    if (factuur.betaaldOp) {
      yPosition -= 20
      page.drawText(`Betaald op: ${factuur.betaaldOp}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaFont,
        color: black,
      })
    }

    // Notes
    if (factuur.notities) {
      yPosition -= 40
      page.drawText('Opmerkingen:', {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaBoldFont,
        color: black,
      })

      const notesLines = factuur.notities.split('\n')
      notesLines.forEach((line: string) => {
        yPosition -= 15
        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaFont,
          color: black,
        })
      })
    }

    // Serialize the PDF
    const pdfBytes = await pdfDoc.save()

    // Upload to Supabase Storage
    const fileName = `factuur-${factuur.nummer}.pdf`
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('facturen')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Kon PDF niet uploaden' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('facturen')
      .getPublicUrl(fileName)

    // Update facture with PDF URL
    const { error: updateError } = await (supabase as any)
      .from('facturen')
      .update({ pdf_url: publicUrl })
      .eq('id', id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Kon factuur niet bijwerken' }, { status: 500 })
    }

    return NextResponse.json({ pdfUrl: publicUrl })
  } catch (error: any) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: error.message || 'Kon PDF niet genereren' }, { status: 500 })
  }
}
