import { sendSystemEmail } from '../email'

export interface TrialEndingEmailParams {
  email: string
  name: string
  trialEndDate: string
  daysLeft: number
}

export function createTrialEndingEmailTemplate(params: TrialEndingEmailParams): { html: string; text: string } {
  const { email, name, trialEndDate, daysLeft } = params

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .warning-icon { font-size: 48px; margin-bottom: 16px; }
    .content { background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .countdown { font-size: 36px; font-weight: bold; color: #d97706; text-align: center; margin: 20px 0; }
    .countdown-label { font-size: 14px; color: #6b7280; text-align: center; }
    .benefits { background: #f9fafb; padding: 24px; border-radius: 8px; margin: 24px 0; }
    .benefit-item { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
    .benefit-icon { color: #10b981; font-size: 18px; }
    .button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 24px; }
    .button-secondary { display: inline-block; background: #f3f4f6; color: #374151; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 12px; margin-left: 8px; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding: 20px; }
    .footer a { color: #f59e0b; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="warning-icon">⏰</div>
      <h1 style="margin: 0; font-size: 24px;">Je proefperiode eindigt binnenkort!</h1>
    </div>
    <div class="content">
      <p>Beste ${name},</p>
      
      <div class="alert-box">
        <strong>Let op:</strong> Je proefperiode van ArchonPro eindigt over ${daysLeft} dagen.
      </div>
      
      <div class="countdown">${daysLeft}</div>
      <div class="countdown-label">dagen over in je proefperiode</div>
      
      <p>Op <strong>${trialEndDate}</strong> vervalt je toegang tot alle premium functies. Zorg dat je voor die tijd een abonnement kiest om zonder onderbreking door te kunnen werken.</p>
      
      <div class="benefits">
        <h3 style="margin: 0 0 16px 0; color: #374151;">Waarom upgraden?</h3>
        <div class="benefit-item">
          <span class="benefit-icon">✓</span>
          <span>Onbeperkt toegang tot alle modules</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">✓</span>
          <span>AI-Assistent voor slimme automatisering</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">✓</span>
          <span>Priority support via email en chat</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">✓</span>
          <span>Automatische backups en beveiliging</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="https://archon.pro/abonnement" class="button">Bekijk abonnementen →</a>
      </div>
      
      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        Wil je liever eerst even praten? Ons team helpt je graag bij het kiezen van het juiste abonnement.
        Stuur een mail naar <a href="mailto:support@archon.pro" style="color: #f59e0b;">support@archon.pro</a>
      </p>
      
      <p>Met vriendelijke groet,<br><strong>Het ArchonPro Team</strong></p>
    </div>
    <div class="footer">
      <p>ArchonPro - Slim zakelijk beheer</p>
      <p>
        <a href="https://archon.pro/abonnement">Upgrade nu</a> · 
        <a href="https://archon.pro/instellingen">Voorkeuren</a> · 
        <a href="https://archon.pro/help">Help</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
⏰ Je proefperiode eindigt binnenkort!

Beste ${name},

Let op: Je proefperiode van ArchonPro eindigt over ${daysLeft} dagen.

${daysLeft} DAGEN OVER

Op ${trialEndDate} vervalt je toegang tot alle premium functies. Zorg dat je voor die tijd een abonnement kiest om zonder onderbreking door te kunnen werken.

Waarom upgraden?
✓ Onbeperkt toegang tot alle modules
✓ AI-Assistent voor slimme automatisering
✓ Priority support via email en chat
✓ Automatische backups en beveiliging

Bekijk abonnementen: https://archon.pro/abonnement

Heb je vragen? Stuur een mail naar support@archon.pro

Met vriendelijke groet,
Het ArchonPro Team

---
ArchonPro - Slim zakelijk beheer
https://archon.pro
  `.trim()

  return { html, text }
}

export async function sendTrialEndingEmail(params: TrialEndingEmailParams): Promise<{ success: boolean; error?: string }> {
  const { html, text } = createTrialEndingEmailTemplate(params)
  
  return sendSystemEmail({
    to: params.email,
    subject: `⏰ Je proefperiode eindigt over ${params.daysLeft} dagen`,
    html,
    text,
  })
}
