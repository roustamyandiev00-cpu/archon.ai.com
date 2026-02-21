// Script to create admin user
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})

async function createAdminUser() {
  const email = 'roustamyandiev9@gmail.com'
  const password = 'Admin123123'
  const name = 'Roustam Yandiev'

  try {
    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
      },
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return
    }

    console.log('Auth user created:', authData.user.id)

    // Create user record with ceo role
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: 'ceo',
        is_blocked: false,
        tokens_used: 0,
        tokens_limit: 10000,
      })

    if (userError) {
      console.error('Error creating user record:', userError)
      // Try update if exists
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'ceo' })
        .eq('id', authData.user.id)
      
      if (updateError) {
        console.error('Error updating user:', updateError)
      } else {
        console.log('User role updated to ceo')
      }
    } else {
      console.log('User record created with ceo role')
    }

    console.log('Done! Admin user created successfully.')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('Role: ceo')
  } catch (error) {
    console.error('Error:', error)
  }
}

createAdminUser()
