import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Geen authorization token' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const supabase = getSupabaseAdmin();

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Ongeldige token' },
        { status: 401 }
      );
    }

    // Get user's role from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, is_blocked, subscription_tier, tokens_used, tokens_limit')
      .eq('id', user.id)
      .single();

    if (userError) {
      // User doesn't exist in users table yet - return default role
      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          role: 'user', // Default role
          is_blocked: false,
          subscription_tier: null,
          tokens_used: 0,
          tokens_limit: 1000,
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
