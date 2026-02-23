import { sendSystemEmail } from '../email'

export interface PaymentFailedEmailParams {
  email: string
  name: string
  amount: string
  attemptDate: string
  failureReason?: string
  invoiceNumber?: string
}

export function createPaymentFailedEmailTemplate(params: PaymentFailedEmailParams): { html: string; text: string } {
  const { email, name, amount, attemptDate, failureReason, invoiceNumber } = params

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .error-icon { font-size: 48px; margin-bottom: 16px; }
    .content { background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .payment-details { background: #f9fafb; padding: 24px; border-radius: 8px; margin: 24px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; }
    .detail-value { font-weight: 600; color: #374151; }
    .amount { font-size: 24px; font-weight: bold; color: #ef4444; }
    .steps { margin: 24px 0; }
    .step { display: flex; gap: 16px; padding: 16px 0; border-bottom: 1px solid #f3f4f6; }
    .step:last-child { border-bottom: none; }
    .step-number { width: 28px; height: 28px; background: #ef4444; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; flex-shrink: 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 24px; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding: 20px; }
    .footer a { color: #ef4444; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="error-icon">❌</div>
      <h1 style="margin: 0; font-size: 24px;">Betaling mislukt</h1>
    </div>
    <div class="content">
      <p>Beste ${name},</p>
      
      <div class="alert-box">
        <strong>Er is een probleem met je betaling.</strong><br>
        We konden de betaling van <strong>${amount}</strong> niet verwerken.
      </div>
      
      <div class="payment-details">
        <h3 style="margin: 0 0 16px 0; color: #374151;">Betaaldetails</h3>
        ${invoiceNumber ? `
        <div class="detail-row">
          <span class="detail-label">Factuurnummer</span>
          <span class="detail-value">${invoiceNumber}</span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span class="detail-label">Bedrag</span>
          <span class="detail-value amount">${amount}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Poging op</span>
          <span class="detail-value">${attemptDate}</span>
        </div>
        ${failureReason ? `
        <div class="detail-row">
          <span class="detail-label">Reden</span>
          <span class="detail-value">${failureReason}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="steps">
        <h3 style="margin: 0 0 16px 0; color: #374151;">Wat kun je doen?</h3>
        <div class="step">
          <span class="step-number">1</span>
          <div>
            <strong>Controleer je betaalgegevens</strong><br>
            <span style="color: #6b7280;">Log in en ga naar Instellingen → Betalingen om je gegevens te updaten.</span>
          </div>
        </div>
        <div class="step">
          <span class="step-number">2</span>
          <div>
            <strong>Controleer je saldo</strong><br>
            <span style="color: #6b7280;">Zorg dat er voldoende saldo beschikbaar is op je rekening of creditcard.</span>
          </div>
        </div>
        <div class="step">
          <span class="step-number">3</span>
          <div>
            <strong>Neem contact op</strong><br>
            <span style="color: #6b7280;">Lukt het niet? Ons support team helpt je graag verder.</span>
          </div>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="https://archon.pro/instellingen/betalingen" class="button">Update betaalgegevens →</a>
      </div>
      
      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        <strong>Let op:</strong> Als we binnen 7 dagen geen betaling kunnen verwerken, wordt je abonnement tijdelijk opgeschort.
      </p>
      
      <p>Heb je vragen? Stuur een mail naar <a href="mailto:support@archon.pro" style="color: #ef4444;">support@archon.pro</a></p>
      
      <p>Met vriendelijke groet,<br><strong>Het ArchonPro Team</strong></p>
    </div>
    <div class="footer">
      <p>ArchonPro - Slim zakelijk beheer</p>
      <p>
        <a href="https://archon.pro/instellingen/betalingen">Betaalgegevens</a> · 
        <a href="https://archon.pro/help">Help</a> · 
        <a href="mailto:support@archon.pro">Support</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
❌ Betaling mislukt

Beste ${name},

Er is een probleem met je betaling. We konden de betaling van ${amount} niet verwerken.

Betaaldetails:
${invoiceNumber ? `Factuurnummer: ${invoiceNumber}\n` : ''}Bedrag: ${amount}
Poging op: ${attemptDate}
${failureReason ? `Reden: ${failureReason}` : ''}

Wat kun je doen?
1. Controleer je betaalgegevens in Instellingen → Betalingen
2. Zorg dat er voldoende saldo beschikbaar is
3. Neem contact op met support als het niet lukt

Update je betaalgegevens: https://archon.pro/instellingen/betalingen

LET OP: Als we binnen 7 dagen geen betaling kunnen verwerken, wordt je abonnement tijdelijk opgeschort.

Heb je vragen? Stuur een mail naar support@archon.pro

Met vriendelijke groet,
Het ArchonPro Team

---
ArchonPro - Slim zakelijk beheer
https://archon.pro
  `.trim()

  return { html, text }
}

export async function sendPaymentFailedEmail(params: PaymentFailedEmailParams): Promise<{ success: boolean; error?: string }> {
  const { html, text } = createPaymentFailedEmailTemplate(params)
  
  return sendSystemEmail({
    to: params.email,
    subject: `❌ Betaling mislukt - Actie vereist`,
    html,
    text,
  })
}
