import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const adminSupabase = getSupabaseAdmin()
    
    // Only allow this in development or with special admin key
    const { authorization } = await request.json()
    if (authorization !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let deletedCount = 0

    // Remove mock offertes
    const { count: offertesCount } = await adminSupabase
      .from('offertes')
      .delete({ count: 'exact' })
      .in('nummer', ['2025-001', '2025-002', '2025-003'])
    
    deletedCount += offertesCount || 0

    // Remove mock deals
    const { count: dealsCount } = await adminSupabase
      .from('deals')
      .delete({ count: 'exact' })
      .in('titel', ['Software License', 'Consultancy Project', 'Annual Support'])
    
    deletedCount += dealsCount || 0

    // Remove mock projecten
    const { count: projectenCount } = await adminSupabase
      .from('projecten')
      .delete({ count: 'exact' })
      .in('naam', ['Website Redesign', 'Mobile App', 'CRM Integration'])
    
    deletedCount += projectenCount || 0

    // Remove mock contacten
    const { count: contactenCount } = await adminSupabase
      .from('contacten')
      .delete({ count: 'exact' })
      .in('email', ['jan@acme.nl', 'maria@acme.nl', 'peter@techstart.nl'])
    
    deletedCount += contactenCount || 0

    // Remove mock bedrijven
    const { count: bedrijvenCount } = await adminSupabase
      .from('bedrijven')
      .delete({ count: 'exact' })
      .in('naam', ['ACME BV', 'TechStart NV', 'Global Solutions'])
    
    deletedCount += bedrijvenCount || 0

    // Remove mock facturen if any
    const { count: facturenCount } = await adminSupabase
      .from('facturen')
      .delete({ count: 'exact' })
      .in('klant_naam', ['ACME BV', 'TechStart NV', 'Global Solutions'])
    
    deletedCount += facturenCount || 0

    // Remove test artikelen
    const { count: artikelenCount } = await adminSupabase
      .from('artikelen')
      .delete({ count: 'exact' })
      .or('naam.ilike.%Test%,naam.ilike.%Mock%,naam.ilike.%Demo%')
    
    deletedCount += artikelenCount || 0

    return NextResponse.json({
      success: true,
      message: 'Mock data cleanup completed',
      deletedRecords: deletedCount,
      details: {
        offertes: offertesCount || 0,
        deals: dealsCount || 0,
        projecten: projectenCount || 0,
        contacten: contactenCount || 0,
        bedrijven: bedrijvenCount || 0,
        facturen: facturenCount || 0,
        artikelen: artikelenCount || 0
      }
    })

  } catch (error) {
    console.error('Error cleaning up mock data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}