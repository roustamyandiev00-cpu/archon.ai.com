import { sendSystemEmail } from'../email'

export interface WelcomeEmailParams {
 email: string
 name: string
 companyName?: string
 trialDays?: number
}

export function createWelcomeEmailTemplate(params: WelcomeEmailParams): { html: string; text: string } {
 const { email, name, companyName, trialDays = 14 } = params

 const html = `
<!DOCTYPE html>
<html>
<head>
 <meta charset="utf-8">
 <style>
 body { font-family: -apple-system, BlinkMacSystemFont,'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f3f4f6; }
 .container { max-width: 600px; margin: 0 auto; padding: 20px; }
 .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
 .logo { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
 .content { background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
 .trial-badge { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 12px 24px; border-radius: 50px; display: inline-block; font-weight: bold; margin: 20px 0; }
 .features { background: #f9fafb; padding: 24px; border-radius: 8px; margin: 24px 0; }
 .feature-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; }
 .feature-icon { width: 24px; height: 24px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; }
 .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 24px; }
 .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding: 20px; }
 .footer a { color: #667eea; text-decoration: none; }
 </style>
</head>
<body>
 <div class="container">
 <div class="header">
 <div class="logo">🚀 ArchonPro</div>
 <p style="margin: 0; opacity: 0.9;">Welkom bij de toekomst van zakelijk beheer</p>
 </div>
 <div class="content">
 <p>Beste ${name},</p>
 <p>Welkom bij <strong>ArchonPro</strong>!${companyName ?`We zijn blij dat ${companyName} deel uitmaakt van onze community.` :''}</p>
 
 <div style="text-align: center;">
 <span class="trial-badge">🎁 ${trialDays} dagen gratis proefperiode</span>
 </div>
 
 <p>Je kunt direct aan de slag met alle functionaliteiten. Geen creditcard nodig tijdens je proefperiode.</p>
 
 <div class="features">
 <h3 style="margin: 0 0 16px 0; color: #374151;">Wat kun je verwachten?</h3>
 <div class="feature-item">
 <span class="feature-icon">✓</span>
 <span><strong>CRM & Contacten</strong> - Beheer al je relaties op één plek</span>
 </div>
 <div class="feature-item">
 <span class="feature-icon">✓</span>
 <span><strong>Offertes & Facturen</strong> - Professionele documenten in seconden</span>
 </div>
 <div class="feature-item">
 <span class="feature-icon">✓</span>
 <span><strong>AI-Assistent</strong> - Slimme hulp bij je dagelijkse taken</span>
 </div>
 <div class="feature-item">
 <span class="feature-icon">✓</span>
 <span><strong>Projecten & Timesheets</strong> - Houd alles bij</span>
 </div>
 </div>
 
 <div style="text-align: center;">
 <a href="https://archon.pro/dashboard"class="button">Start nu →</a>
 </div>
 
 <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
 Heeft u vragen? Ons support team staat voor je klaar. Stuur een mail naar 
 <a href="mailto:support@archon.pro"style="color: #667eea;">support@archon.pro</a>
 </p>
 
 <p>Met vriendelijke groet,<br><strong>Het ArchonPro Team</strong></p>
 </div>
 <div class="footer">
 <p>ArchonPro - Slim zakelijk beheer</p>
 <p>
 <a href="https://archon.pro/instellingen">Voorkeuren</a> · 
 <a href="https://archon.pro/privacy">Privacy</a> · 
 <a href="https://archon.pro/terms">Voorwaarden</a>
 </p>
 </div>
 </div>
</body>
</html>
 `.trim()

 const text = `
Welkom bij ArchonPro!

Beste ${name},

Welkom bij ArchonPro!${companyName ?`We zijn blij dat ${companyName} deel uitmaakt van onze community.` :''}

🎁 ${trialDays} dagen gratis proefperiode

Je kunt direct aan de slag met alle functionaliteiten. Geen creditcard nodig tijdens je proefperiode.

Wat kun je verwachten?
✓ CRM & Contacten - Beheer al je relaties op één plek
✓ Offertes & Facturen - Professionele documenten in seconden
✓ AI-Assistent - Slimme hulp bij je dagelijkse taken
✓ Projecten & Timesheets - Houd alles bij

Start nu: https://archon.pro/dashboard

Heeft u vragen? Stuur een mail naar support@archon.pro

Met vriendelijke groet,
Het ArchonPro Team

---
ArchonPro - Slim zakelijk beheer
https://archon.pro
 `.trim()

 return { html, text }
}

export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
 const { html, text } = createWelcomeEmailTemplate(params)
 
 return sendSystemEmail({
 to: params.email,
 subject: `Welkom bij ArchonPro! 🚀`,
 html,
 text,
 })
}
