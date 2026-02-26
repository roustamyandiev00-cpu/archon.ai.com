import { NextRequest, NextResponse } from'next/server'
import { getSupabaseAdmin } from'@/lib/supabaseAdmin'
import { requireAdmin } from'@/lib/admin'
import logger from'@/lib/logger'

// GET - Analytics data
export async function GET(request: NextRequest) {
 try {
 const authCheck = await requireAdmin(request)
 if (!(authCheck as any).ok) return authCheck as NextResponse

 const supabase = getSupabaseAdmin()

 // Get total users
 const { count: totalUsers } = await (supabase
 .from('users') as any)
 .select('*', { count:'exact', head: true })

 // Get active users (last 30 days)
 const thirtyDaysAgo = new Date()
 thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
 
 const { count: activeUsers } = await (supabase
 .from('users') as any)
 .select('*', { count:'exact', head: true })
 .gte('last_active', thirtyDaysAgo.toISOString())

 // Get MRR (Monthly Recurring Revenue)
 const { data: subscriptions } = await (supabase
 .from('users') as any)
 .select('subscription_tier')

 // Calculate MRR based on subscription tiers
 const tierPrices: Record<string, number> = {
 basis: 29,
 groei: 79,
 premium: 199,
 }

 let mrr = 0
 let churn = 2.3 // Default mock value

 if (subscriptions) {
 for (const sub of subscriptions) {
 if (sub.subscription_tier) {
 mrr += tierPrices[sub.subscription_tier.toLowerCase()] || 0
 }
 }
 }

 // Get token usage
 const { data: tokenData } = await (supabase
 .from('users') as any)
 .select('tokens_used, tokens_limit')

 let tokensUsed = 0
 let tokensLimit = 0

 if (tokenData) {
 for (const user of tokenData) {
 tokensUsed += user.tokens_used || 0
 tokensLimit += user.tokens_limit || 0
 }
 }

 return NextResponse.json({
 success: true,
 data: {
 totalUsers: totalUsers || 0,
 activeUsers: activeUsers || 0,
 mrr,
 churn,
 tokensUsed,
 tokensLimit,
 }
 })
 } catch (error) {
 logger.apiError('/api/admin/analytics','GET', error)
 return NextResponse.json({ error:'Er is een fout opgetreden bij het ophalen van analytics. Probeer het later opnieuw.'}, { status: 500 })
 }
}

