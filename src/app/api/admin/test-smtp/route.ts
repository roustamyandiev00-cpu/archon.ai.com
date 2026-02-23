import { NextRequest, NextResponse } from 'next/server'
import { sendSystemEmail, isSystemEmailConfigured } from '@/lib/email'

// Test SMTP configuration endpoint (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin (simplified - should use proper auth check)
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isConfigured = isSystemEmailConfigured()
    
    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        configured: false,
        message: 'SMTP niet geconfigureerd. Voeg SMTP_HOST, SMTP_USER en SMTP_PASS toe aan .env.local'
      })
    }

    return NextResponse.json({
      success: true,
      configured: true,
      message: 'SMTP is geconfigureerd',
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || '587',
        from: process.env.SMTP_FROM,
        fromName: process.env.SMTP_FROM_NAME
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Send test email
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { to } = body

    if (!to) {
      return NextResponse.json({ error: 'Email adres verplicht' }, { status: 400 })
    }

    const result = await sendSystemEmail({
      to,
      subject: 'ArchonPro SMTP Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">SMTP Test Succesvol</h1>
          <p>Je SMTP configuratie werkt correct!</p>
          <p style="color: #666; font-size: 12px;">Verstuurd op ${new Date().toLocaleString('nl-NL')}</p>
        </div>
      `,
      text: 'SMTP Test Succesvol! Je SMTP configuratie werkt correct.'
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
