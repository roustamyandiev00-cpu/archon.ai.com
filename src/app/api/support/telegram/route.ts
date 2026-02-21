import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/admin';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_TELEGRAM_CHAT_ID = process.env.ADMIN_TELEGRAM_CHAT_ID;

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { subject, message, priority } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Bericht is vereist' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Sla op in de database als Support Ticket
    const { data: ticket, error: ticketError } = await (supabase
      .from('support_tickets') as any)
      .insert({
        user_id: user.id,
        user_email: user.email,
        subject: subject || 'Nieuw bericht via Dashboard',
        status: 'open',
        priority: priority || 'medium'
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    // Voeg het eerste bericht toe aan de ticket_messages
    await (supabase.from('support_ticket_messages') as any).insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      sender: 'user',
      message: message
    });

    // 2. Stuur door naar Telegram indien geconfigureerd
    if (TELEGRAM_BOT_TOKEN && ADMIN_TELEGRAM_CHAT_ID) {
      const telegramText = `
🚀 *Nieuw Support Bericht!*
----------------------------
👤 *Gebruiker:* ${user.email}
📝 *Onderwerp:* ${subject || 'Geen'}
🔥 *Prioriteit:* ${priority || 'Medium'}

💬 *Bericht:*
${message}

----------------------------
_Stuur een reactie via het Admin Dashboard_
`;

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_TELEGRAM_CHAT_ID,
          text: telegramText,
          parse_mode: 'Markdown'
        })
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Je bericht is verzonden naar de CEO!',
      ticketId: ticket.id
    });

  } catch (error: any) {
    console.error('Support Telegram Error:', error);
    return NextResponse.json({ error: 'Interne server fout' }, { status: 500 });
  }
}
