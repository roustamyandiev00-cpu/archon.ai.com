import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from 'next/server';



export async function GET(request: Request) {
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

    const { data: integrations, error } = await supabaseAdmin
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('provider');

    if (error) {
      console.error('Error fetching integrations:', error);
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: integrations });
  } catch (error) {
    console.error('Error in GET /api/integrations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
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
    const { provider, is_enabled, is_connected, settings } = body;

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('user_integrations')
      .update({
        is_enabled,
        is_connected,
        settings: settings || {},
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('provider', provider)
      .select()
      .single();

    if (error) {
      console.error('Error updating integration:', error);
      return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in PUT /api/integrations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
