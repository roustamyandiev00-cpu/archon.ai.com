import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { getUserFromRequest } from '@/lib/admin'
import logger from '@/lib/logger'
import { generateFactuurNummer, computeTotals } from '../factuur-utils'

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  let supabase: ReturnType<typeof getSupabaseAdmin>
  try {
    supabase = getSupabaseAdmin()
  } catch {
    return NextResponse.json({ error: 'Supabase admin client is niet geconfigureerd.' }, { status: 503 })
  }

  try {
    const formData = await request.formData()
    
    // Extract client info
    const klant = formData.get('klant') as string
    const klantEmail = formData.get('klantEmail') as string
    const telefoon = formData.get('telefoon') as string
    const adres = formData.get('adres') as string
    
    // Extract service details
    const serviceType = formData.get('serviceType') as string
    const beschrijving = formData.get('beschrijving') as string
    const periode = formData.get('periode') as string
    const urgentie = formData.get('urgentie') as string
    const bijzonderheden = formData.get('bijzonderheden') as string
    
    // Validate required fields
    if (!klant?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Klantnaam is verplicht' },
        { status: 400 }
      )
    }
    
    if (!klantEmail?.trim()) {
      return NextResponse.json(
        { success: false, error: 'E-mailadres is verplicht' },
        { status: 400 }
      )
    }
    
    if (!serviceType?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Service type is verplicht' },
        { status: 400 }
      )
    }
    
    if (!beschrijving?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Service beschrijving is verplicht' },
        { status: 400 }
      )
    }
    
    // Generate factuur number
    const nummer = generateFactuurNummer()
    
    // Create enhanced service description for AI pricing
    const enhancedDescription = `
Service Type: ${serviceType}

Beschrijving: ${beschrijving}

${periode ? `Periode: ${periode}` : ''}

${urgentie ? `Urgentie: ${urgentie}` : ''}

${bijzonderheden ? `Bijzonderheden: ${bijzonderheden}` : ''}

Klant informatie:
- Naam: ${klant}
- E-mail: ${klantEmail}
${telefoon ? `- Telefoon: ${telefoon}` : ''}
${adres ? `- Adres: ${adres}` : ''}
    `.trim()
    
    // AI-based pricing estimation
    let estimatedPrice = 0
    let items: any[] = []
    
    // Simple AI pricing based on service type and urgency
    const basePrices: Record<string, number> = {
      'Consultancy diensten': 150, // per uur
      'Software ontwikkeling': 85,
      'IT Support': 75,
      'Project management': 120,
      'Training & workshops': 200,
      'Onderhoud & service': 65,
      'Advies & strategie': 175,
      'Design & creatie': 95,
      'Marketing diensten': 110,
      'Overig': 100
    }
    
    const basePrice = basePrices[serviceType] || 100
    let hours = 8 // Default 8 hours
    
    // Adjust hours based on description length and complexity
    const descriptionWords = beschrijving.split(' ').length
    if (descriptionWords > 50) hours = 16
    else if (descriptionWords > 100) hours = 24
    else if (descriptionWords > 200) hours = 40
    
    // Urgency multiplier
    const urgencyMultiplier = urgentie === 'Spoed' ? 1.5 : urgentie === 'Hoog' ? 1.25 : 1.0
    
    estimatedPrice = Math.round(basePrice * hours * urgencyMultiplier)
    
    // Create factuur items
    items = [
      {
        id: '1',
        omschrijving: `${serviceType} - ${beschrijving.substring(0, 100)}${beschrijving.length > 100 ? '...' : ''}`,
        aantal: hours,
        prijs: Math.round(basePrice * urgencyMultiplier),
        btw: 21
      }
    ]
    
    if (periode) {
      items[0].omschrijving += ` (${periode})`
    }
    
    // Calculate totals
    const totals = computeTotals(items)
    const now = new Date().toISOString()
    const datum = now.split('T')[0]
    const vervalDatum = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // Create factuur record
    const insertPayload = {
      user_id: user.id,
      nummer,
      klant: `${klant} (${klantEmail})`,
      klant_email: klantEmail,
      bedrag: totals.bedrag,
      btw_bedrag: totals.btwBedrag,
      totaal_bedrag: totals.totaalBedrag,
      datum,
      verval_datum: vervalDatum,
      status: 'Concept',
      betaald_op: null,
      betaal_methode: null,
      items,
      timeline: [
        {
          id: String(Date.now()),
          type: 'created',
          date: now,
          description: 'Factuur aangemaakt met AI',
          user: 'AI Systeem',
        },
      ],
      herinneringen_verstuurd: 0,
      pdf_url: null,
      notities: `AI gegenereerd factuur voor ${serviceType}. ${bijzonderheden || ''}`.trim(),
    }
    
    const insertResult = await (supabase as any)
      .from('facturen')
      .insert([insertPayload])
      .select('id, nummer, klant, klant_email, bedrag, btw_bedrag, totaal_bedrag, datum, verval_datum, status, items, timeline, notities, created_at')
      .single()
    
    if (insertResult.error) {
      const code = (insertResult.error as { code?: string }).code
      if (code === '23505') {
        return NextResponse.json({ error: `Factuurnummer ${nummer} bestaat al.` }, { status: 409 })
      }
      throw insertResult.error
    }
    
    return NextResponse.json({
      success: true,
      factuur: {
        id: String(insertResult.data.id),
        nummer: insertResult.data.nummer,
        klant: insertResult.data.klant,
        klantEmail: insertResult.data.klant_email,
        bedrag: insertResult.data.bedrag,
        btwBedrag: insertResult.data.btw_bedrag,
        totaalBedrag: insertResult.data.totaal_bedrag,
        datum: insertResult.data.datum,
        vervalDatum: insertResult.data.verval_datum,
        status: insertResult.data.status,
        items: insertResult.data.items,
        timeline: insertResult.data.timeline,
        notities: insertResult.data.notities,
        createdAt: insertResult.data.created_at,
      }
    })
    
  } catch (error) {
    logger.error('AI generate factuur error', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { success: false, error: 'AI factuur generatie mislukt' },
      { status: 500 }
    )
  }
}
