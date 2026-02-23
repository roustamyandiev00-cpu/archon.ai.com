import nodemailer from 'nodemailer';
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from 'next/server';


// Create SMTP transporter
function createTransporter(smtpSettings: any) {
  if (smtpSettings.smtp_provider === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpSettings.smtp_gmail_user,
        pass: smtpSettings.smtp_gmail_password,
      },
    });
  } else if (smtpSettings.smtp_provider === 'outlook') {
    return nodemailer.createTransport({
      service: 'hotmail',
      auth: {
        user: smtpSettings.smtp_outlook_user,
        pass: smtpSettings.smtp_outlook_password,
      },
    });
  } else {
    // Custom SMTP
    return nodemailer.createTransport({
      host: smtpSettings.smtp_custom_host,
      port: smtpSettings.smtp_custom_port || 587,
      secure: (smtpSettings.smtp_custom_port || 587) === 465,
      auth: {
        user: smtpSettings.smtp_custom_user,
        pass: smtpSettings.smtp_custom_password,
      },
    });
  }
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
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
      recipient_email, 
      recipient_name,
      subject, 
      message,
      pdf_url,
      pdf_generation_id
    } = body;

    if (!entity_type || !entity_id || !recipient_email) {
      return NextResponse.json({ 
        error: 'Entity type, entity ID, and recipient email are required' 
      }, { status: 400 });
    }

    // Get user's SMTP settings
    const { data: userSettings, error: settingsError } = await (supabaseAdmin
      .from('user_settings') as any)
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !userSettings?.smtp_provider) {
      return NextResponse.json({ 
        error: 'SMTP settings not configured. Please configure email settings first.' 
      }, { status: 400 });
    }

    // Get PDF if URL provided
    let pdfAttachment: { filename: string; content: Buffer; contentType: string } | undefined = undefined;
    if (pdf_url) {
      try {
        const pdfResponse = await fetch(pdf_url);
        const pdfBuffer = await pdfResponse.arrayBuffer();
        pdfAttachment = {
          filename: `${entity_type}_${entity_id}.pdf`,
          content: Buffer.from(pdfBuffer),
          contentType: 'application/pdf'
        };
      } catch (error) {
        console.error('Error fetching PDF:', error);
      }
    }

    // Generate email content if not provided
    const emailSubject = subject || `${entity_type === 'offerte' ? 'Offerte' : 'Factuur'} - ${entity_id}`;
    const emailMessage = message || generateDefaultEmail(entity_type, recipient_name);

    // Create transporter and send
    const transporter = createTransporter(userSettings);
    
    const fromName = userSettings.email_from_name || userSettings.company_name || 'Archon.ai';
    const fromAddress = userSettings.email_from_address || userSettings.smtp_gmail_user || userSettings.smtp_outlook_user || userSettings.smtp_custom_user;

    const mailOptions = {
      from: `"${fromName}" <${fromAddress}>`,
      to: recipient_email,
      subject: emailSubject,
      html: formatEmailHTML(emailMessage, fromName),
      attachments: pdfAttachment ? [pdfAttachment] : undefined
    };

    const info = await transporter.sendMail(mailOptions);

    // Record in database
    const { data: sendRecord, error: dbError } = await (supabaseAdmin
      .from('document_sends') as any)
      .insert({
        user_id: user.id,
        entity_type: entity_type,
        entity_id: entity_id,
        send_method: 'email',
        recipient: recipient_email,
        subject: emailSubject,
        message_content: emailMessage,
        pdf_generation_id: pdf_generation_id || null,
        status: 'sent',
        external_message_id: info.messageId,
        sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error recording email send:', dbError);
    }

    return NextResponse.json({
      success: true,
      data: {
        message_id: info.messageId,
        recipient: recipient_email,
        status: 'sent',
        send_record_id: sendRecord?.id
      }
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}

// GET endpoint for email history
export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
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
    const method = searchParams.get('method') || 'email';

    let query = (supabaseAdmin as any)
      .from('document_sends')
      .select('*, pdf_generations(file_path)')
      .eq('user_id', user.id)
      .eq('send_method', method)
      .order('sent_at', { ascending: false });

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data: sends, error } = await query;

    if (error) {
      console.error('Error fetching email history:', error);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: sends });
  } catch (error) {
    console.error('Error in GET email history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateDefaultEmail(entityType: string, recipientName?: string): string {
  const greeting = recipientName ? `Beste ${recipientName},` : 'Beste,';
  
  if (entityType === 'offerte') {
    return `${greeting}

Hierbij ontvangt u onze offerte zoals besproken.

Mocht u vragen hebben, dan horen wij dit graag.

Met vriendelijke groet,

Archon.ai Team`;
  } else {
    return `${greeting}

Hierbij ontvangt u de factuur voor de geleverde diensten/producten.

Wij verzoeken u vriendelijk om het verschuldigde bedrag binnen de gestelde termijn te voldoen.

Met vriendelijke groet,

Archon.ai Team`;
  }
}

function formatEmailHTML(message: string, companyName: string): string {
  const formattedMessage = message.replace(/\n/g, '<br>');
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
    .content { padding: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${companyName}</h2>
    </div>
    <div class="content">
      ${formattedMessage}
    </div>
    <div class="footer">
      <p>Dit bericht is automatisch verzonden via Archon.ai</p>
    </div>
  </div>
</body>
</html>`;
}
