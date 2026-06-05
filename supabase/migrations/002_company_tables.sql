-- 002_company_tables.sql
-- Migration for company onboarding and management

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cac_number TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, UNDER_REVIEW, APPROVED, REJECTED, SUSPENDED
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fleets (vehicle batches) table
CREATE TABLE fleets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  batch_code TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles table (individual vehicles linked to fleet)
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fleet_id UUID REFERENCES fleets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  number_plate TEXT NOT NULL,
  capacity INT,
  class TEXT,
  amenities JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routes table
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance_km NUMERIC,
  estimated_hours NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Terminals table
CREATE TABLE terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (basic, owners only)
-- Enable RLS on new tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminals ENABLE ROW LEVEL SECURITY;

-- Example policy: companies can be read by admins or the company itself (owner relationship handled via auth functions)
-- (Policies will be refined later)

-- Insert seed data placeholder
INSERT INTO companies (name, cac_number, status) VALUES ('Example Transport Co', 'RC1234567', 'APPROVED');
