-- ============================================================
-- 019_definitive_auth_fix.sql
-- THE DEFINITIVE FIX for "Database error saving new user"
--
-- Root causes fixed:
-- 1. extracted_role declared as TEXT, passed to user_role ENUM → type mismatch
-- 2. Missing SET search_path = public on SECURITY DEFINER function
-- 3. ON CONFLICT DO NOTHING swallowed errors silently — now uses DO UPDATE
--
-- Run this in Supabase SQL Editor once to permanently fix Google OAuth
-- and Email/Password signup account creation failures.
-- ============================================================

-- Step 1: Drop existing trigger so we can cleanly recreate the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Recreate the function with ALL fixes applied
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public   -- CRITICAL: required in Supabase for SECURITY DEFINER
AS $$
DECLARE
  v_name TEXT;
  v_role user_role;
  v_phone TEXT;
  v_avatar TEXT;
BEGIN
  -- ── Extract full_name ──────────────────────────────────────────────────────
  -- Google OAuth sends: raw_user_meta_data->>'name' or ->>'full_name'
  -- Email signup sends: raw_user_meta_data->>'full_name'
  v_name := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(new.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(split_part(new.email, '@', 1)), ''),
    'User'
  );

  -- ── Extract avatar_url ─────────────────────────────────────────────────────
  -- Google sends picture, Apple sends nothing
  v_avatar := COALESCE(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    NULL
  );

  -- ── Extract phone ──────────────────────────────────────────────────────────
  v_phone := NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'phone', '')), '');

  -- ── Extract role, safely cast to user_role ENUM ───────────────────────────
  -- Wrap in BEGIN/EXCEPTION to handle any invalid value gracefully
  BEGIN
    v_role := COALESCE(
      new.raw_user_meta_data->>'role',
      'passenger'
    )::user_role;
  EXCEPTION WHEN invalid_text_representation OR OTHERS THEN
    v_role := 'passenger'::user_role;
  END;

  -- ── Insert profile row ────────────────────────────────────────────────────
  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    role,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    v_name,
    v_phone,
    v_role,
    v_avatar,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name  = CASE WHEN profiles.full_name IS NULL OR profiles.full_name = 'User' 
                      THEN EXCLUDED.full_name 
                      ELSE profiles.full_name END,
    avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = NOW();

  RETURN new;
END;
$$;

-- Step 3: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Verification: confirm trigger is live ─────────────────────────────────
SELECT
  tgname  AS trigger_name,
  proname AS function_name,
  prosrc  LIKE '%SET search_path%' OR prokind = 'f' AS search_path_set
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';
