const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
})

async function resetAdmin() {
  const email = 'roustamyandiev00@gmail.com'
  const password = 'Admin123123'

  console.log(`Resetting admin user: ${email}`)

  // 1. Find and delete existing auth user
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) throw listError

  const existingUser = users.find(u => u.email === email)
  if (existingUser) {
    console.log(`Deleting existing auth user: ${existingUser.id}`)
    await supabase.auth.admin.deleteUser(existingUser.id)
  }

  // 2. Create new auth user
  console.log('Creating new auth user...')
  const { data: authData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'Roustam Yandiev' }
  })
  if (createError) throw createError
  const userId = authData.user.id
  console.log(`New auth user created: ${userId}`)

  // 3. Upsert into public.users table
  console.log('Updating public.users table...')
  const { error: upsertError } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email: email,
      name: 'Roustam Yandiev',
      role: 'ceo',
      is_blocked: false,
      tokens_limit: 1000000
    })
  if (upsertError) throw upsertError

  console.log('✅ Admin user successfully reset and role set to ceo!')
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
}

resetAdmin().catch(console.error)
