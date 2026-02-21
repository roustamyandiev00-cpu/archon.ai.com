-- Maak admin gebruiker aan of upgrade bestaande gebruiker
-- Run dit in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

DO $$
DECLARE
  admin_email TEXT := 'roustamyandiev00@gmail.com';
  admin_password TEXT := 'admin123';
  user_id UUID;
  auth_user_id UUID;
BEGIN
  -- Check if auth user exists
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = admin_email;

  IF auth_user_id IS NULL THEN
    -- Create auth user
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      confirmation_sent_at
    ) VALUES (
      gen_random_uuid(),
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      NOW(),
      '{"name": "Admin User"}',
      NOW(),
      NOW(),
      'authenticated',
      NOW()
    )
    RETURNING id INTO user_id;
    
    RAISE NOTICE '✅ Auth user created: %', user_id;
  ELSE
    user_id := auth_user_id;
    RAISE NOTICE '⚠️  User already exists, upgrading to admin: %', user_id;
  END IF;

  -- Check if user exists in users table
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = user_id::TEXT) THEN
    -- Create user record
    INSERT INTO users (id, email, name, role, is_blocked, tokens_used, tokens_limit, created_at)
    VALUES (
      user_id::TEXT,
      admin_email,
      'Admin User',
      'admin',
      false,
      0,
      100000,
      NOW()
    );
    
    -- Create default integrations
    INSERT INTO user_integrations (user_id, provider, is_enabled, is_connected)
    VALUES 
      (user_id::TEXT, 'slack', false, false),
      (user_id::TEXT, 'google_calendar', false, false),
      (user_id::TEXT, 'microsoft_teams', false, false),
      (user_id::TEXT, 'dropbox', false, false),
      (user_id::TEXT, 'zapier', false, false),
      (user_id::TEXT, 'quickbooks', false, false);
    
    RAISE NOTICE '✅ User record and integrations created';
  ELSE
    -- Update existing user to admin
    UPDATE users SET 
      role = 'admin',
      tokens_limit = 100000
    WHERE id = user_id::TEXT;
    
    RAISE NOTICE '✅ User upgraded to admin';
  END IF;

  RAISE NOTICE '✅ DONE! Login with:';
  RAISE NOTICE '   Email: %', admin_email;
  RAISE NOTICE '   Password: %', admin_password;
  RAISE NOTICE '   URL: http://localhost:3000/login';
  
END $$;
