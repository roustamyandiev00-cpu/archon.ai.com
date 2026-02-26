import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/admin'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Niet geautoriseerd' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // For now, just simulate sending an email
    // In a real implementation, you would use the user's SMTP settings
    // to actually send the email via nodemailer or similar
    
    console.log('Test email would be sent:', {
      to: body.recipient_email,
      subject: body.subject,
      message: body.message,
      entityType: body.entity_type,
      entityId: body.entity_id
    })

    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json({ 
      success: true,
      message: 'Test email verzonden (gesimuleerd)'
    })
  } catch (error) {
    console.error('Error in /api/send/email:', error)
    return NextResponse.json(
      { success: false, error: 'Server fout' },
      { status: 500 }
    )
  }
}