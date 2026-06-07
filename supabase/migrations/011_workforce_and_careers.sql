-- Migration 011: RoutePro Workforce & Careers Ecosystem

-- Create Departments
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL for internal RoutePro admin
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Company Roles
CREATE TABLE IF NOT EXISTS company_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL for internal RoutePro admin
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Company Staff
CREATE TABLE IF NOT EXISTS company_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL for internal RoutePro admin
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  role_id UUID REFERENCES company_roles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Create Staff Invitations
CREATE TABLE IF NOT EXISTS staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL for internal RoutePro admin
  email TEXT NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  role_id UUID REFERENCES company_roles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Create Jobs Portal
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL for internal RoutePro admin
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Internship')),
  location TEXT NOT NULL,
  workplace_type TEXT NOT NULL CHECK (workplace_type IN ('On-site', 'Remote', 'Hybrid')),
  description TEXT NOT NULL,
  responsibilities TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  salary_min NUMERIC,
  salary_max NUMERIC,
  deadline TIMESTAMPTZ,
  openings INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Job Applications
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_url TEXT,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'under_review', 'shortlisted', 'interview_scheduled', 'interview_completed', 'verification', 'offer_sent', 'accepted', 'rejected', 'withdrawn')),
  timeline JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Interviews Table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL for RoutePro admin
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  location_type TEXT NOT NULL CHECK (location_type IN ('Online', 'On-site')),
  meeting_link TEXT,
  notes TEXT,
  score INTEGER CHECK (score BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'rescheduled', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Dynamic Policies
CREATE POLICY "Public read for jobs" ON jobs FOR SELECT USING (status = 'published');
CREATE POLICY "Companies can manage jobs" ON jobs FOR ALL USING (
  company_id IS NULL OR 
  EXISTS(SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid()) OR
  EXISTS(SELECT 1 FROM company_staff WHERE company_id = jobs.company_id AND user_id = auth.uid())
);

CREATE POLICY "Public read for departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Companies can manage departments" ON departments FOR ALL USING (
  company_id IS NULL OR EXISTS(SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);

CREATE POLICY "Public read for company_roles" ON company_roles FOR SELECT USING (true);
CREATE POLICY "Companies can manage roles" ON company_roles FOR ALL USING (
  company_id IS NULL OR EXISTS(SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);

CREATE POLICY "Users can read/manage their own applications" ON job_applications FOR ALL USING (
  applicant_id = auth.uid()
);
CREATE POLICY "Companies can manage applications for their jobs" ON job_applications FOR ALL USING (
  EXISTS(SELECT 1 FROM jobs WHERE id = job_applications.job_id AND (
    jobs.company_id IS NULL OR 
    EXISTS(SELECT 1 FROM companies WHERE id = jobs.company_id AND owner_id = auth.uid()) OR
    EXISTS(SELECT 1 FROM company_staff WHERE company_id = jobs.company_id AND user_id = auth.uid())
  ))
);

CREATE POLICY "Staff can view status" ON company_staff FOR SELECT USING (true);
CREATE POLICY "Owners can manage staff" ON company_staff FOR ALL USING (
  company_id IS NULL OR EXISTS(SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);

CREATE POLICY "Invitations viewable by company" ON staff_invitations FOR ALL USING (
  company_id IS NULL OR EXISTS(SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);

CREATE POLICY "Interviews viewable by company or applicant" ON interviews FOR ALL USING (
  EXISTS(SELECT 1 FROM job_applications WHERE id = interviews.application_id AND applicant_id = auth.uid()) OR
  company_id IS NULL OR
  EXISTS(SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);
