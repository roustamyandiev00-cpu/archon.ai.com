import { getSupabaseAdmin } from"@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from'next/server';


// Telegram Bot API configuration
const TELEGRAM_API_URL ='https://api.telegram.org/bot';

export async function POST(request: NextRequest) {
 const supabaseAdmin = getSupabaseAdmin();
 try {
 const authHeader = request.headers.get('Authorization');
 if (!authHeader?.startsWith('Bearer')) {
 return NextResponse.json({ error:'Unauthorized'}, { status: 401 });
 }

 const token = authHeader.replace('Bearer','');
 const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

 if (authError || !user) {
 return NextResponse.json({ error:'Unauthorized'}, { status: 401 });
 }

 const body = await request.json();
 const { 
 chat_id,
 message,
 parse_mode ='HTML',
 template_id,
 variables
 } = body;

 if (!chat_id || !message) {
 return NextResponse.json({ 
 error:'Chat ID and message are required'
 }, { status: 400 });
 }

 // Get Telegram bot token from environment
 const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;

 if (!telegramBotToken) {
 return NextResponse.json({ 
 error:'Telegram Bot API not configured. Set TELEGRAM_BOT_TOKEN in environment.'
 }, { status: 400 });
 }

 // Replace variables in message if provided
 let processedMessage = message;
 if (variables && typeof variables ==='object') {
 Object.entries(variables).forEach(([key, value]) => {
 processedMessage = processedMessage.replace(new RegExp(`{${key}}`,'g'), String(value));
 });
 }

 // Send Telegram message via Bot API
 const response = await fetch(
 `${TELEGRAM_API_URL}${telegramBotToken}/sendMessage`,
 {
 method:'POST',
 headers: {
'Content-Type':'application/json',
 },
 body: JSON.stringify({
 chat_id: chat_id,
 text: processedMessage,
 parse_mode: parse_mode,
 })
 }
 );

 const result = await response.json();

 if (!response.ok || !result.ok) {
 console.error('Telegram API error:', result);
 
 // Log failed attempt
 await logCommunication({
 userId: user.id,
 recipient: chat_id,
 channel:'telegram',
 templateId: template_id,
 content: processedMessage,
 status:'failed',
 errorMessage: result.description ||'Unknown error'
 });

 return NextResponse.json({ 
 error:'Failed to send Telegram message',
 details: result.description 
 }, { status: 500 });
 }

 // Log successful send
 const logResult = await logCommunication({
 userId: user.id,
 recipient: chat_id,
 channel:'telegram',
 templateId: template_id,
 content: processedMessage,
 status:'sent',
 externalId: result.result?.message_id?.toString()
 });

 return NextResponse.json({
 success: true,
 data: {
 message_id: result.result?.message_id,
 chat_id: chat_id,
 date: result.result?.date,
 status:'sent',
 log_id: logResult?.id
 }
 });

 } catch (error) {
 console.error('Error sending Telegram message:', error);
 return NextResponse.json({ error:'Failed to send Telegram message'}, { status: 500 });
 }
}

// GET endpoint for Telegram bot info and webhook status
export async function GET(request: NextRequest) {
 const supabaseAdmin = getSupabaseAdmin();
 try {
 const authHeader = request.headers.get('Authorization');
 if (!authHeader?.startsWith('Bearer')) {
 return NextResponse.json({ error:'Unauthorized'}, { status: 401 });
 }

 const token = authHeader.replace('Bearer','');
 const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

 if (authError || !user) {
 return NextResponse.json({ error:'Unauthorized'}, { status: 401 });
 }

 const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;

 if (!telegramBotToken) {
 return NextResponse.json({ 
 configured: false,
 message:'Telegram Bot not configured'
 });
 }

 // Get bot info
 const meResponse = await fetch(`${TELEGRAM_API_URL}${telegramBotToken}/getMe`);
 const meResult = await meResponse.json();

 // Get webhook info
 const webhookResponse = await fetch(`${TELEGRAM_API_URL}${telegramBotToken}/getWebhookInfo`);
 const webhookResult = await webhookResponse.json();

 // Get communication logs for this user
 const { data: logs, error } = await (supabaseAdmin
 .from('communication_logs') as any)
 .select('*')
 .eq('user_id', user.id)
 .eq('channel','telegram')
 .order('sent_at', { ascending: false })
 .limit(50);

 return NextResponse.json({
 configured: true,
 bot: meResult.ok ? {
 id: meResult.result.id,
 username: meResult.result.username,
 first_name: meResult.result.first_name,
 is_bot: meResult.result.is_bot
 } : null,
 webhook: webhookResult.ok ? webhookResult.result : null,
 logs: logs || []
 });

 } catch (error) {
 console.error('Error getting Telegram info:', error);
 return NextResponse.json({ error:'Internal server error'}, { status: 500 });
 }
}

// Helper function to log communications
async function logCommunication({
 userId,
 recipient,
 channel,
 templateId,
 content,
 status,
 externalId,
 errorMessage
}: {
 userId: string;
 recipient: string;
 channel: string;
 templateId?: string;
 content: string;
 status: string;
 externalId?: string;
 errorMessage?: string;
}) {
 const supabaseAdmin = getSupabaseAdmin();
 try {
 const { data, error } = await (supabaseAdmin
 .from('communication_logs') as any)
 .insert({
 user_id: userId,
 recipient: recipient,
 channel: channel,
 template_id: templateId || null,
 content: content,
 status: status,
 external_id: externalId || null,
 error_message: errorMessage || null,
 sent_at: new Date().toISOString()
 })
 .select()
 .single();

 if (error) {
 console.error('Error logging communication:', error);
 return null;
 }

 return data;
 } catch (error) {
 console.error('Error in logCommunication:', error);
 return null;
 }
}
