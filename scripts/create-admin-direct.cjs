// Script to create admin user directly via Supabase API
const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: Missing environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'OK' : 'MISSING')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'OK' : 'MISSING')
  process.exit(1)
}

console.log('Supabase URL:', supabaseUrl)
console.log('Service Role Key:', serviceRoleKey ? `${serviceRoleKey.substring(0, 20)}...` : 'MISSING')

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})

async function createAdminUser() {
  const email = 'roustamyandiev00@gmail.com'
  const password = 'Admin123123'
  const name = 'Roustam Yandiev'

  console.log('\n=== Creating admin user ===')
  console.log('Email:', email)

  try {
    // Step 1: Create user in auth
    console.log('\n1. Creating auth user...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      
      // Check if user already exists
      if (authError.message?.includes('already been registered')) {
        console.log('User already exists, fetching user...')
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
        
        if (listError) {
          console.error('Error listing users:', listError)
          return
        }
        
        const existingUser = users.find(u => u.email === email)
        if (existingUser) {
          console.log('Found existing user:', existingUser.id)
          
          // Update user record with ceo role
          console.log('\n2. Updating user role to ceo...')
          const { error: updateError } = await supabase
            .from('users')
            .upsert({
              id: existingUser.id,
              email,
              name,
              role: 'ceo',
              is_blocked: false,
              tokens_used: 0,
              tokens_limit: 10000,
            })
          
          if (updateError) {
            console.error('Error updating user:', updateError)
          } else {
            console.log('✅ User role updated to ceo!')
          }
        }
      }
      return
    }

    if (!authData.user) {
      console.error('No user returned')
      return
    }

    console.log('✅ Auth user created:', authData.user.id)

    // Step 2: Create user record with ceo role
    console.log('\n2. Creating user record with ceo role...')
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
      console.error('User record error:', userError)
      
      // Try update if insert fails
      console.log('Trying to update existing record...')
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'ceo' })
        .eq('id', authData.user.id)
      
      if (updateError) {
        console.error('Update error:', updateError)
      } else {
        console.log('✅ User role updated to ceo!')
      }
    } else {
      console.log('✅ User record created with ceo role!')
    }

    // Step 3: Verify
    console.log('\n3. Verifying user...')
    const { data: userData, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (verifyError) {
      console.error('Verify error:', verifyError)
    } else {
      console.log('✅ User verified:')
      console.log('   ID:', userData.id)
      console.log('   Email:', userData.email)
      console.log('   Name:', userData.name)
      console.log('   Role:', userData.role)
    }

    console.log('\n=== DONE ===')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('Role: ceo')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createAdminUser()
