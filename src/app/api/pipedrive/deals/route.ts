import { NextRequest, NextResponse } from 'next/server';
import { PipedriveService } from '@/lib/pipedrive';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import logger from '@/lib/logger';

const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN || '3e43530fb99304ac16642c8ff3f6d7f9ce390e65';

// GET - Fetch deals from Pipedrive
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';
    const limit = parseInt(searchParams.get('limit') || '50');

    const pipedrive = new PipedriveService({ apiToken: PIPEDRIVE_API_TOKEN });
    
    // Fetch deals
    const dealsResponse = await pipedrive.getDeals({ status, limit });
    
    // Fetch stages for mapping
    const stagesResponse = await pipedrive.getStages();
    
    // Fetch pipelines
    const pipelinesResponse = await pipedrive.getPipelines();

    return NextResponse.json({
      success: true,
      data: {
        deals: dealsResponse.data || [],
        stages: stagesResponse.data || [],
        pipelines: pipelinesResponse.data || [],
      }
    });
  } catch (error: any) {
    logger.apiError('/api/pipedrive/deals', 'GET', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch Pipedrive deals' },
      { status: 500 }
    );
  }
}

// POST - Sync deals to ArchonPro
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deals, syncMode = 'import' } = body;

    const supabase = getSupabaseAdmin();
    const results = {
      imported: 0,
      updated: 0,
      errors: [] as string[],
    };

    for (const deal of deals) {
      try {
        // Map Pipedrive deal to ArchonPro deal structure
        const dealData: any = {
          titel: deal.title,
          waarde: deal.value,
          valuta: deal.currency || 'EUR',
          status: mapPipedriveStatus(deal.status),
          fase: deal.stage_id?.toString() || 'lead',
          kans_percentage: deal.probability || 50,
          verwachte_sluitingsdatum: deal.expected_close_date,
          bron: 'pipedrive',
          externe_id: deal.id.toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Check if deal already exists
        const { data: existingDeal } = await (supabase
          .from('deals') as any)
          .select('id')
          .eq('externe_id', deal.id.toString())
          .single();

        if (existingDeal) {
          // Update existing
          const { error } = await (supabase
            .from('deals') as any)
            .update(dealData)
            .eq('id', existingDeal.id);

          if (error) throw error;
          results.updated++;
        } else {
          // Insert new
          const { error } = await (supabase
            .from('deals') as any)
            .insert(dealData);

          if (error) throw error;
          results.imported++;
        }
      } catch (error: any) {
        results.errors.push(`Deal ${deal.id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    logger.apiError('/api/pipedrive/deals', 'POST', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to sync deals' },
      { status: 500 }
    );
  }
}

// Helper function to map Pipedrive status to ArchonPro status
function mapPipedriveStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'open': 'nieuw',
    'won': 'gewonnen',
    'lost': 'verloren',
    'deleted': 'gearchiveerd',
  };
  return statusMap[status] || 'nieuw';
}
