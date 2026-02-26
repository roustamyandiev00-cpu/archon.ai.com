import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/admin';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { data: appointmentsRaw },
      { data: facturenRaw },
      { data: dealsRaw },
      { data: projectsRaw }
    ] = await Promise.all([
      supabase.from('afspraken').select('id, titel, start_tijd').eq('user_id', user.id).gte('start_tijd', now.split('T')[0]).lte('start_tijd', now.split('T')[0] + 'T23:59:59'),
      supabase.from('facturen').select('totaal_bedrag, datum, status').eq('user_id', user.id).gte('datum', sevenDaysAgo),
      supabase.from('deals').select('status, value').eq('user_id', user.id),
      supabase.from('projecten').select('id, name, status, endDate').eq('user_id', user.id)
    ]);

    const appointments = (appointmentsRaw || []) as any[];
    const facturen = (facturenRaw || []) as any[];
    const deals = (dealsRaw || []) as any[];
    const projects = (projectsRaw || []) as any[];

    // 1. Calculate Stats
    const stats = {
      appointmentsToday: (appointments || []).length,
      overdueInvoices: (facturen || []).filter(f => f.status === 'Achterstallig').length,
      dealsInFollowUp: (deals || []).filter(d => ['nieuw', 'contact', 'onderhandeling'].includes(d.status.toLowerCase())).length,
      tasksDue: (projects || []).filter(p => p.endDate && new Date(p.endDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length
    };

    // 2. Format Revenue Data (Last 7 Days)
    const days = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
    const revenueData: { day: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      const dayIso = d.toISOString().split('T')[0];
      
      const dayTotal = (facturen || [])
        .filter(f => f.datum && f.datum.startsWith(dayIso))
        .reduce((sum, f) => sum + (Number(f.totaal_bedrag) || 0), 0);
      
      revenueData.push({ day: dayName, amount: dayTotal });
    }

    // 3. Format Deals Data
    const dealStatuses = ['Gewonnen', 'In behandeling', 'Verloren', 'Nieuw'];
    const dealColors = ['#22c55e', '#3b82f6', '#ef4444', '#f59e0b'];
    
    const dealsChartData = dealStatuses.map((status, i) => {
      const count = (deals || []).filter(d => {
        if (status === 'In behandeling') return ['onderhandeling', 'offerte', 'contact'].includes(d.status.toLowerCase());
        return d.status.toLowerCase() === status.toLowerCase();
      }).length;
      
      const total = (deals || []).length || 1;
      return {
        name: status,
        value: Math.round((count / total) * 100),
        color: dealColors[i]
      };
    });

    return NextResponse.json({
      success: true,
      stats,
      revenueData,
      dealsData: dealsChartData
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=30'
      }
    });

  } catch (error: any) {
    logger.apiError('/api/dashboard/stats', 'GET', error);
    return NextResponse.json({ error: 'Er is een fout opgetreden bij het laden van dashboard statistieken. Probeer het later opnieuw.' }, { status: 500 });
  }
}
