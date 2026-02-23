import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/admin';

const geminiApiKey = process.env.GEMINI_API_KEY!;

interface Deal {
  name: string;
  status: string;
  value: number;
}

interface Factuur {
  nummer: string;
  status: string;
  totaal_bedrag: number;
  klant: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Get user identity
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Bericht is vereist' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 2. Fetch Business Context (Aggregated Data)
    // We fetch a summary of the user's data to give to the AI
    // IMPORTANT: Filter by user_id to prevent privacy leak
    const [
      { count: companyCount },
      { count: contactCount },
      { data: deals_raw },
      { data: facturen_raw },
      { data: projects }
    ] = await Promise.all([
      (supabase.from('companies') as any).select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      (supabase.from('contacts') as any).select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      (supabase.from('deals') as any).select('name, status, value').eq('user_id', user.id),
      (supabase.from('facturen') as any).select('nummer, status, totaal_bedrag, klant').eq('user_id', user.id),
      (supabase.from('projecten') as any).select('name, status').eq('user_id', user.id).limit(10)
    ]);

    // Calculate some totals
    const deals: Deal[] | null = deals_raw;
    const facturen: Factuur[] | null = facturen_raw;
    const totalDealValue = ((deals as any[]) || []).reduce((sum, d) => sum + (Number(d.value) || 0), 0);
    const unpaidInvoices = ((facturen as any[]) || []).filter(f => f.status !== 'Betaald');
    const totalUnpaidValue = unpaidInvoices.reduce((sum, f) => sum + (Number(f.totaal_bedrag) || 0), 0);

    // 3. Build the System Prompt with Context
    const contextPrompt = `
Je bent ArchonPro AI, de persoonlijke business assistent van de gebruiker. 
Je hebt toegang tot de volgende live gegevens van hun bedrijf:

BEDRIJFS OVERZICHT:
- Totaal aantal bedrijven: ${companyCount || 0}
- Totaal aantal contacten: ${contactCount || 0}

SALES & DEALS:
- Actieve deals (laatste 10): ${deals?.map(d => `${d.name} (${d.status}: €${d.value})`).join(', ') || 'Geen'}
- Totale waarde van deze deals: €${totalDealValue.toLocaleString('nl-NL')}

FINANCIËN:
- Laatste facturen: ${facturen?.map(f => `${f.nummer} voor ${f.klant} (${f.status}: €${f.totaal_bedrag})`).join(', ') || 'Geen'}
- Totaal openstaand bedrag (van deze selectie): €${totalUnpaidValue.toLocaleString('nl-NL')}
- Aantal onbetaalde facturen: ${unpaidInvoices.length}

PROJECTEN:
- Lopende projecten: ${projects?.map(p => `${p.name} [${p.status}]`).join(', ') || 'Geen'}

INSTRUCTIES:
- Beantwoord vragen kort, professioneel en behulpzaam.
- Gebruik de bovenstaande gegevens om specifieke antwoorden te geven.
- Als je iets niet weet of geen toegang hebt tot die specifieke data, wees daar eerlijk over.
- Spreek de gebruiker aan in de 'je' vorm, tenzij het erg formeel is.
- Je kunt suggesties doen voor acties (bijv. "Zal ik een herinnering sturen voor factuur X?").
`;

    // 4. Call Gemini API
    // Format history for Gemini
    const contents = [
      { role: 'user', parts: [{ text: `Systeem instructie: ${contextPrompt}` }] },
      ...(history || []).map((h: any) => ({
        role: h.role === 'ai' ? 'model' : 'user',
        parts: [{ text: h.content }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    const geminiData = await geminiResponse.json();
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Ik kon helaas geen antwoord genereren. Probeer het opnieuw.';

    return NextResponse.json({
      success: true,
      reply: aiResponse
    });

  } catch (error: any) {
    console.error('AI Assistant Error:', error);
    return NextResponse.json({ error: 'Interne server fout' }, { status: 500 });
  }
}
