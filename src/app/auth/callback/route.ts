import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Error exchanging code for session:", error);
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=auth_callback_error`
        );
      }

      // Get user and set subscription tier cookie for middleware
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const adminSupabase = getSupabaseAdmin()
        
        // Check if user exists in users table
        const { data: existingUser } = await (adminSupabase
          .from('users') as any)
          .select('id, subscription_tier')
          .eq('id', session.user.id)
          .maybeSingle()
        
        let tier = 'basis'
        
        if (!existingUser) {
          // New user - create user record with trial
          const trialEndDate = new Date()
          trialEndDate.setDate(trialEndDate.getDate() + 14) // 14 day trial
          
          // Get the 'starter' plan ID for trial
          const { data: starterPlan } = await (adminSupabase
            .from('subscription_plans') as any)
            .select('id, slug')
            .eq('slug', 'starter')
            .single()
          
          // Create user record
          await (adminSupabase
            .from('users') as any)
            .insert({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
              subscription_tier: 'basis',
              trial_ends_at: trialEndDate.toISOString(),
            })
          
          // Create user_subscription with trial
          if (starterPlan) {
            await (adminSupabase
              .from('user_subscriptions') as any)
              .insert({
                user_id: session.user.id,
                plan_id: (starterPlan as any).id,
                status: 'trial',
                billing_cycle: 'monthly',
                trial_ends_at: trialEndDate.toISOString(),
                current_period_start: new Date().toISOString(),
                current_period_end: trialEndDate.toISOString(),
              })
          }
        } else {
          tier = (existingUser as any).subscription_tier || 'basis'
        }
        
        cookieStore.set('subscription-tier', tier, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 365, // 1 year
          path: '/'
        })
      }
    } catch (error) {
      console.error("Error in auth callback:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=auth_callback_error`
      );
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}
