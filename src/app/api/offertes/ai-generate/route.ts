import { NextResponse } from'next/server'
import { getSupabaseAdmin } from'@/lib/supabaseAdmin'
import { handleApiError, resolveCompanyId } from'@/lib/api-utils'
import logger from'@/lib/logger'
import { generateOfferteNumber, mapUiStatusToDb } from'../offerte-utils'
import { uploadOffertePhotos, runOfferteAiAnalysis } from'../offerte-ai'

export async function POST(request: Request) {
 try {
 const formData = await request.formData()
 
 // Extract contact info
 const klant = formData.get('klant') as string
 const email = formData.get('email') as string
 const telefoon = formData.get('telefoon') as string
 const adres = formData.get('adres') as string
 
 // Extract project details
 const projectType = formData.get('projectType') as string
 const beschrijving = formData.get('beschrijving') as string
 const materialen = formData.get('materialen') as string
 const bijzonderheden = formData.get('bijzonderheden') as string
 
 // Extract dimensions
 const afmetingenStr = formData.get('afmetingen') as string
 let afmetingen = null
 if (afmetingenStr) {
 try {
 afmetingen = JSON.parse(afmetingenStr)
 } catch (e) {
 logger.warn('Invalid dimensions JSON.', {
 afmetingenStr,
 parseError: e instanceof Error ? e.message : String(e),
 })
 }
 }
 
 // Extract AI provider
 const aiProvider = (formData.get('aiProvider') as string) ||'gemini'
 
 // Validate required fields
 if (!klant?.trim()) {
 return NextResponse.json(
 { success: false, error:'Klantnaam is verplicht'},
 { status: 400 }
 )
 }
 
 if (!email?.trim()) {
 return NextResponse.json(
 { success: false, error:'E-mailadres is verplicht'},
 { status: 400 }
 )
 }
 
 if (!projectType?.trim()) {
 return NextResponse.json(
 { success: false, error:'Project type is verplicht'},
 { status: 400 }
 )
 }
 
 if (!beschrijving?.trim()) {
 return NextResponse.json(
 { success: false, error:'Project beschrijving is verplicht'},
 { status: 400 }
 )
 }
 
 // Extract media files
 const mediaFiles: Array<{ file: File, type:'photo'|'document'}> = []
 
 for (const [key, value] of formData.entries()) {
 if (key.startsWith('media_') && !key.includes('_type')) {
 const file = value as File
 if (file.size > 0) {
 const typeKey = `${key}_type`
 const rawType = formData.get(typeKey) as string
 const mediaType = rawType ==='document'?'document':'photo'
 mediaFiles.push({
 file,
 type: mediaType,
 })
 }
 }
 }

 const imageMediaFiles = mediaFiles.filter(({ file }) => file.type.startsWith('image/'))
 const documentCount = mediaFiles.length - imageMediaFiles.length
 
 const supabase = getSupabaseAdmin()
 const bedrijfNaam = (formData.get('bedrijf') as string | null)?.trim() || null
 const bedrijfId = await resolveCompanyId({
 supabase,
 companyName: bedrijfNaam,
 requestedCompanyId: null,
 })
 
 // Generate offerte number
 const nummer = generateOfferteNumber()
 
 // Create enhanced project description for AI
 const enhancedDescription = `
Project Type: ${projectType}

Beschrijving: ${beschrijving}

${materialen ? `Gewenste materialen: ${materialen}` :''}

${bijzonderheden ? `Bijzonderheden: ${bijzonderheden}` :''}

Klant informatie:
- Naam: ${klant}
- E-mail: ${email}
- Telefoon: ${telefoon}
${adres ? `- Adres: ${adres}` :''}

Media:
- Foto's: ${imageMediaFiles.length}
- Documenten: ${documentCount}

${afmetingen && (afmetingen.lengte || afmetingen.breedte || afmetingen.hoogte) ? 
 `Afmetingen: ${afmetingen.lengte ||'?'} × ${afmetingen.breedte ||'?'} × ${afmetingen.hoogte ||'?'} ${afmetingen.eenheid}` : 
''
}
 `.trim()
 
 // Create initial offerte record
 const { data: offerte, error: insertError } = await (supabase as any)
 .from('offertes')
 .insert({
 nummer,
 klant: `${klant} (${email})`,
 bedrag: 0, // Will be updated after AI analysis
 datum: new Date().toISOString().split('T')[0],
 geldig_tot: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
 status: mapUiStatusToDb('Openstaand'),
 bedrijf_id: bedrijfId,
 ai_fotos: [],
 ai_afmetingen: afmetingen || {},
 ai_analyse_status:'Bezig'
 })
 .select()
 .single()
 
 if (insertError) {
 logger.error('Failed to create offerte.', { insertError })
 return NextResponse.json(
 { success: false, error:'Kon offerte niet aanmaken'},
 { status: 500 }
 )
 }
 
 let uploadedPhotos: any[] = []
 
 // Upload media files if any
 if (imageMediaFiles.length > 0) {
 try {
 uploadedPhotos = await uploadOffertePhotos(
 supabase,
 offerte.id,
 imageMediaFiles.map((media, index) => ({
 file: media.file,
 roomId: `ai-generated-${index}`,
 }))
 )
 
 // Update offerte with uploaded photos
 await (supabase as any)
 .from('offertes')
 .update({ ai_fotos: uploadedPhotos })
 .eq('id', offerte.id)
 
 } catch (uploadError) {
 logger.error('Failed to upload photos.', {
 uploadError: uploadError instanceof Error ? uploadError.message : String(uploadError),
 })
 // Continue with AI analysis even if photo upload fails
 }
 }
 
 // Run AI analysis
 let estimatedPrice = 0
 try {
 const aiResult = await runOfferteAiAnalysis(
 {
 nummer: offerte.nummer,
 klant: offerte.klant,
 bedrag: 0,
 dimensions: afmetingen,
 photos: uploadedPhotos
 },
 {
 provider: aiProvider as any,
 enhancedPrompt: `
Analyseer dit ${projectType.toLowerCase()} project en genereer een professionele offerte.

${enhancedDescription}

Geef een gedetailleerde analyse met:
1. Samenvatting van het werk
2. Benodigde materialen en hoeveelheden
3. Geschatte arbeidsuren
4. Kostenschatting (minimum en maximum)
5. Mogelijke risico's of aandachtspunten
6. Aanbevelingen voor de klant

Zorg voor een realistische prijsschatting gebaseerd op Nederlandse marktprijzen voor ${projectType.toLowerCase()}.
 `
 }
 )
 
 const aiAnalysis = aiResult.analysis

 // Calculate estimated price from AI analysis
 if (aiAnalysis?.estimatedCost?.min != null && aiAnalysis?.estimatedCost?.max != null) {
 estimatedPrice = Math.round((aiAnalysis.estimatedCost.min + aiAnalysis.estimatedCost.max) / 2)
 } else {
 // Fallback pricing based on project type
 const basePrices: Record<string, number> = {
'Laminaat leggen': 25, // per m2
'Parket leggen': 35,
'Tegelwerk': 30,
'Tuinwerken': 45, // per uur
'Schilderwerk': 20, // per m2
'Badkamer renovatie': 8000, // base price
'Keuken plaatsen': 5000,
'Dakwerk': 50, // per m2
'Isolatie': 15,
'Elektra': 55, // per uur
'Loodgieterwerk': 60,
'Overig': 500
 }
 
 const basePrice = basePrices[projectType] || 500
 
 if (afmetingen?.lengte && afmetingen?.breedte) {
 const area = parseFloat(afmetingen.lengte) * parseFloat(afmetingen.breedte)
 if (afmetingen.eenheid ==='cm') {
 estimatedPrice = Math.round((area / 10000) * basePrice)
 } else if (afmetingen.eenheid ==='m') {
 estimatedPrice = Math.round(area * basePrice)
 } else {
 estimatedPrice = basePrice
 }
 } else {
 estimatedPrice = basePrice
 }
 
 // Add material costs estimate
 estimatedPrice = Math.round(estimatedPrice * 1.4) // 40% markup for materials
 }

 const aiAnalyseStatus = aiResult.status ==='Voltooid'?'Voltooid':'Fallback'
 const aiAnalyseFout = aiResult.status ==='Voltooid'
 ? null
 : (aiResult.error ||'AI analyse gaf geen bruikbaar resultaat; fallback prijsschatting gebruikt.')
 
 // Update offerte with AI analysis and estimated price
 const { error: updateError } = await (supabase as any)
 .from('offertes')
 .update({
 bedrag: Math.max(estimatedPrice, 100), // Minimum €100
 ai_analyse: aiAnalysis,
 ai_analyse_status: aiAnalyseStatus,
 ai_analyse_fout: aiAnalyseFout,
 ai_analyse_at: new Date().toISOString(),
 })
 .eq('id', offerte.id)
 
 if (updateError) {
 logger.error('Failed to update offerte with AI analysis.', { updateError })
 }
 
 return NextResponse.json({
 success: true,
 offerte: {
 ...offerte,
 bedrag: Math.max(estimatedPrice, 100),
 ai_analyse: aiAnalysis,
 ai_analyse_status: aiAnalyseStatus,
 ai_analyse_fout: aiAnalyseFout,
 },
 })
 
 } catch (aiError) {
 logger.error('AI analysis failed.', {
 aiError: aiError instanceof Error ? aiError.message : String(aiError),
 })
 
 // Update offerte with failed status but keep the basic offerte
 await (supabase as any)
 .from('offertes')
 .update({
 bedrag: Math.max(estimatedPrice, 100), // Use fallback pricing
 ai_analyse_status:'Fallback',
 ai_analyse_fout: aiError instanceof Error ? aiError.message :'AI analyse mislukt, fallback prijsschatting gebruikt'
 })
 .eq('id', offerte.id)
 
 return NextResponse.json({
 success: true,
 offerte: {
 ...offerte,
 bedrag: Math.max(estimatedPrice, 100),
 ai_analyse_status:'Fallback'
 },
 warning:'AI analyse mislukt, maar offerte is aangemaakt met fallback prijsschatting'
 })
 }
 
 } catch (error) {
 logger.error('AI generate offerte error.', {
 error: error instanceof Error ? error.message : String(error),
 })
 return handleApiError(error,'AI offerte generatie mislukt')
 }
}
