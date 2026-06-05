-- 1. Create specific storage buckets for different functions
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('company_cac', 'company_cac', false),
  ('company_insurance', 'company_insurance', false),
  ('company_ids', 'company_ids', false),
  ('vehicle_photos', 'vehicle_photos', true),
  ('user_avatars', 'user_avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Setup RLS Policies for Storage Buckets
-- Note: 'storage.objects' RLS must be enabled if not already
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- vehicle_photos and user_avatars are public for reading
CREATE POLICY "Public Access for Vehicle Photos" ON storage.objects FOR SELECT USING (bucket_id = 'vehicle_photos');
CREATE POLICY "Public Access for User Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'user_avatars');

-- Companies and admins can read their own documents (Admins can read all, handled by a separate super admin policy if needed)
CREATE POLICY "Companies can read their own CACs" ON storage.objects FOR SELECT USING (bucket_id = 'company_cac' AND auth.uid() = owner);
CREATE POLICY "Companies can read their own Insurance" ON storage.objects FOR SELECT USING (bucket_id = 'company_insurance' AND auth.uid() = owner);
CREATE POLICY "Companies can read their own IDs" ON storage.objects FOR SELECT USING (bucket_id = 'company_ids' AND auth.uid() = owner);

-- Authenticated users can upload to these buckets
CREATE POLICY "Users can upload CAC" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company_cac' AND auth.uid() = owner);
CREATE POLICY "Users can upload Insurance" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company_insurance' AND auth.uid() = owner);
CREATE POLICY "Users can upload IDs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company_ids' AND auth.uid() = owner);
CREATE POLICY "Users can upload vehicle photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vehicle_photos' AND auth.uid() = owner);
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'user_avatars' AND auth.uid() = owner);

-- 3. Seed Super Admin User (olaideheritagetemitope@gmail.com)
DO $$
DECLARE
  super_admin_uid uuid := uuid_generate_v4();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'olaideheritagetemitope@gmail.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      confirmation_token
    ) VALUES (
      super_admin_uid,
      '00000000-0000-0000-0000-000000000000',
      'olaideheritagetemitope@gmail.com',
      crypt('7058976950', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Super Admin"}',
      now(),
      now(),
      'authenticated',
      ''
    );
    
    -- Add to profiles table
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (super_admin_uid, 'Super Admin', 'super_admin');
  END IF;
END $$;
