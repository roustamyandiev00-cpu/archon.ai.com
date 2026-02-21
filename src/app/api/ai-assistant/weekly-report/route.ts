import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/admin';

const geminiApiKey = process.env.GEMINI_API_KEY!;

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    
    // Check if user has the report enabled
    const { data: settings } = await supabase
    // @ts-expect-error
      .from('user_settings')
      .select('notify_email_weekly')
      .eq('user_id', user.id)
      .single() as any;

    if (settings && !settings.notify_email_weekly) {
      return NextResponse.json({ message: 'Rapportage staat uit voor deze gebruiker' });
    }

    // 1. Fetch Data for the last 7 days
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { data: dealsRaw },
      { data: facturenRaw },
      { data: newContacts }
    ] = await Promise.all([
      supabase.from('deals').select('*').eq('user_id', user.id).gte('created_at', lastWeek),
      supabase.from('facturen').select('*').eq('user_id', user.id).gte('datum', lastWeek),
      supabase.from('contacts').select('*').eq('user_id', user.id).gte('created_at', lastWeek)
    ]);

    const deals = (dealsRaw || []) as any[];
    const facturen = (facturenRaw || []) as any[];

    // 2. Prepare Context for AI
    const wonDeals = deals.filter(d => d.status.toLowerCase() === 'gewonnen');
    const paidInvoices = facturen.filter(f => f.status.toLowerCase() === 'betaald');
    const totalRevenue = paidInvoices.reduce((sum, f) => sum + (Number(f.totaal_bedrag) || 0), 0);

    const reportContext = `
Je bent de ArchonPro Strategische Partner. Schrijf een motiverend en scherp wekelijks business rapport voor de gebruiker.

DATA VAN DE AFGELOPEN 7 DAGEN:
- Omzet uit betaalde facturen: €${totalRevenue.toLocaleString('nl-NL')}
- Aantal nieuwe contacten: ${(newContacts || []).length}
- Nieuwe deals aangemaakt: ${(deals || []).length}
- Gewonnen deals: ${wonDeals.length} (${wonDeals.map(d => d.name).join(', ') || 'Geen'})

INSTRUCTIES VOOR HET RAPPORT:
1. Geef een samenvatting van de week in 3 sterke zinnen.
2. Benoem het succes (bijv. de omzet of gewonnen deals).
3. Geef 2 concrete verbeterpunten of kansen voor de komende week op basis van de data.
4. Houd de toon professioneel, bemoedigend en ondernemend.
5. Gebruik Markdown voor de opmaak.
`;

    // 3. Call Gemini to generate the report
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: reportContext }] }]
      })
    });

    const geminiData = await geminiResponse.json();
    const reportText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Kon geen rapport genereren.';

    // In een echte situatie zouden we dit nu via SendGrid/Nodemailer versturen.
    // Voor nu geven we het terug als preview.

    return NextResponse.json({
      success: true,
      report: reportText,
      data: {
        revenue: totalRevenue,
        newLeads: (newContacts || []).length,
        wonDeals: wonDeals.length
      }
    });

  } catch (error: any) {
    console.error('Weekly Report Error:', error);
    return NextResponse.json({ error: 'Interne server fout' }, { status: 500 });
  }
}
