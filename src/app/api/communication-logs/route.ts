import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// ============================================
// GET - Get communication logs
// ============================================
export async function GET(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = request.headers.get('Authorization');
    const { searchParams } = new URL(request.url);
    
    const channel = searchParams.get('channel');
    const status = searchParams.get('status');
    const userId = searchParams.get('user_id');
    const recipient = searchParams.get('recipient');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabaseAdmin
    // @ts-expect-error
      .from('communication_logs')
      .select('*', { count: 'exact' })
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (channel) {
      query = query.eq('channel', channel);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (recipient) {
      query = query.eq('recipient', recipient);
    }
    if (startDate) {
      query = query.gte('sent_at', startDate);
    }
    if (endDate) {
      query = query.lte('sent_at', endDate);
    }

    // If authorized, filter by user
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (!authError && user) {
        // Regular users can only see their own logs
        query = query.eq('user_id', user.id);
      }
    }

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Error fetching communication logs:', error);
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    // Get stats summary
    const { data: statsData } = await supabaseAdmin
    // @ts-expect-error
      .from('communication_logs')
      .select('channel, status');

    const stats = {
      total: statsData?.length || 0,
      email: statsData?.filter(l => l.channel === 'email').length || 0,
      whatsapp: statsData?.filter(l => l.channel === 'whatsapp').length || 0,
      telegram: statsData?.filter(l => l.channel === 'telegram').length || 0,
      sent: statsData?.filter(l => l.status === 'sent').length || 0,
      delivered: statsData?.filter(l => l.status === 'delivered').length || 0,
      failed: statsData?.filter(l => l.status === 'failed').length || 0,
    };

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      },
      stats
    });
  } catch (error) {
    console.error('Error in communication logs GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST - Create a log entry manually
// ============================================
export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
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
      recipient,
      channel,
      template_id,
      subject,
      content,
      status,
      external_id,
      error_message,
      metadata
    } = body;

    if (!recipient || !channel || !content) {
      return NextResponse.json({
        error: 'Recipient, channel, and content are required'
      }, { status: 400 });
    }

    const { data: log, error } = await supabaseAdmin
    // @ts-expect-error
      .from('communication_logs')
      .insert({
        user_id: user.id,
        recipient,
        channel,
        template_id: template_id || null,
        subject: subject || null,
        content,
        status: status || 'sent',
        external_id: external_id || null,
        error_message: error_message || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating communication log:', error);
      return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Error in communication logs POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PATCH - Update log status (for webhooks)
// ============================================
export async function PATCH(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { id, status, delivered_at, read_at, error_message } = body;

    if (!id || !status) {
      return NextResponse.json({
        error: 'ID and status are required'
      }, { status: 400 });
    }

    const updateData: Record<string, any> = { status };

    if (delivered_at) {
      updateData.delivered_at = delivered_at;
    }
    if (read_at) {
      updateData.read_at = read_at;
    }
    if (error_message) {
      updateData.error_message = error_message;
      updateData.failed_at = new Date().toISOString();
    }

    const { data: log, error } = await supabaseAdmin
    // @ts-expect-error
      .from('communication_logs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating communication log:', error);
      return NextResponse.json({ error: 'Failed to update log' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Error in communication logs PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
