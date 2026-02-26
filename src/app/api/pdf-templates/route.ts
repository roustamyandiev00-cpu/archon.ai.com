import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { getUserFromRequest } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Niet geautoriseerd' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()
    
    // Get PDF template settings
    let { data: settings, error } = await (supabase as any)
      .from('user_settings')
      .select('pdf_offerte_template, pdf_factuur_template, pdf_language, pdf_currency, pdf_footer_text')
      .eq('user_id', user.id)
      .single()

    if (error && error.code === 'PGRST116') {
      // No settings found, return defaults
      return NextResponse.json({
        success: true,
        templates: {
          offerteTemplate: 'modern',
          factuurTemplate: 'modern',
          language: 'nl',
          currency: 'EUR',
          footerText: ''
        }
      })
    } else if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      templates: {
        offerteTemplate: settings?.pdf_offerte_template || 'modern',
        factuurTemplate: settings?.pdf_factuur_template || 'modern',
        language: settings?.pdf_language || 'nl',
        currency: settings?.pdf_currency || 'EUR',
        footerText: settings?.pdf_footer_text || ''
      }
    })
  } catch (error) {
    console.error('Error in /api/pdf-templates GET:', error)
    return NextResponse.json(
      { success: false, error: 'Server fout' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Niet geautoriseerd' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const supabase = getSupabaseAdmin()

    // Update PDF template settings
    const { error } = await (supabase as any)
      .from('user_settings')
      .upsert([
        {
          user_id: user.id,
          pdf_offerte_template: body.offerteTemplate,
          pdf_factuur_template: body.factuurTemplate,
          pdf_language: body.language,
          pdf_currency: body.currency,
          pdf_footer_text: body.footerText,
          updated_at: new Date().toISOString()
        }
      ])

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in /api/pdf-templates POST:', error)
    return NextResponse.json(
      { success: false, error: 'Server fout' },
      { status: 500 }
    )
  }
}