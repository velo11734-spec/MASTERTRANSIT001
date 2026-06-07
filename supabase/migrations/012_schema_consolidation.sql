-- Phase 1: Database Cleanup & Schema Consolidation
-- Fixes missing tables and adds missing columns/indexes

-- 1. fleet_vehicles
CREATE TABLE IF NOT EXISTS fleet_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL DEFAULT 'bus',
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT,
  plate_number TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 1,
  color TEXT,
  vin TEXT,
  fuel_type TEXT DEFAULT 'petrol',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','maintenance','retired','sold')),
  mileage_km NUMERIC(10,2) DEFAULT 0,
  purchase_date DATE,
  insurance_expiry DATE,
  roadworthiness_expiry DATE,
  photos JSONB DEFAULT '[]',
  amenities JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. company_team_members
CREATE TABLE IF NOT EXISTS company_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner','manager','operations','fleet_manager','booking_officer','sales_officer','rental_officer','accountant','staff')),
  permissions JSONB DEFAULT '{}',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, email)
);

-- 3. company_wallets
CREATE TABLE IF NOT EXISTS company_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  pending_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  total_earned NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  total_withdrawn NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'NGN',
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. vehicle_listings
CREATE TABLE IF NOT EXISTS vehicle_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'car',
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL,
  price NUMERIC(15,2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  condition TEXT NOT NULL DEFAULT 'used' CHECK (condition IN ('new','used','certified_pre_owned')),
  mileage_km NUMERIC(10,2),
  fuel_type TEXT DEFAULT 'petrol',
  transmission TEXT DEFAULT 'manual',
  color TEXT,
  vin TEXT,
  description TEXT,
  features JSONB DEFAULT '[]',
  photos JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold','reserved','inactive')),
  is_negotiable BOOLEAN DEFAULT true,
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. vehicle_leads
CREATE TABLE IF NOT EXISTS vehicle_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES vehicle_listings(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','negotiating','closed_won','closed_lost')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. rental_listings
CREATE TABLE IF NOT EXISTS rental_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'car',
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT,
  daily_rate NUMERIC(10,2) NOT NULL,
  weekly_rate NUMERIC(10,2),
  monthly_rate NUMERIC(10,2),
  currency TEXT DEFAULT 'NGN',
  security_deposit NUMERIC(10,2) DEFAULT 0,
  minimum_days INT DEFAULT 1,
  maximum_days INT DEFAULT 30,
  fuel_type TEXT DEFAULT 'petrol',
  transmission TEXT DEFAULT 'manual',
  capacity INT DEFAULT 5,
  color TEXT,
  features JSONB DEFAULT '[]',
  photos JSONB DEFAULT '[]',
  pickup_locations JSONB DEFAULT '[]',
  requirements TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','rented','maintenance','inactive')),
  with_driver BOOLEAN DEFAULT false,
  driver_rate_daily NUMERIC(10,2),
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Add missing columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reference TEXT UNIQUE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS seat_numbers JSONB DEFAULT '[]';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS passenger_count INT DEFAULT 1;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS business_roles JSONB DEFAULT '[]';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE trips ADD COLUMN IF NOT EXISTS available_seats INT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS booked_seats INT DEFAULT 0;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;

-- 8. Enable RLS
ALTER TABLE fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_listings ENABLE ROW LEVEL SECURITY;

-- 9. Auto-create wallet
CREATE OR REPLACE FUNCTION create_company_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO company_wallets (company_id) VALUES (NEW.id)
  ON CONFLICT (company_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_company_created_create_wallet ON companies;
CREATE TRIGGER on_company_created_create_wallet
  AFTER INSERT ON companies
  FOR EACH ROW EXECUTE FUNCTION create_company_wallet();

-- Note: In order to handle platform_settings conflict safely, we would resolve it here if needed.
