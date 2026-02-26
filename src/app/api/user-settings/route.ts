import { NextRequest, NextResponse } from'next/server'
import { getSupabaseAdmin } from'@/lib/supabaseAdmin'
import { getUserFromRequest } from'@/lib/admin'

export async function GET(request: NextRequest) {
 try {
 const user = await getUserFromRequest(request)
 if (!user) {
 return NextResponse.json(
 { success: false, error:'Niet geautoriseerd'},
 { status: 401 }
 )
 }

 const supabase = getSupabaseAdmin()
 
 // Get or create user settings
 let { data: settings, error } = await (supabase as any)
 .from('user_settings')
 .select('*')
 .eq('user_id', user.id)
 .single()

 if (error && error.code ==='PGRST116') {
 // No settings found, create default
 const { data: newSettings, error: createError } = await (supabase as any)
 .from('user_settings')
 .insert([{ user_id: user.id }])
 .select()
 .single()

 if (createError) throw createError
 settings = newSettings
 } else if (error) {
 throw error
 }

 const s: any = settings || {};
 return NextResponse.json({
 success: true,
 settings: {
 companyName: s.company_name,
 companyLogo: s.company_logo,
 companyAddress: s.company_address || null,
 companyKvk: s.company_kvk || null,
 companyBtw: s.company_btw || null,
 smtpProvider: s.smtp_provider,
 smtpGmailUser: s.smtp_gmail_user,
 smtpGmailPassword: s.smtp_gmail_password,
 smtpOutlookUser: s.smtp_outlook_user,
 smtpOutlookPassword: s.smtp_outlook_password,
 smtpCustomHost: s.smtp_custom_host,
 smtpCustomPort: s.smtp_custom_port,
 smtpCustomUser: s.smtp_custom_user,
 smtpCustomPassword: s.smtp_custom_password,
 smtpCustomFrom: s.smtp_custom_from,
 emailFromName: s.email_from_name,
 emailFromAddress: s.email_from_address,
 stripePublishableKey: s.stripe_publishable_key,
 stripeSecretKey: s.stripe_secret_key,
 stripeWebhookSecret: s.stripe_webhook_secret,
 stripeTestMode: s.stripe_test_mode,
 notifyEmailNewDeal: s.notify_email_new_deal ?? true,
 notifyEmailInvoice: s.notify_email_invoice ?? true,
 notifyEmailWeekly: s.notify_email_weekly ?? true,
 notifyEmailMarketing: s.notify_email_marketing ?? false,
 notifyPushAppointment: s.notify_push_appointment ?? true,
 notifyPushTask: s.notify_push_task ?? false,
 quotationTemplate: s.quotation_template ||'quotation-variant-1a-basic',
 invoiceTemplate: s.invoice_template ||'invoice-variant-1-basic',
 pdfOfferteTemplate: s.pdf_offerte_template ||'modern',
 pdfFactuurTemplate: s.pdf_factuur_template ||'modern',
 pdfLanguage: s.pdf_language ||'nl',
 pdfCurrency: s.pdf_currency ||'EUR',
 pdfFooterText: s.pdf_footer_text ||''
 }
 })
 } catch (error) {
 console.error('Error in /api/user-settings GET:', error)
 return NextResponse.json(
 { success: false, error:'Server fout'},
 { status: 500 }
 )
 }
}

export async function POST(request: NextRequest) {
 try {
 const user = await getUserFromRequest(request)
 if (!user) {
 return NextResponse.json(
 { success: false, error:'Niet geautoriseerd'},
 { status: 401 }
 )
 }

 const body = await request.json()
 const supabase = getSupabaseAdmin()

 // Update user settings
 const { error } = await (supabase as any)
 .from('user_settings')
 .upsert([
 {
 user_id: user.id,
 company_name: body.company_name,
 company_address: body.company_address,
 company_kvk: body.company_kvk,
 company_btw: body.company_btw,
 smtp_provider: body.smtp_provider,
 smtp_gmail_user: body.smtp_gmail_user,
 smtp_gmail_password: body.smtp_gmail_password,
 smtp_outlook_user: body.smtp_outlook_user,
 smtp_outlook_password: body.smtp_outlook_password,
 smtp_custom_host: body.smtp_custom_host,
 smtp_custom_port: body.smtp_custom_port,
 smtp_custom_user: body.smtp_custom_user,
 smtp_custom_password: body.smtp_custom_password,
 smtp_custom_from: body.smtp_custom_from,
 email_from_name: body.email_from_name,
 email_from_address: body.email_from_address,
 stripe_publishable_key: body.stripe_publishable_key,
 stripe_secret_key: body.stripe_secret_key,
 stripe_webhook_secret: body.stripe_webhook_secret,
 stripe_test_mode: body.stripe_test_mode,
 notify_email_new_deal: body.notify_email_new_deal,
 notify_email_invoice: body.notify_email_invoice,
 notify_email_weekly: body.notify_email_weekly,
 notify_email_marketing: body.notify_email_marketing,
 notify_push_appointment: body.notify_push_appointment,
 notify_push_task: body.notify_push_task,
 quotation_template: body.quotation_template,
 invoice_template: body.invoice_template,
 pdf_offerte_template: body.pdf_offerte_template,
 pdf_factuur_template: body.pdf_factuur_template,
 pdf_language: body.pdf_language,
 pdf_currency: body.pdf_currency,
 pdf_footer_text: body.pdf_footer_text,
 updated_at: new Date().toISOString()
 }
 ])

 if (error) throw error

 return NextResponse.json({ success: true })
 } catch (error) {
 console.error('Error in /api/user-settings POST:', error)
 return NextResponse.json(
 { success: false, error:'Server fout'},
 { status: 500 }
 )
 }
}