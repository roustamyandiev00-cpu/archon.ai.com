import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// Types
// ============================================

interface MessageQueueItem {
  id: string;
  userId: string | null;
  recipient: string;
  channel: 'email' | 'whatsapp' | 'telegram';
  templateId: string | null;
  subject: string | null;
  content: string;
  variables: string | null;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  priority: number;
  scheduledAt: string | null;
  sentAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
}

interface SendResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

// ============================================
// Message Queue Service
// ============================================

/**
 * Add a message to the queue for background processing
 */
export async function queueMessage({
  userId,
  recipient,
  channel,
  templateId,
  subject,
  content,
  variables,
  priority = 0,
  scheduledAt,
  maxRetries = 3
}: {
  userId?: string;
  recipient: string;
  channel: 'email' | 'whatsapp' | 'telegram';
  templateId?: string;
  subject?: string;
  content: string;
  variables?: Record<string, string>;
  priority?: number;
  scheduledAt?: Date;
  maxRetries?: number;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('message_queue')
      .insert({
        user_id: userId || null,
        recipient,
        channel,
        template_id: templateId || null,
        subject: subject || null,
        content,
        variables: variables ? JSON.stringify(variables) : null,
        status: 'pending',
        priority,
        scheduled_at: scheduledAt?.toISOString() || null,
        max_retries: maxRetries
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error queuing message:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error in queueMessage:', error);
    return { success: false, error: 'Failed to queue message' };
  }
}

/**
 * Process pending messages in the queue
 * Call this from a cron job or API endpoint
 */
export async function processMessageQueue(batchSize = 10): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const stats = { processed: 0, sent: 0, failed: 0 };

  try {
    // Get pending messages that are due
    const now = new Date().toISOString();
    const { data: messages, error } = await supabaseAdmin
      .from('message_queue')
      .select('*')
      .eq('status', 'pending')
      .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (error) {
      console.error('Error fetching messages from queue:', error);
      return stats;
    }

    if (!messages || messages.length === 0) {
      return stats;
    }

    // Process each message
    for (const message of messages) {
      stats.processed++;
      
      // Mark as processing
      await supabaseAdmin
        .from('message_queue')
        .update({ status: 'processing' })
        .eq('id', message.id);

      // Process variables in content
      let processedContent = message.content;
      let processedSubject = message.subject;
      
      if (message.variables) {
        try {
          const vars = JSON.parse(message.variables);
          Object.entries(vars).forEach(([key, value]) => {
            processedContent = processedContent.replace(new RegExp(`{${key}}`, 'g'), String(value));
            if (processedSubject) {
              processedSubject = processedSubject.replace(new RegExp(`{${key}}`, 'g'), String(value));
            }
          });
        } catch (e) {
          console.error('Error parsing variables:', e);
        }
      }

      // Send based on channel
      let result: SendResult;
      
      switch (message.channel) {
        case 'email':
          result = await sendEmail({
            recipient: message.recipient,
            subject: processedSubject || 'Bericht van ArchonPro',
            content: processedContent,
            userId: message.userId
          });
          break;
        case 'whatsapp':
          result = await sendWhatsApp({
            recipient: message.recipient,
            content: processedContent
          });
          break;
        case 'telegram':
          result = await sendTelegram({
            chatId: message.recipient,
            content: processedContent
          });
          break;
        default:
          result = { success: false, error: 'Unknown channel' };
      }

      // Update message status
      if (result.success) {
        await supabaseAdmin
          .from('message_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', message.id);
        
        // Log the communication
        await logCommunication({
          userId: message.userId,
          recipient: message.recipient,
          channel: message.channel,
          templateId: message.template_id,
          subject: processedSubject,
          content: processedContent,
          status: 'sent',
          externalId: result.externalId
        });
        
        stats.sent++;
      } else {
        // Check if we should retry
        const newRetryCount = message.retry_count + 1;
        
        if (newRetryCount < message.max_retries) {
          // Schedule retry
          await supabaseAdmin
            .from('message_queue')
            .update({
              status: 'pending',
              retry_count: newRetryCount,
              error_message: result.error
            })
            .eq('id', message.id);
        } else {
          // Mark as failed
          await supabaseAdmin
            .from('message_queue')
            .update({
              status: 'failed',
              failed_at: new Date().toISOString(),
              error_message: result.error
            })
            .eq('id', message.id);
          
          // Log the failure
          await logCommunication({
            userId: message.userId,
            recipient: message.recipient,
            channel: message.channel,
            templateId: message.template_id,
            subject: processedSubject,
            content: processedContent,
            status: 'failed',
            errorMessage: result.error
          });
        }
        
        stats.failed++;
      }
    }

    return stats;
  } catch (error) {
    console.error('Error processing message queue:', error);
    return stats;
  }
}

// ============================================
// Channel-specific Senders
// ============================================

async function sendEmail({
  recipient,
  subject,
  content,
  userId
}: {
  recipient: string;
  subject: string;
  content: string;
  userId: string | null;
}): Promise<SendResult> {
  try {
    // Get SMTP settings if userId provided
    let transporter;
    let fromName = 'ArchonPro';
    let fromAddress = 'noreply@archon.ai';

    if (userId) {
      const { data: userSettings } = await supabaseAdmin
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (userSettings?.smtp_provider) {
        if (userSettings.smtp_provider === 'gmail') {
          transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: userSettings.smtp_gmail_user, pass: userSettings.smtp_gmail_password }
          });
        } else if (userSettings.smtp_provider === 'outlook') {
          transporter = nodemailer.createTransport({
            service: 'hotmail',
            auth: { user: userSettings.smtp_outlook_user, pass: userSettings.smtp_outlook_password }
          });
        } else {
          transporter = nodemailer.createTransport({
            host: userSettings.smtp_custom_host,
            port: userSettings.smtp_custom_port || 587,
            secure: userSettings.smtp_custom_port === 465,
            auth: { user: userSettings.smtp_custom_user, pass: userSettings.smtp_custom_password }
          });
        }
        fromName = userSettings.email_from_name || userSettings.company_name || 'ArchonPro';
        fromAddress = userSettings.email_from_address || userSettings.smtp_gmail_user || userSettings.smtp_outlook_user || userSettings.smtp_custom_user || 'noreply@archon.ai';
      }
    }

    // Fall back to system SMTP if no user settings
    if (!transporter) {
      const systemSmtpHost = process.env.SMTP_HOST;
      if (systemSmtpHost) {
        transporter = nodemailer.createTransport({
          host: systemSmtpHost,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          }
        });
        fromAddress = process.env.SMTP_FROM || 'noreply@archon.ai';
      } else {
        return { success: false, error: 'No SMTP configuration available' };
      }
    }

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: recipient,
      subject,
      html: formatEmailHTML(content, fromName)
    });

    return { success: true, externalId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function sendWhatsApp({
  recipient,
  content
}: {
  recipient: string;
  content: string;
}): Promise<SendResult> {
  try {
    const whatsappBusinessId = process.env.WHATSAPP_BUSINESS_ID;
    const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!whatsappBusinessId || !whatsappAccessToken) {
      return { success: false, error: 'WhatsApp Business API not configured' };
    }

    // Format phone number
    const formattedPhone = recipient.replace(/\+/g, '').replace(/\s/g, '');

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${whatsappBusinessId}/messages`,
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
          type: 'text',
          text: { body: content }
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error?.message || 'WhatsApp API error' };
    }

    return { success: true, externalId: result.messages?.[0]?.id };
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function sendTelegram({
  chatId,
  content
}: {
  chatId: string;
  content: string;
}): Promise<SendResult> {
  try {
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!telegramBotToken) {
      return { success: false, error: 'Telegram Bot API not configured' };
    }

    const response = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: content,
          parse_mode: 'HTML'
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      return { success: false, error: result.description || 'Telegram API error' };
    }

    return { success: true, externalId: result.result?.message_id?.toString() };
  } catch (error) {
    console.error('Error sending Telegram:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================
// Helpers
// ============================================

async function logCommunication({
  userId,
  recipient,
  channel,
  templateId,
  subject,
  content,
  status,
  externalId,
  errorMessage
}: {
  userId: string | null;
  recipient: string;
  channel: string;
  templateId: string | null;
  subject?: string | null;
  content: string;
  status: string;
  externalId?: string;
  errorMessage?: string;
}) {
  try {
    await supabaseAdmin
      .from('communication_logs')
      .insert({
        user_id: userId,
        recipient,
        channel,
        template_id: templateId,
        subject: subject || null,
        content,
        status,
        external_id: externalId || null,
        error_message: errorMessage || null,
        sent_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging communication:', error);
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
      <p>Dit bericht is automatisch verzonden via ArchonPro</p>
    </div>
  </div>
</body>
</html>`;
}

// ============================================
// Template Helpers
// ============================================

/**
 * Get a template by ID and process it with variables
 */
export async function getTemplate(templateId: string, variables?: Record<string, string>): Promise<{
  success: boolean;
  template?: {
    subject?: string;
    content: string;
    type: string;
  };
  error?: string;
}> {
  try {
    const { data: template, error } = await supabaseAdmin
      .from('communication_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single();

    if (error || !template) {
      return { success: false, error: 'Template not found or inactive' };
    }

    let content = template.content;
    let subject = template.subject;

    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{${key}}`, 'g'), String(value));
        if (subject) {
          subject = subject.replace(new RegExp(`{${key}}`, 'g'), String(value));
        }
      });
    }

    return {
      success: true,
      template: {
        subject: subject || undefined,
        content,
        type: template.type
      }
    };
  } catch (error) {
    console.error('Error getting template:', error);
    return { success: false, error: 'Failed to get template' };
  }
}

/**
 * Queue a message using a template
 */
export async function queueTemplateMessage({
  userId,
  recipient,
  templateId,
  variables,
  priority,
  scheduledAt
}: {
  userId?: string;
  recipient: string;
  templateId: string;
  variables?: Record<string, string>;
  priority?: number;
  scheduledAt?: Date;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const templateResult = await getTemplate(templateId, variables);
  
  if (!templateResult.success || !templateResult.template) {
    return { success: false, error: templateResult.error };
  }

  return queueMessage({
    userId,
    recipient,
    channel: templateResult.template.type as 'email' | 'whatsapp' | 'telegram',
    templateId,
    subject: templateResult.template.subject,
    content: templateResult.template.content,
    variables,
    priority,
    scheduledAt
  });
}
