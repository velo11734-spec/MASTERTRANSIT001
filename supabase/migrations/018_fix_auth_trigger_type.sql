-- 018_fix_auth_trigger_type.sql
-- Fixes the type mismatch (TEXT -> ENUM) causing "Database error saving new user"

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  extracted_name TEXT;
  extracted_role user_role;
BEGIN
  -- Safely extract name (handles Google, Apple, and Email/Password)
  extracted_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'User'
  );

  -- Safely extract and cast role to ENUM
  BEGIN
    extracted_role := COALESCE(new.raw_user_meta_data->>'role', 'passenger')::user_role;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback if an invalid role string is somehow passed
    extracted_role := 'passenger'::user_role;
  END;

  INSERT INTO public.profiles (
    id, 
    full_name, 
    phone, 
    role, 
    created_at, 
    updated_at
  )
  VALUES (
    new.id,
    extracted_name,
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    extracted_role,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Update the name if it was just 'User' before but now we have a real name from OAuth
    full_name = EXCLUDED.full_name;

  RETURN new;
END;
$$;
