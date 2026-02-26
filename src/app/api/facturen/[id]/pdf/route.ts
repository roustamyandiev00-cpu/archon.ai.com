import { NextRequest, NextResponse } from'next/server'
import { getSupabaseAdmin } from'@/lib/supabaseAdmin'
import { getUserFromRequest } from'@/lib/admin'
import logger from'@/lib/logger'
import { factuurSelect, normalizeFactuurRow } from'../../factuur-utils'

export async function POST(
 request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 const user = await getUserFromRequest(request)
 if (!user) {
 return NextResponse.json({ error:'Niet ingelogd'}, { status: 401 })
 }

 let supabase: ReturnType<typeof getSupabaseAdmin>
 try {
 supabase = getSupabaseAdmin()
 } catch {
 return NextResponse.json({ error:'Supabase admin client is niet geconfigureerd.'}, { status: 503 })
 }

 let factuurId =''

 try {
 const resolvedParams = await params
 factuurId = resolvedParams.id

 // Get the factuur
 const { data: factuurData, error: fetchError } = await (supabase as any)
 .from('facturen')
 .select(factuurSelect)
 .eq('id', factuurId)
 .eq('user_id', user.id)
 .single()

 if (fetchError || !factuurData) {
 return NextResponse.json({ error:'Factuur niet gevonden'}, { status: 404 })
 }

 const factuur = normalizeFactuurRow(factuurData)

 // Generate PDF content (simplified HTML for now)
 const pdfHtml = generateFactuurHTML(factuur)
 
 // For now, we'll create a simple PDF URL
 // In production, you'd use a PDF generation service like Puppeteer or a service
 const pdfUrl = `/api/facturen/${factuurId}/pdf/download`
 
 // Update factuur with PDF URL
 const { error: updateError } = await (supabase as any)
 .from('facturen')
 .update({ pdf_url: pdfUrl })
 .eq('id', factuurId)
 .eq('user_id', user.id)

 if (updateError) {
 logger.error('Failed to update factuur with PDF URL:', updateError)
 }

 return NextResponse.json({ 
 success: true, 
 pdfUrl,
 message:'PDF gegenereerd'
 })

 } catch (error) {
 logger.apiError(`/api/facturen/${factuurId}/pdf`,'POST', error, { userId: user?.id })
 return NextResponse.json({ error:'Kon PDF niet genereren'}, { status: 500 })
 }
}

function generateFactuurHTML(factuur: any): string {
 const formatCurrency = (amount: number) => {
 return new Intl.NumberFormat('nl-NL', {
 style:'currency',
 currency:'EUR',
 }).format(amount)
 }

 const formatDate = (dateStr: string | null) => {
 if (!dateStr) return'-'
 return new Date(dateStr).toLocaleDateString('nl-NL')
 }

 return `
 <!DOCTYPE html>
 <html>
 <head>
 <meta charset="utf-8">
 <title>Factuur ${factuur.nummer}</title>
 <style>
 body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
 .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
 .company { font-size: 24px; font-weight: bold; color: #6861F2; }
 .invoice-details { text-align: right; }
 .client-details { margin-bottom: 30px; }
 .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
 .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
 .items-table th { background-color: #f8f9fa; font-weight: bold; }
 .totals { margin-top: 30px; text-align: right; }
 .total-row { display: flex; justify-content: space-between; margin: 8px 0; }
 .total-final { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 8px; }
 .footer { margin-top: 50px; font-size: 12px; color: #666; }
 </style>
 </head>
 <body>
 <div class="header">
 <div>
 <div class="company">ArchonPro</div>
 <div>Uw Business Suite Partner</div>
 </div>
 <div class="invoice-details">
 <h2>FACTUUR</h2>
 <div><strong>Nummer:</strong> ${factuur.nummer}</div>
 <div><strong>Datum:</strong> ${formatDate(factuur.datum)}</div>
 <div><strong>Vervaldatum:</strong> ${formatDate(factuur.vervalDatum)}</div>
 </div>
 </div>

 <div class="client-details">
 <h3>Factuuradres:</h3>
 <div><strong>${factuur.klant}</strong></div>
 <div>${factuur.klantEmail}</div>
 </div>

 <table class="items-table">
 <thead>
 <tr>
 <th>Omschrijving</th>
 <th style="text-align: right;">Aantal</th>
 <th style="text-align: right;">Prijs</th>
 <th style="text-align: right;">BTW</th>
 <th style="text-align: right;">Totaal</th>
 </tr>
 </thead>
 <tbody>
 ${factuur.items.map((item: any) => `
 <tr>
 <td>${item.omschrijving}</td>
 <td style="text-align: right;">${item.aantal}</td>
 <td style="text-align: right;">${formatCurrency(item.prijs)}</td>
 <td style="text-align: right;">${item.btw}%</td>
 <td style="text-align: right;">${formatCurrency(item.aantal * item.prijs * (1 + item.btw / 100))}</td>
 </tr>
 `).join('')}
 </tbody>
 </table>

 <div class="totals">
 <div class="total-row">
 <span>Subtotaal:</span>
 <span>${formatCurrency(factuur.bedrag)}</span>
 </div>
 <div class="total-row">
 <span>BTW:</span>
 <span>${formatCurrency(factuur.btwBedrag)}</span>
 </div>
 <div class="total-row total-final">
 <span>Totaal:</span>
 <span>${formatCurrency(factuur.totaalBedrag)}</span>
 </div>
 </div>

 ${factuur.notities ? `
 <div style="margin-top: 30px;">
 <h4>Notities:</h4>
 <p>${factuur.notities}</p>
 </div>
`:''}

 <div class="footer">
 <p>Betaling binnen 14 dagen na factuurdatum.</p>
 <p>Bij vragen over deze factuur kunt u contact opnemen via ${factuur.klantEmail}</p>
 </div>
 </body>
 </html>
 `
}
