-- RoutePro Extended Architecture & Support System
-- Phase 2 RLS + Support Schema

-- 1. Support System Schema
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- 2. Support System RLS
CREATE POLICY "Users can insert their own tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own tickets" ON support_tickets FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert messages on their tickets" ON ticket_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
);
CREATE POLICY "Users can view messages on their tickets" ON ticket_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
);

-- Note: Admin access is handled via Super Admin policies in previous migrations or via Service Role

-- 3. Vehicle Sales & Rentals RLS
CREATE POLICY "Users can view active vehicle listings" ON vehicle_listings FOR SELECT USING (status = 'active');
CREATE POLICY "Companies can manage their vehicle listings" ON vehicle_listings FOR ALL USING (public.has_company_access(company_id)) WITH CHECK (public.has_company_access(company_id));

CREATE POLICY "Users can view active rental listings" ON rental_listings FOR SELECT USING (status = 'active');
CREATE POLICY "Companies can manage their rental listings" ON rental_listings FOR ALL USING (public.has_company_access(company_id)) WITH CHECK (public.has_company_access(company_id));

-- 4. Employee Management & RBAC RLS
CREATE POLICY "Companies can manage departments" ON departments FOR ALL USING (public.has_company_access(company_id)) WITH CHECK (public.has_company_access(company_id));
CREATE POLICY "Companies can manage roles" ON company_roles FOR ALL USING (public.has_company_access(company_id)) WITH CHECK (public.has_company_access(company_id));
CREATE POLICY "Companies can manage staff" ON company_staff FOR ALL USING (public.has_company_access(company_id)) WITH CHECK (public.has_company_access(company_id));
CREATE POLICY "Companies can manage invitations" ON staff_invitations FOR ALL USING (public.has_company_access(company_id)) WITH CHECK (public.has_company_access(company_id));

-- 5. Job Portal RLS
CREATE POLICY "Companies can manage jobs" ON jobs FOR ALL USING (public.has_company_access(company_id)) WITH CHECK (public.has_company_access(company_id));
CREATE POLICY "Users can view published jobs" ON jobs FOR SELECT USING (status = 'published');

CREATE POLICY "Users can manage their job applications" ON job_applications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Companies can view applications for their jobs" ON job_applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM jobs j WHERE j.id = job_id AND public.has_company_access(j.company_id))
);

CREATE POLICY "Users can view their interviews" ON interviews FOR SELECT USING (
  EXISTS (SELECT 1 FROM job_applications a WHERE a.id = application_id AND a.user_id = auth.uid())
);
CREATE POLICY "Companies can manage interviews" ON interviews FOR ALL USING (
  EXISTS (SELECT 1 FROM job_applications a JOIN jobs j ON a.job_id = j.id WHERE a.id = application_id AND public.has_company_access(j.company_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM job_applications a JOIN jobs j ON a.job_id = j.id WHERE a.id = application_id AND public.has_company_access(j.company_id))
);

-- 6. Storage Bucket Policies (If buckets exist, else run manually later)
-- Note: Requires executing in Supabase dashboard directly to create buckets if not existing via API.
