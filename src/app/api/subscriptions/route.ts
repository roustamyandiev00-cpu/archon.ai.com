import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin, getUserFromRequest } from '@/lib/admin';

// GET /api/subscriptions - Get user's subscriptions or all (for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const all = searchParams.get("all") === "true";

    const supabase = getSupabaseAdmin();

    if (all) {
      // Admin view - require admin
      const adminCheck = await requireAdmin(request);
      if (!(adminCheck as any).ok) return adminCheck as NextResponse;

      // Get all subscriptions with plan details
      const { data: subscriptions, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: subscriptions,
      });
    } else if (userId) {
      // Get specific user's subscriptions
      const { data: subscriptions, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: subscriptions,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "userId parameter required or use all=true" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions - Create new subscription (during account creation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, planId } = body;

    if (!userId || !planId) {
      return NextResponse.json(
        { success: false, error: "userId and planId are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get plan details
    const { data: planData, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !planData) {
      return NextResponse.json(
        { success: false, error: "Plan not found" },
        { status: 404 }
      );
    }

    // Check if user already has a subscription
    const { data: existing } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "User already has a subscription" },
        { status: 400 }
      );
    }

    // Create subscription
    const { data: subscription, error: createError } = await (supabase
      .from('user_subscriptions') as any)
      .insert({
        user_id: userId,
        plan_id: planId,
        status: 'trial',
        billing_cycle: 'monthly',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .single();

    if (createError) throw createError;

    // Update user's subscription_tier based on plan slug
    const tierMap: Record<string, string> = {
      'starter': 'basis',
      'professional': 'groei',
      'enterprise': 'premium',
    };
    const tier = tierMap[(planData as any).slug] || 'basis';

    await (supabase
      .from('users') as any)
      .update({ subscription_tier: tier })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

// PUT /api/subscriptions - Update subscription status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, currentPeriodEnd, cancelledAt } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (status !== undefined) updateData.status = status;
    if (currentPeriodEnd !== undefined) updateData.current_period_end = currentPeriodEnd;
    if (cancelledAt !== undefined) updateData.cancelled_at = cancelledAt;

    const { data: subscription, error } = await (supabase
      .from('user_subscriptions') as any)
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .single();

    if (error) throw error;

    // Update user's subscription_tier if status changed
    if (status === 'cancelled' || status === 'expired') {
      await (supabase
        .from('users') as any)
        .update({ subscription_tier: 'basis' })
        .eq('id', (subscription as any).user_id);
    }

    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

// DELETE /api/subscriptions - Cancel/delete subscription
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get subscription before deleting to update user tier
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('user_subscriptions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Reset user's subscription_tier to basis
    if (subscription) {
      await (supabase
        .from('users') as any)
        .update({ subscription_tier: 'basis' })
        .eq('id', (subscription as any).user_id);
    }

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully",
    });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
