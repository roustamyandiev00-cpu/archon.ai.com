import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@archonpro.nl";
const HOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET");

// ArchonPro styled email templates
const templates = {
  signup: {
    subject: "Bevestig je registratie - ArchonPro",
    html: (data: Record<string, string>) => `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bevestig je registratie - ArchonPro</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Manrope', 'Avenir Next', 'Segoe UI', 'Helvetica Neue', sans-serif;
      background-color: #f3f7fc;
      color: #0b1220;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .email-container {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(11, 18, 32, 0.08);
      overflow: hidden;
    }
    .email-header {
      background: linear-gradient(135deg, #6861f2 0%, #8b5cf6 100%);
      padding: 40px 32px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .logo span { opacity: 0.9; }
    .email-body {
      padding: 40px 32px;
    }
    .greeting {
      font-size: 22px;
      font-weight: 600;
      color: #0b1220;
      margin-bottom: 16px;
    }
    .message {
      font-size: 16px;
      color: #4b5f7a;
      margin-bottom: 32px;
      line-height: 1.7;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #6861f2 0%, #8b5cf6 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 14px rgba(104, 97, 242, 0.35);
    }
    .button-wrapper {
      text-align: center;
      margin: 32px 0;
    }
    .fallback-link {
      background: #eaf0f7;
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
      word-break: break-all;
    }
    .fallback-link p {
      font-size: 13px;
      color: #4b5f7a;
      margin-bottom: 8px;
    }
    .fallback-link a {
      color: #6861f2;
      text-decoration: none;
      font-size: 13px;
    }
    .email-footer {
      background: #f8fbff;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #e9eff7;
    }
    .footer-text {
      font-size: 13px;
      color: #4b5f7a;
    }
    .footer-brand {
      font-weight: 600;
      color: #6861f2;
    }
    .divider {
      height: 1px;
      background: #e9eff7;
      margin: 24px 0;
    }
    .security-note {
      background: #e7eef9;
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
    }
    .security-note p {
      font-size: 13px;
      color: #4b5f7a;
    }
    .security-note strong { color: #0b1220; }
    @media only screen and (max-width: 480px) {
      .email-wrapper { padding: 20px 16px; }
      .email-header { padding: 32px 24px; }
      .email-body { padding: 32px 24px; }
      .greeting { font-size: 20px; }
      .cta-button { display: block; text-align: center; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="logo">Archon<span>Pro</span></div>
      </div>
      <div class="email-body">
        <h1 class="greeting">Welkom bij ArchonPro!</h1>
        <p class="message">
          Bedankt voor je registratie. Om je account te activeren en toegang te krijgen tot alle functies, bevestig je e-mailadres door op de onderstaande knop te klikken.
        </p>
        <div class="button-wrapper">
          <a href="${data.confirmation_url}" class="cta-button">E-mailadres bevestigen</a>
        </div>
        <div class="divider"></div>
        <div class="fallback-link">
          <p>Als de knop niet werkt, kopieer en plak deze link in je browser:</p>
          <a href="${data.confirmation_url}">${data.confirmation_url}</a>
        </div>
        <div class="security-note">
          <p><strong>Beveiligingstip:</strong> Deze link verloopt over 24 uur. Vraag zo nodig een nieuwe bevestigingslink aan op de inlogpagina.</p>
        </div>
      </div>
      <div class="email-footer">
        <p class="footer-text">
          <span class="footer-brand">ArchonPro</span> — Slim bedrijfsbeheer voor professionals
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
  },
  recovery: {
    subject: "Wachtwoord resetten - ArchonPro",
    html: (data: Record<string, string>) => `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wachtwoord reset - ArchonPro</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Manrope', 'Avenir Next', 'Segoe UI', 'Helvetica Neue', sans-serif;
      background-color: #f3f7fc;
      color: #0b1220;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .email-container {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(11, 18, 32, 0.08);
      overflow: hidden;
    }
    .email-header {
      background: linear-gradient(135deg, #6861f2 0%, #8b5cf6 100%);
      padding: 40px 32px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .logo span { opacity: 0.9; }
    .email-body {
      padding: 40px 32px;
    }
    .greeting {
      font-size: 22px;
      font-weight: 600;
      color: #0b1220;
      margin-bottom: 16px;
    }
    .message {
      font-size: 16px;
      color: #4b5f7a;
      margin-bottom: 32px;
      line-height: 1.7;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #6861f2 0%, #8b5cf6 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 14px rgba(104, 97, 242, 0.35);
    }
    .button-wrapper {
      text-align: center;
      margin: 32px 0;
    }
    .fallback-link {
      background: #eaf0f7;
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
      word-break: break-all;
    }
    .fallback-link p {
      font-size: 13px;
      color: #4b5f7a;
      margin-bottom: 8px;
    }
    .fallback-link a {
      color: #6861f2;
      text-decoration: none;
      font-size: 13px;
    }
    .email-footer {
      background: #f8fbff;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #e9eff7;
    }
    .footer-text {
      font-size: 13px;
      color: #4b5f7a;
    }
    .footer-brand {
      font-weight: 600;
      color: #6861f2;
    }
    .divider {
      height: 1px;
      background: #e9eff7;
      margin: 24px 0;
    }
    .security-note {
      background: #fff7ed;
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
      border-left: 4px solid #f97316;
    }
    .security-note p {
      font-size: 13px;
      color: #7c2d12;
    }
    .security-note strong { color: #9a3412; }
    @media only screen and (max-width: 480px) {
      .email-wrapper { padding: 20px 16px; }
      .email-header { padding: 32px 24px; }
      .email-body { padding: 32px 24px; }
      .greeting { font-size: 20px; }
      .cta-button { display: block; text-align: center; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="logo">Archon<span>Pro</span></div>
      </div>
      <div class="email-body">
        <h1 class="greeting">Wachtwoord resetten</h1>
        <p class="message">
          We hebben een verzoek ontvangen om het wachtwoord voor je account (${data.email}) te resetten. Klik op de onderstaande knop om een nieuw wachtwoord in te stellen.
        </p>
        <div class="button-wrapper">
          <a href="${data.confirmation_url}" class="cta-button">Nieuw wachtwoord instellen</a>
        </div>
        <div class="divider"></div>
        <div class="fallback-link">
          <p>Als de knop niet werkt, kopieer en plak deze link in je browser:</p>
          <a href="${data.confirmation_url}">${data.confirmation_url}</a>
        </div>
        <div class="security-note">
          <p><strong>Let op:</strong> Als jij dit verzoek niet hebt gedaan, kun je deze e-mail veilig negeren. Je wachtwoord blijft dan ongewijzigd.</p>
        </div>
      </div>
      <div class="email-footer">
        <p class="footer-text">
          <span class="footer-brand">ArchonPro</span> — Slim bedrijfsbeheer voor professionals
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
  },
  invite: {
    subject: "Je bent uitgenodigd voor ArchonPro",
    html: (data: Record<string, string>) => `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Uitnodiging - ArchonPro</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Manrope', 'Avenir Next', 'Segoe UI', 'Helvetica Neue', sans-serif;
      background-color: #f3f7fc;
      color: #0b1220;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .email-container {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(11, 18, 32, 0.08);
      overflow: hidden;
    }
    .email-header {
      background: linear-gradient(135deg, #6861f2 0%, #8b5cf6 100%);
      padding: 40px 32px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .logo span { opacity: 0.9; }
    .email-body {
      padding: 40px 32px;
    }
    .greeting {
      font-size: 22px;
      font-weight: 600;
      color: #0b1220;
      margin-bottom: 16px;
    }
    .message {
      font-size: 16px;
      color: #4b5f7a;
      margin-bottom: 32px;
      line-height: 1.7;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #6861f2 0%, #8b5cf6 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 14px rgba(104, 97, 242, 0.35);
    }
    .button-wrapper {
      text-align: center;
      margin: 32px 0;
    }
    .fallback-link {
      background: #eaf0f7;
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
      word-break: break-all;
    }
    .fallback-link p {
      font-size: 13px;
      color: #4b5f7a;
      margin-bottom: 8px;
    }
    .fallback-link a {
      color: #6861f2;
      text-decoration: none;
      font-size: 13px;
    }
    .email-footer {
      background: #f8fbff;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #e9eff7;
    }
    .footer-text {
      font-size: 13px;
      color: #4b5f7a;
    }
    .footer-brand {
      font-weight: 600;
      color: #6861f2;
    }
    .divider {
      height: 1px;
      background: #e9eff7;
      margin: 24px 0;
    }
    @media only screen and (max-width: 480px) {
      .email-wrapper { padding: 20px 16px; }
      .email-header { padding: 32px 24px; }
      .email-body { padding: 32px 24px; }
      .greeting { font-size: 20px; }
      .cta-button { display: block; text-align: center; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="logo">Archon<span>Pro</span></div>
      </div>
      <div class="email-body">
        <h1 class="greeting">Je bent uitgenodigd!</h1>
        <p class="message">
          Je bent uitgenodigd om deel te nemen aan ArchonPro. Klik op de onderstaande knop om je account aan te maken en aan de slag te gaan.
        </p>
        <div class="button-wrapper">
          <a href="${data.confirmation_url}" class="cta-button">Uitnodiging accepteren</a>
        </div>
        <div class="divider"></div>
        <div class="fallback-link">
          <p>Als de knop niet werkt, kopieer en plak deze link in je browser:</p>
          <a href="${data.confirmation_url}">${data.confirmation_url}</a>
        </div>
      </div>
      <div class="email-footer">
        <p class="footer-text">
          <span class="footer-brand">ArchonPro</span> — Slim bedrijfsbeheer voor professionals
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
  },
  email_change: {
    subject: "Bevestig e-mailadres wijziging - ArchonPro",
    html: (data: Record<string, string>) => `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bevestig e-mailadres - ArchonPro</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Manrope', 'Avenir Next', 'Segoe UI', 'Helvetica Neue', sans-serif;
      background-color: #f3f7fc;
      color: #0b1220;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .email-container {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(11, 18, 32, 0.08);
      overflow: hidden;
    }
    .email-header {
      background: linear-gradient(135deg, #6861f2 0%, #8b5cf6 100%);
      padding: 40px 32px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .logo span { opacity: 0.9; }
    .email-body {
      padding: 40px 32px;
    }
    .greeting {
      font-size: 22px;
      font-weight: 600;
      color: #0b1220;
      margin-bottom: 16px;
    }
    .message {
      font-size: 16px;
      color: #4b5f7a;
      margin-bottom: 32px;
      line-height: 1.7;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #6861f2 0%, #8b5cf6 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 14px rgba(104, 97, 242, 0.35);
    }
    .button-wrapper {
      text-align: center;
      margin: 32px 0;
    }
    .fallback-link {
      background: #eaf0f7;
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
      word-break: break-all;
    }
    .fallback-link p {
      font-size: 13px;
      color: #4b5f7a;
      margin-bottom: 8px;
    }
    .fallback-link a {
      color: #6861f2;
      text-decoration: none;
      font-size: 13px;
    }
    .email-footer {
      background: #f8fbff;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #e9eff7;
    }
    .footer-text {
      font-size: 13px;
      color: #4b5f7a;
    }
    .footer-brand {
      font-weight: 600;
      color: #6861f2;
    }
    .divider {
      height: 1px;
      background: #e9eff7;
      margin: 24px 0;
    }
    .info-box {
      background: #e7eef9;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    .info-box p {
      font-size: 14px;
      color: #4b5f7a;
    }
    @media only screen and (max-width: 480px) {
      .email-wrapper { padding: 20px 16px; }
      .email-header { padding: 32px 24px; }
      .email-body { padding: 32px 24px; }
      .greeting { font-size: 20px; }
      .cta-button { display: block; text-align: center; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="logo">Archon<span>Pro</span></div>
      </div>
      <div class="email-body">
        <h1 class="greeting">Bevestig je nieuwe e-mailadres</h1>
        <p class="message">
          Je hebt aangegeven dat je je e-mailadres wilt wijzigen. Klik op de onderstaande knop om deze wijziging te bevestigen.
        </p>
        <div class="info-box">
          <p><strong>Huidig:</strong> ${data.email}</p>
          <p><strong>Nieuw:</strong> ${data.new_email}</p>
        </div>
        <div class="button-wrapper">
          <a href="${data.confirmation_url}" class="cta-button">Wijziging bevestigen</a>
        </div>
        <div class="divider"></div>
        <div class="fallback-link">
          <p>Als de knop niet werkt, kopieer en plak deze link in je browser:</p>
          <a href="${data.confirmation_url}">${data.confirmation_url}</a>
        </div>
      </div>
      <div class="email-footer">
        <p class="footer-text">
          <span class="footer-brand">ArchonPro</span> — Slim bedrijfsbeheer voor professionals
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
  }
};

Deno.serve(async (req) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);

    // Verify webhook signature
    if (HOOK_SECRET) {
      const wh = new Webhook(HOOK_SECRET.replace("v1,whsec_", ""));
      try {
        wh.verify(payload, headers);
      } catch (err) {
        console.error("Webhook verification failed:", err);
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    const { user, email_data } = JSON.parse(payload);
    const templateType = email_data.email_action_type as keyof typeof templates;
    
    // Generate confirmation URL
    const confirmationUrl = email_data.confirmation_url || 
      `${email_data.site_url}/auth/confirm?token_hash=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${email_data.redirect_to}`;

    // Get template
    const template = templates[templateType];
    if (!template) {
      console.error(`Unknown template type: ${templateType}`);
      return new Response(JSON.stringify({ error: "Unknown template type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Generate email content
    const htmlBody = template.html({
      confirmation_url: confirmationUrl,
      email: user.email,
      new_email: email_data.new_email || "",
      token: email_data.token || "",
      site_url: email_data.site_url
    });

    // Send via Resend (recommended) or fallback
    if (RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: user.email,
          subject: template.subject,
          html: htmlBody
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Resend API error:", error);
        return new Response(JSON.stringify({ error: "Failed to send email" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Email sent successfully via Resend" 
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // If no Resend, return the email content for Supabase to handle
    return new Response(JSON.stringify({
      email: {
        to: user.email,
        subject: template.subject,
        html: htmlBody
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error processing email:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
