import { NextResponse } from 'next/server';
import { processMessageQueue, queueMessage, queueTemplateMessage, getTemplate } from '@/lib/message-queue';

// ============================================
// POST - Queue a new message
// ============================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      recipient,
      channel,
      subject,
      content,
      template_id,
      variables,
      priority,
      scheduled_at,
      use_template
    } = body;

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient is required' }, { status: 400 });
    }

    // If using template
    if (use_template && template_id) {
      const result = await queueTemplateMessage({
        recipient,
        templateId: template_id,
        variables: variables || {},
        priority: priority || 0,
        scheduledAt: scheduled_at ? new Date(scheduled_at) : undefined
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Message queued successfully',
        id: result.id
      });
    }

    // Direct message
    if (!channel || !content) {
      return NextResponse.json({ 
        error: 'Channel and content are required when not using a template' 
      }, { status: 400 });
    }

    const result = await queueMessage({
      recipient,
      channel,
      subject,
      content,
      variables,
      priority: priority || 0,
      scheduledAt: scheduled_at ? new Date(scheduled_at) : undefined
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Message queued successfully',
      id: result.id
    });
  } catch (error) {
    console.error('Error in message queue POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// GET - Get queue status or process queue
// ============================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Process pending messages
    if (action === 'process') {
      const batchSize = parseInt(searchParams.get('batch_size') || '10');
      const stats = await processMessageQueue(batchSize);
      
      return NextResponse.json({
        success: true,
        processed: stats.processed,
        sent: stats.sent,
        failed: stats.failed
      });
    }

    // Get template
    if (action === 'template') {
      const templateId = searchParams.get('template_id');
      if (!templateId) {
        return NextResponse.json({ error: 'template_id is required' }, { status: 400 });
      }

      const variables = searchParams.get('variables');
      const parsedVariables = variables ? JSON.parse(variables) : undefined;

      const result = await getTemplate(templateId, parsedVariables);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        template: result.template
      });
    }

    // Get queue stats (requires Supabase client)
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: pending, error: pendingError } = await supabaseAdmin
      .from('message_queue')
      .select('id', { count: 'exact' })
      .eq('status', 'pending');

    const { data: processing, error: processingError } = await supabaseAdmin
      .from('message_queue')
      .select('id', { count: 'exact' })
      .eq('status', 'processing');

    const { data: failed, error: failedError } = await supabaseAdmin
      .from('message_queue')
      .select('id', { count: 'exact' })
      .eq('status', 'failed');

    // Get upcoming scheduled messages
    const now = new Date().toISOString();
    const { data: scheduled, error: scheduledError } = await supabaseAdmin
      .from('message_queue')
      .select('id, recipient, channel, scheduled_at')
      .eq('status', 'pending')
      .not('scheduled_at', 'is', null)
      .gt('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(10);

    return NextResponse.json({
      success: true,
      stats: {
        pending: pending?.length || 0,
        processing: processing?.length || 0,
        failed: failed?.length || 0
      },
      scheduled: scheduled || []
    });
  } catch (error) {
    console.error('Error in message queue GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
