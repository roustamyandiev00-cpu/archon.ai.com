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

    // Fetch recent activities from multiple tables
    const [
      { data: contacts },
      { data: deals },
      { data: projects },
      { data: afspraken }
    ] = await Promise.all([
      supabase.from('contacten').select('id, voornaam, achternaam, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('deals').select('id, titel, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('projecten').select('id, naam, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('afspraken').select('id, titel, start_tijd').eq('user_id', user.id).order('start_tijd', { ascending: false }).limit(5)
    ]);

    // Combine and format activities
    const activities = [
      ...(contacts || []).map((c: any) => ({
        id: `contact-${c.id}`,
        type: 'contact',
        title: `Nieuw contact: ${c.voornaam} ${c.achternaam}`,
        date: c.created_at,
        icon: 'user'
      })),
      ...(deals || []).map((d: any) => ({
        id: `deal-${d.id}`,
        type: 'deal',
        title: `Deal ${d.titel || 'zonder titel'} - ${d.status}`,
        date: d.created_at,
        icon: 'briefcase'
      })),
      ...(projects || []).map((p: any) => ({
        id: `project-${p.id}`,
        type: 'project',
        title: `Project ${p.naam || 'zonder naam'} - ${p.status}`,
        date: p.created_at,
        icon: 'folder'
      })),
      ...(afspraken || []).map((a: any) => ({
        id: `afspraak-${a.id}`,
        type: 'appointment',
        title: `Afspraak: ${a.titel || 'zonder titel'}`,
        date: a.start_tijd,
        icon: 'calendar'
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    return NextResponse.json({
      success: true,
      data: activities
    });

  } catch (error: any) {
    logger.apiError('/api/activities', 'GET', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het laden van activiteiten.' 
    }, { status: 500 });
  }
}
