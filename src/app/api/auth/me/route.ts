import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import logger from '@/lib/logger';

// Subscription tier values that middleware expects
type SubscriptionTier = 'basis' | 'groei' | 'premium'

function isValidTier(tier: string | null | undefined): tier is SubscriptionTier {
  return tier === 'basis' || tier === 'groei' || tier === 'premium'
}

function getTierValue(tier: string | null | undefined): SubscriptionTier {
  return isValidTier(tier) ? tier : 'basis'
}

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
      logger.warn('Ongeldige token bij authenticatie', { userId: user?.id });
      return NextResponse.json(
        { success: false, error: 'Ongeldige token' },
        { status: 401 }
      );
    }

    // Get user's role from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, is_blocked, subscription_tier, tokens_used, tokens_limit, trial_ends_at')
      .eq('id', user.id)
      .single();

    if (userError) {
      logger.info('Nieuwe gebruiker zonder profiel, standaard rol toegewezen', { userId: user.id });
      // User doesn't exist in users table yet - return default role with subscription-tier cookie
      const tier = 'basis'
      const response = NextResponse.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          role: 'user', // Default role
          is_blocked: false,
          subscription_tier: null,
          trial_ends_at: null,
          tokens_used: 0,
          tokens_limit: 1000,
        }
      });
      
      // Set subscription-tier cookie for middleware (non-HttpOnly so middleware can read it)
      response.cookies.set('subscription-tier', tier, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/'
      });
      
      return response;
    }

    // Set subscription-tier cookie for middleware
    const tier = getTierValue((userData as { subscription_tier?: string | null })?.subscription_tier)
    const response = NextResponse.json({
      success: true,
      data: userData
    });
    
    // Set subscription-tier cookie (non-HttpOnly so middleware can read it)
    response.cookies.set('subscription-tier', tier, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/'
    });
    
    return response;

  } catch (error) {
    logger.apiError('/api/auth/me', 'GET', error);
    return NextResponse.json(
      { success: false, error: 'Er is een serverfout opgetreden. Probeer het later opnieuw.' },
      { status: 500 }
    );
  }
}
