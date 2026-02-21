#!/bin/bash

# Vercel Environment Variables Setup Script

echo "Setting up Vercel environment variables..."

# Add all environment variables to Vercel
# Using echo to pipe values to vercel env add commands

echo "https://hqeozmmlddvempancnao.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "https://hqeozmmlddvempancnao.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview
echo "https://hqeozmmlddvempancnao.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL development

echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZW96bW1sZGR2ZW1wYW5jbmFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NDE0OTAsImV4cCI6MjA4NzIxNzQ5MH0.AdNH_DwkvsiR_RhRqRbzp6fSxGd-GiKacIjiB4mbEDE" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZW96bW1sZGR2ZW1wYW5jbmFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NDE0OTAsImV4cCI6MjA4NzIxNzQ5MH0.AdNH_DwkvsiR_RhRqRbzp6fSxGd-GiKacIjiB4mbEDE" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZW96bW1sZGR2ZW1wYW5jbmFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NDE0OTAsImV4cCI6MjA4NzIxNzQ5MH0.AdNH_DwkvsiR_RhRqRbzp6fSxGd-GiKacIjiB4mbEDE" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development

echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZW96bW1sZGR2ZW1wYW5jbmFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY0MTQ5MCwiZXhwIjoyMDg3MjE3NDkwfQ.tPqLpISxLCHamKuwWV7O0JawsObQieYrQPBvK7TGTsw" | vercel env add SUPABASE_SERVICE_ROLE_KEY production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZW96bW1sZGR2ZW1wYW5jbmFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY0MTQ5MCwiZXhwIjoyMDg3MjE3NDkwfQ.tPqLpISxLCHamKuwWV7O0JawsObQieYrQPBvK7TGTsw" | vercel env add SUPABASE_SERVICE_ROLE_KEY preview
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZW96bW1sZGR2ZW1wYW5jbmFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY0MTQ5MCwiZXhwIjoyMDg3MjE3NDkwfQ.tPqLpISxLCHamKuwWV7O0JawsObQieYrQPBvK7TGTsw" | vercel env add SUPABASE_SERVICE_ROLE_KEY development

echo "gJ0Lb3k5TJIZ/iRmgJMP+IgWkOomhk46u5ywvSsU+DC7lPEbaGGb8tGp5oD4dS7BT1zXocfEj2RxyYVeoTeCyQ==" | vercel env add ENCRYPTION_KEY production
echo "gJ0Lb3k5TJIZ/iRmgJMP+IgWkOomhk46u5ywvSsU+DC7lPEbaGGb8tGp5oD4dS7BT1zXocfEj2RxyYVeoTeCyQ==" | vercel env add ENCRYPTION_KEY preview
echo "gJ0Lb3k5TJIZ/iRmgJMP+IgWkOomhk46u5ywvSsU+DC7lPEbaGGb8tGp5oD4dS7BT1zXocfEj2RxyYVeoTeCyQ==" | vercel env add ENCRYPTION_KEY development

echo "AIzaSyAGF5Lbj6qXyKEkbmge7IRVN-WQU0X_K6U" | vercel env add GEMINI_API_KEY production
echo "AIzaSyAGF5Lbj6qXyKEkbmge7IRVN-WQU0X_K6U" | vercel env add GEMINI_API_KEY preview
echo "AIzaSyAGF5Lbj6qXyKEkbmge7IRVN-WQU0X_K6U" | vercel env add GEMINI_API_KEY development

echo "postgresql://postgres:sbp_c671761cfaa21d760ede75b4dcb3e1f00bb9fe49@db.hqeozmmlddvempancnao.supabase.co:5432/postgres" | vercel env add DATABASE_URL production
echo "postgresql://postgres:sbp_c671761cfaa21d760ede75b4dcb3e1f00bb9fe49@db.hqeozmmlddvempancnao.supabase.co:5432/postgres" | vercel env add DATABASE_URL preview
echo "postgresql://postgres:sbp_c671761cfaa21d760ede75b4dcb3e1f00bb9fe49@db.hqeozmmlddvempancnao.supabase.co:5432/postgres" | vercel env add DATABASE_URL development

echo "Environment variables setup complete!"
echo "Now deploying to Vercel..."