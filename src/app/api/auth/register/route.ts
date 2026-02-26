import { NextRequest, NextResponse } from'next/server'
import { getSupabaseAdmin } from'@/lib/supabaseAdmin'

// POST /api/auth/register - Create new user account
export async function POST(request: NextRequest) {
 try {
 const body = await request.json()
 const { name, email, password, moduleId } = body

 // Validation
 if (!name || !email || !password) {
 return NextResponse.json({ 
 success: false, 
 error:'Naam, email en wachtwoord zijn verplicht'
 }, { status: 400 })
 }

 if (password.length < 6) {
 return NextResponse.json({ 
 success: false, 
 error:'Wachtwoord moet minimaal 6 tekens bevatten'
 }, { status: 400 })
 }

 const supabase = getSupabaseAdmin()

 // Check if user already exists
 const { data: existingUser } = await (supabase
 .from('users') as any)
 .select('id')
 .eq('email', email)
 .single()

 if (existingUser) {
 return NextResponse.json({ 
 success: false, 
 error:'Er bestaat al een account met dit emailadres'
 }, { status: 400 })
 }

 // Create user in Supabase Auth
 const { data: authData, error: authError } = await supabase.auth.admin.createUser({
 email,
 password,
 email_confirm: true,
 user_metadata: {
 name,
 },
 })

 if (authError || !authData.user) {
 console.error('Error creating auth user:', authError)
 return NextResponse.json({ 
 success: false, 
 error:'Kon account niet aanmaken:'+ (authError?.message ||'Onbekende fout') 
 }, { status: 500 })
 }

 const userId = authData.user.id

 // Create user record in users table
 const { error: userError } = await (supabase
 .from('users') as any)
 .insert({
 id: userId,
 email,
 name,
 role:'user',
 is_blocked: false,
 tokens_used: 0,
 tokens_limit: 1000,
 })

 if (userError) {
 console.error('Error creating user record:', userError)
 // Try to clean up auth user
 await supabase.auth.admin.deleteUser(userId)
 return NextResponse.json({ 
 success: false, 
 error:'Kon gebruikersgegevens niet opslaan'
 }, { status: 500 })
 }

 // Create default integrations for user
 const integrations = [
 { user_id: userId, provider:'slack', is_enabled: false, is_connected: false },
 { user_id: userId, provider:'google_calendar', is_enabled: false, is_connected: false },
 { user_id: userId, provider:'microsoft_teams', is_enabled: false, is_connected: false },
 { user_id: userId, provider:'dropbox', is_enabled: false, is_connected: false },
 { user_id: userId, provider:'zapier', is_enabled: false, is_connected: false },
 { user_id: userId, provider:'quickbooks', is_enabled: false, is_connected: false },
 ]

 await (supabase
 .from('user_integrations') as any)
 .insert(integrations)

 // If moduleId provided, create subscription
 if (moduleId) {
 // Get module details
 const { data: module } = await (supabase
 .from('modules') as any)
 .select('*')
 .eq('id', moduleId)
 .single()

 if (module) {
 const { error: subError } = await (supabase
 .from('subscriptions') as any)
 .insert({
 user_id: userId,
 module_id: moduleId,
 status:'active',
 amount: module.price,
 })

 if (subError) {
 console.error('Error creating subscription:', subError)
 // Non-fatal, user is created
 }

 // Update user with subscription tier
 await (supabase
 .from('users') as any)
 .update({ subscription_tier: module.slug })
 .eq('id', userId)
 }
 }

 return NextResponse.json({ 
 success: true, 
 data: {
 id: userId,
 email,
 name,
 },
 message:'Account succesvol aangemaakt'
 })

 } catch (error) {
 console.error('Error in POST /api/auth/register:', error)
 return NextResponse.json({ 
 success: false, 
 error:'Interne server fout'
 }, { status: 500 })
 }
}
