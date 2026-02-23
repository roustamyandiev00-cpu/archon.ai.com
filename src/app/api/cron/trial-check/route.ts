import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { sendTrialEndingEmail } from '@/lib/emails'

// Cron job endpoint for checking trial periods
// Should be called daily by a cron service (Vercel Cron, external scheduler, etc.)
// 
// Vercel Cron configuration (add to vercel.json):
// {
//   "crons": [{
//     "path": "/api/cron/trial-check",
//     "schedule": "0 9 * * *"
//   }]
// }

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // CRON_SECRET is REQUIRED in production
    if (!cronSecret) {
      console.error('CRON_SECRET not configured - rejecting request')
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()
    
    // Calculate date 2 days from now
    const twoDaysFromNow = new Date()
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)
    const targetDate = twoDaysFromNow.toISOString().split('T')[0] // YYYY-MM-DD format
    
    // Find users whose trial ends in exactly 2 days
    const { data: usersEndingTrial, error: fetchError } = await (supabase
      .from('users') as any)
      .select('id, email, name, trial_ends_at')
      .gte('trial_ends_at', `${targetDate}T00:00:00.000Z`)
      .lte('trial_ends_at', `${targetDate}T23:59:59.999Z`)
      .is('trial_notification_sent', null) // Haven't received notification yet

    if (fetchError) {
      console.error('Error fetching trial users:', fetchError)
      return NextResponse.json(
        { error: 'Database error', details: fetchError },
        { status: 500 }
      )
    }

    if (!usersEndingTrial || usersEndingTrial.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users with trials ending in 2 days',
        processed: 0
      })
    }

    // Send emails to each user
    const results: Array<{
      userId: string
      email: string
      status: 'sent' | 'failed' | 'error'
      error?: string
    }> = []
    
    for (const user of usersEndingTrial) {
      try {
        const trialEndDate = new Date(user.trial_ends_at).toLocaleDateString('nl-NL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })

        const emailResult = await sendTrialEndingEmail({
          email: user.email,
          name: user.name || user.email.split('@')[0],
          trialEndDate,
          daysLeft: 2
        })

        if (emailResult.success) {
          // Mark notification as sent
          await (supabase
            .from('users') as any)
            .update({ trial_notification_sent: new Date().toISOString() })
            .eq('id', user.id)
          
          results.push({
            userId: user.id,
            email: user.email,
            status: 'sent'
          })
        } else {
          results.push({
            userId: user.id,
            email: user.email,
            status: 'failed',
            error: emailResult.error
          })
        }
      } catch (error: any) {
        console.error(`Error sending email to ${user.email}:`, error)
        results.push({
          userId: user.id,
          email: user.email,
          status: 'error',
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.status === 'sent').length
    const failCount = results.filter(r => r.status !== 'sent').length

    return NextResponse.json({
      success: true,
      message: `Processed ${usersEndingTrial.length} users`,
      processed: usersEndingTrial.length,
      sent: successCount,
      failed: failCount,
      results
    })

  } catch (error: any) {
    console.error('Error in trial-check cron:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}
