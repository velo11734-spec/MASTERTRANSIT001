-- 016_fix_profile_trigger.sql
-- Fixes the handle_new_user trigger to properly parse OAuth (Google/Apple) metadata
-- Uses TEXT for role to avoid USER-DEFINED enum casting errors

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  extracted_name TEXT;
  extracted_role TEXT;
BEGIN
  -- Extract full name (Google sends 'name', email/password sends 'full_name')
  extracted_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'User'
  );

  -- Validate role — only allow known roles, default to passenger
  extracted_role := COALESCE(new.raw_user_meta_data->>'role', 'passenger');
  IF extracted_role NOT IN ('passenger', 'company_owner', 'company_staff', 'admin', 'super_admin') THEN
    extracted_role := 'passenger';
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
  VALUES (
    new.id,
    extracted_name,
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    extracted_role,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;
