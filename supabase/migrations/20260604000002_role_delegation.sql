-- Add delegation fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN parent_id UUID REFERENCES public.profiles(id), -- Points to the Superadmin or Company Owner who created them
ADD COLUMN permissions JSONB DEFAULT '{}'::jsonb;

-- Ensure roles can handle 'admin_staff' and 'company_staff'
-- If role is an ENUM, you may need to run ALTER TYPE role_enum ADD VALUE IF NOT EXISTS 'company_staff';
-- If it's just TEXT, the frontend handles the rest.

-- Update profiles RLS to allow delegators to view/edit their staff
CREATE POLICY "Delegators can view their staff"
ON public.profiles FOR SELECT
USING (auth.uid() = parent_id);

CREATE POLICY "Delegators can update their staff"
ON public.profiles FOR UPDATE
USING (auth.uid() = parent_id);
