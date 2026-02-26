import'server-only'

// ============================================
// Email Service - Multi-Tenant SaaS Support
// ============================================
// Each user has their own SMTP configuration stored in user_settings table
// System emails use platform-wide SMTP configuration

import nodemailer from'nodemailer'
import { getSupabaseAdmin } from'./supabaseAdmin'
import { decrypt } from'./encryption'

// ============================================
// System Email Configuration (Platform-wide)
// ============================================

function getSystemSmtpConfig() {
 return {
 host: process.env.SMTP_HOST ||'smtp.gmail.com',
 port: parseInt(process.env.SMTP_PORT ||'587'),
 secure: process.env.SMTP_PORT ==='465',
 user: process.env.SMTP_USER ||'',
 password: process.env.SMTP_PASS ||'',
 from: {
 name: process.env.SMTP_FROM_NAME ||'ArchonPro',
 address: process.env.SMTP_FROM ||'noreply@archonpro.nl'
 }
 }
}

// Check if system SMTP is configured
export function isSystemEmailConfigured(): boolean {
 return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

// Send system email (for platform notifications like welcome, trial-ending, etc.)
export async function sendSystemEmail(
 options: SendEmailOptions
): Promise<{ success: boolean; error?: string }> {
 const config = getSystemSmtpConfig()
 
 if (!config.host || !config.user || !config.password) {
 console.warn('System SMTP not configured. Email not sent.')
 return { 
 success: false, 
 error:'Systeem email niet geconfigureerd. Configureer SMTP instellingen.'
 }
 }

 try {
 const transporter = nodemailer.createTransport({
 host: config.host,
 port: config.port,
 secure: config.secure,
 auth: {
 user: config.user,
 pass: config.password,
 },
 })

 const { to, subject, html, text, replyTo, attachments } = options

 await transporter.sendMail({
 from: `"${config.from.name}"<${config.from.address}>`,
 to: Array.isArray(to) ? to.join(',') : to,
 subject,
 html,
 text,
 replyTo,
 attachments,
 })

 return { success: true }
 } catch (error: any) {
 console.error('Failed to send system email:', error)
 return { 
 success: false, 
 error: error?.message ||'Onbekende fout bij versturen e-mail'
 }
 }
}

export type EmailProvider ='gmail'|'outlook'|'custom'

export type UserEmailConfig = {
 provider: EmailProvider
 host: string
 port: number
 secure: boolean
 user: string
 password: string
 from: {
 name: string
 address: string
 }
}

export type SendEmailOptions = {
 to: string | string[]
 subject: string
 html?: string
 text?: string
 replyTo?: string
 attachments?: Array<{
 filename: string
 content: Buffer | string
 contentType?: string
 }>
}

// Get SMTP configuration for a specific user from database
export async function getUserSmtpConfig(userId: string): Promise<UserEmailConfig | null> {
 const supabase = getSupabaseAdmin()
 
 const { data, error } = await (supabase
 .from('user_settings') as any)
 .select('*')
 .eq('user_id', userId)
 .single()

 if (error || !data) {
 console.warn(`No SMTP config found for user ${userId}`)
 return null
 }

 const settings = data as any
 const provider = settings.smtp_provider as EmailProvider ||'gmail'
 
 const fromName = settings.email_from_name || settings.company_name ||'Archon AI'
 const fromAddress = settings.email_from_address || settings.smtp_gmail_user ||'noreply@example.com'

 switch (provider) {
 case'gmail': {
 const user = settings.smtp_gmail_user
 const encryptedPassword = settings.smtp_gmail_password
 
 if (!user || !encryptedPassword) {
 return null
 }
 
 // Decrypt password
 const password = decrypt(encryptedPassword)
 
 return {
 provider:'gmail',
 host:'smtp.gmail.com',
 port: 587,
 secure: false,
 user,
 password,
 from: { name: fromName, address: fromAddress }
 }
 }
 
 case'outlook': {
 const user = settings.smtp_outlook_user
 const encryptedPassword = settings.smtp_outlook_password
 
 if (!user || !encryptedPassword) {
 return null
 }
 
 // Decrypt password
 const password = decrypt(encryptedPassword)
 
 return {
 provider:'outlook',
 host:'smtp-mail.outlook.com',
 port: 587,
 secure: false,
 user,
 password,
 from: { name: fromName, address: fromAddress }
 }
 }
 
 case'custom': {
 const host = settings.smtp_custom_host
 const port = settings.smtp_custom_port || 587
 const user = settings.smtp_custom_user
 const encryptedPassword = settings.smtp_custom_password
 const customFrom = settings.smtp_custom_from
 
 if (!host || !user || !encryptedPassword) {
 return null
 }
 
 // Decrypt password
 const password = decrypt(encryptedPassword)
 
 return {
 provider:'custom',
 host,
 port,
 secure: port === 465,
 user,
 password,
 from: { name: fromName, address: customFrom || fromAddress }
 }
 }
 
 default:
 return null
 }
}

// Check if user has email configured
export async function isUserEmailConfigured(userId: string): Promise<boolean> {
 const config = await getUserSmtpConfig(userId)
 return config !== null
}

// Send email using user's SMTP configuration
export async function sendUserEmail(
 userId: string,
 options: SendEmailOptions
): Promise<{ success: boolean; error?: string }> {
 const config = await getUserSmtpConfig(userId)
 
 if (!config) {
 return { 
 success: false, 
 error:'Email niet geconfigureerd. Configureer je SMTP instellingen in Instellingen.'
 }
 }

 try {
 const nodemailer = await import('nodemailer')
 
 const transporter = nodemailer.default.createTransport({
 host: config.host,
 port: config.port,
 secure: config.secure,
 auth: {
 user: config.user,
 pass: config.password,
 },
 })

 const { to, subject, html, text, replyTo, attachments } = options

 await transporter.sendMail({
 from: `"${config.from.name}"<${config.from.address}>`,
 to: Array.isArray(to) ? to.join(',') : to,
 subject,
 html,
 text,
 replyTo,
 attachments,
 })

 return { success: true }
 } catch (error: any) {
 console.error('Failed to send email:', error)
 return { 
 success: false, 
 error: error?.message ||'Onbekende fout bij versturen e-mail'
 }
 }
}

// ============================================
// Email Templates
// ============================================

export function createInvoiceEmailTemplate(params: {
 invoiceNumber: string
 customerName: string
 amount: string
 dueDate: string
 companyName: string
 invoiceUrl?: string
}): { html: string; text: string } {
 const { invoiceNumber, customerName, amount, dueDate, companyName, invoiceUrl } = params

 const html = `
<!DOCTYPE html>
<html>
<head>
 <meta charset="utf-8">
 <style>
 body { font-family: -apple-system, BlinkMacSystemFont,'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
 .container { max-width: 600px; margin: 0 auto; padding: 20px; }
 .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
 .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
 .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
 .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
 .detail-row:last-child { border-bottom: none; }
 .amount { font-size: 24px; font-weight: bold; color: #667eea; }
 .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
 .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
 </style>
</head>
<body>
 <div class="container">
 <div class="header">
 <h1>Factuur ${invoiceNumber}</h1>
 <p>${companyName}</p>
 </div>
 <div class="content">
 <p>Beste ${customerName},</p>
 <p>Bijgaand ontvangt u factuur <strong>${invoiceNumber}</strong>.</p>
 
 <div class="invoice-details">
 <div class="detail-row">
 <span>Factuurnummer:</span>
 <strong>${invoiceNumber}</strong>
 </div>
 <div class="detail-row">
 <span>Bedrag:</span>
 <span class="amount">${amount}</span>
 </div>
 <div class="detail-row">
 <span>Vervaldatum:</span>
 <strong>${dueDate}</strong>
 </div>
 </div>
 
 ${invoiceUrl ? `<a href="${invoiceUrl}"class="button">Bekijk Factuur</a>` :''}
 
 <p>Met vriendelijke groet,<br>${companyName}</p>
 </div>
 <div class="footer">
 <p>Dit is een automatisch gegenereerde e-mail.</p>
 </div>
 </div>
</body>
</html>
 `.trim()

 const text = `
Factuur ${invoiceNumber}

Beste ${customerName},

Bijgaand ontvangt u factuur ${invoiceNumber}.

Factuurnummer: ${invoiceNumber}
Bedrag: ${amount}
Vervaldatum: ${dueDate}

${invoiceUrl ? `Bekijk de factuur: ${invoiceUrl}` :''}

Met vriendelijke groet,
${companyName}
 `.trim()

 return { html, text }
}

export function createQuoteEmailTemplate(params: {
 quoteNumber: string
 customerName: string
 amount: string
 validUntil: string
 companyName: string
 quoteUrl?: string
}): { html: string; text: string } {
 const { quoteNumber, customerName, amount, validUntil, companyName, quoteUrl } = params

 const html = `
<!DOCTYPE html>
<html>
<head>
 <meta charset="utf-8">
 <style>
 body { font-family: -apple-system, BlinkMacSystemFont,'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
 .container { max-width: 600px; margin: 0 auto; padding: 20px; }
 .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
 .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
 .quote-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
 .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
 .detail-row:last-child { border-bottom: none; }
 .amount { font-size: 24px; font-weight: bold; color: #10b981; }
 .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
 .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
 </style>
</head>
<body>
 <div class="container">
 <div class="header">
 <h1>Offerte ${quoteNumber}</h1>
 <p>${companyName}</p>
 </div>
 <div class="content">
 <p>Beste ${customerName},</p>
 <p>Hartelijk dank voor uw interesse. Bijgaand ontvangt u onze offerte <strong>${quoteNumber}</strong>.</p>
 
 <div class="quote-details">
 <div class="detail-row">
 <span>Offertenummer:</span>
 <strong>${quoteNumber}</strong>
 </div>
 <div class="detail-row">
 <span>Bedrag:</span>
 <span class="amount">${amount}</span>
 </div>
 <div class="detail-row">
 <span>Geldig tot:</span>
 <strong>${validUntil}</strong>
 </div>
 </div>
 
 ${quoteUrl ? `<a href="${quoteUrl}"class="button">Bekijk Offerte</a>` :''}
 
 <p>Heeft u vragen? Neem gerust contact met ons op.</p>
 <p>Met vriendelijke groet,<br>${companyName}</p>
 </div>
 <div class="footer">
 <p>Dit is een automatisch gegenereerde e-mail.</p>
 </div>
 </div>
</body>
</html>
 `.trim()

 const text = `
Offerte ${quoteNumber}

Beste ${customerName},

Hartelijk dank voor uw interesse. Bijgaand ontvangt u onze offerte ${quoteNumber}.

Offertenummer: ${quoteNumber}
Bedrag: ${amount}
Geldig tot: ${validUntil}

${quoteUrl ? `Bekijk de offerte: ${quoteUrl}` :''}

Heeft u vragen? Neem gerust contact met ons op.

Met vriendelijke groet,
${companyName}
 `.trim()

 return { html, text }
}

// ============================================
// Convenience Functions
// ============================================

export async function sendInvoiceEmail(
 userId: string,
 params: {
 to: string
 invoiceNumber: string
 customerName: string
 amount: string
 dueDate: string
 companyName: string
 invoiceUrl?: string
 attachment?: { filename: string; content: Buffer; contentType?: string }
 }
): Promise<{ success: boolean; error?: string }> {
 const { html, text } = createInvoiceEmailTemplate(params)
 
 return sendUserEmail(userId, {
 to: params.to,
 subject: `Factuur ${params.invoiceNumber} - ${params.companyName}`,
 html,
 text,
 attachments: params.attachment ? [params.attachment] : undefined,
 })
}

export async function sendQuoteEmail(
 userId: string,
 params: {
 to: string
 quoteNumber: string
 customerName: string
 amount: string
 validUntil: string
 companyName: string
 quoteUrl?: string
 attachment?: { filename: string; content: Buffer; contentType?: string }
 }
): Promise<{ success: boolean; error?: string }> {
 const { html, text } = createQuoteEmailTemplate(params)
 
 return sendUserEmail(userId, {
 to: params.to,
 subject: `Offerte ${params.quoteNumber} - ${params.companyName}`,
 html,
 text,
 attachments: params.attachment ? [params.attachment] : undefined,
 })
}
