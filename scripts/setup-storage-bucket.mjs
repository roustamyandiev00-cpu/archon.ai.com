
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function setupStorage() {
  console.log('🚀 Setting up Supabase Storage...')
  
  const bucketName = 'offerte-media'

  // 1. Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  
  if (listError) {
    console.error('❌ Error listing buckets:', listError.message)
    return
  }

  const bucketExists = buckets.find(b => b.name === bucketName)

  if (bucketExists) {
    console.log(`✅ Bucket "${bucketName}" already exists.`)
  } else {
    console.log(`🟡 Creating bucket "${bucketName}"...`)
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true, // Making it public as per common media requirements, can be adjusted
      allowedMimeTypes: ['image/*', 'application/pdf'],
      fileSizeLimit: 10485760 // 10MB
    })

    if (error) {
      console.error('❌ Error creating bucket:', error.message)
    } else {
      console.log(`✅ Bucket "${bucketName}" created successfully!`)
    }
  }

  console.log('\n✨ Storage setup complete!')
}

setupStorage()
