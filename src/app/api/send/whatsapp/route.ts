import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// WhatsApp Business API configuration
const WHATSAPP_API_VERSION = 'v18.0';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      entity_type, 
      entity_id, 
      recipient_phone, 
      message,
      pdf_url,
      pdf_generation_id,
      template_name = 'document_notification'
    } = body;

    if (!entity_type || !entity_id || !recipient_phone) {
      return NextResponse.json({ 
        error: 'Entity type, entity ID, and recipient phone are required' 
      }, { status: 400 });
    }

    // Get user's WhatsApp Business API settings
    // In production, these should be stored in user_settings or a separate whatsapp_settings table
    const whatsappBusinessId = process.env.WHATSAPP_BUSINESS_ID;
    const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!whatsappBusinessId || !whatsappAccessToken) {
      return NextResponse.json({ 
        error: 'WhatsApp Business API not configured' 
      }, { status: 400 });
    }

    // Format phone number (remove + and spaces)
    const formattedPhone = recipient_phone.replace(/\+/g, '').replace(/\s/g, '');

    // Prepare message
    const messageText = message || generateDefaultWhatsAppMessage(entity_type, entity_id);

    // Send WhatsApp message via Cloud API
    const response = await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${whatsappBusinessId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'template',
          template: {
            name: template_name,
            language: {
              code: 'nl'
            },
            components: [
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: entity_type === 'offerte' ? 'Offerte' : 'Factuur'
                  },
                  {
                    type: 'text',
                    text: entity_id.toString()
                  },
                  {
                    type: 'text',
                    text: messageText.substring(0, 100) // Truncate for template
                  }
                ]
              }
            ]
          }
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error:', result);
      
      // Record failed attempt
      await supabaseAdmin
        .from('document_sends')
        .insert({
          user_id: user.id,
          entity_type: entity_type,
          entity_id: entity_id,
          send_method: 'whatsapp',
          recipient: recipient_phone,
          message_content: messageText,
          pdf_generation_id: pdf_generation_id || null,
          status: 'failed',
          external_message_id: result.error?.message || 'unknown',
          sent_at: new Date().toISOString()
        });

      return NextResponse.json({ 
        error: 'Failed to send WhatsApp message',
        details: result.error?.message 
      }, { status: 500 });
    }

    // Record successful send
    const { data: sendRecord, error: dbError } = await supabaseAdmin
      .from('document_sends')
      .insert({
        user_id: user.id,
        entity_type: entity_type,
        entity_id: entity_id,
        send_method: 'whatsapp',
        recipient: recipient_phone,
        message_content: messageText,
        pdf_generation_id: pdf_generation_id || null,
        status: 'sent',
        external_message_id: result.messages?.[0]?.id,
        sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error recording WhatsApp send:', dbError);
    }

    return NextResponse.json({
      success: true,
      data: {
        message_id: result.messages?.[0]?.id,
        recipient: recipient_phone,
        status: 'sent',
        send_record_id: sendRecord?.id
      }
    });

  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 });
  }
}

// GET endpoint for WhatsApp message history
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');

    let query = supabaseAdmin
      .from('document_sends')
      .select('*')
      .eq('user_id', user.id)
      .eq('send_method', 'whatsapp')
      .order('sent_at', { ascending: false });

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data: sends, error } = await query;

    if (error) {
      console.error('Error fetching WhatsApp history:', error);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: sends });
  } catch (error) {
    console.error('Error in GET WhatsApp history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateDefaultWhatsAppMessage(entityType: string, entityId: string | number): string {
  if (entityType === 'offerte') {
    return `Beste, hierbij ontvangt u offerte #${entityId}. Bekijk de bijlage voor details. Vragen? Stuur gerust een bericht terug.`;
  } else {
    return `Beste, hierbij ontvangt u factuur #${entityId}. Wij verzoeken u vriendelijk om dit binnen de gestelde termijn te voldoen. Bedankt!`;
  }
}
