-- Core SQL Migration File to set up all tables, database schemas, and RLS policies for MasterTransit
-- This matches our 20+ tables design system structure with configurable settings.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create roles type
CREATE TYPE user_role AS ENUM ('passenger', 'company_owner', 'company_staff', 'admin', 'super_admin');
CREATE TYPE verification_status AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE trip_status AS ENUM ('SCHEDULED', 'BOARDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE seat_status AS ENUM ('AVAILABLE', 'RESERVED', 'BOOKED', 'CHECKED_IN', 'COMPLETED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED');
CREATE TYPE payout_status AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');
CREATE TYPE refund_status AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED');
CREATE TYPE dispute_status AS ENUM ('OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED');

-- 1. USERS PROFILE
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'passenger',
  preferred_language TEXT DEFAULT 'en',
  preferred_currency TEXT DEFAULT 'NGN',
  avatar_url TEXT,
  nin TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COMPANIES
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL UNIQUE,
  cac_number TEXT NOT NULL UNIQUE,
  status verification_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COMPANY VERIFICATIONS DOCUMENTS
CREATE TABLE company_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL, -- e.g., 'cac_certificate', 'tax_document', 'owner_id', 'vehicle_papers'
  file_url TEXT NOT NULL,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. VEHICLE BATCHES
CREATE TABLE vehicle_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  batch_code TEXT NOT NULL, -- e.g., 'Batch A', 'Batch B'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. VEHICLES
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES vehicle_batches(id) ON DELETE SET NULL,
  name TEXT NOT NULL, -- e.g., 'ABC Luxury Coach'
  vehicle_number TEXT NOT NULL, -- e.g., 'A001'
  plate_number TEXT NOT NULL,
  capacity INT NOT NULL,
  comfort_class TEXT NOT NULL, -- e.g., 'Executive', 'Economy'
  amenities JSONB DEFAULT '[]'::jsonb, -- e.g., ['AC', 'WiFi', 'Charging Ports']
  photos JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TERMINALS
CREATE TABLE terminals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'Lagos Terminal'
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  address TEXT NOT NULL,
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DRIVERS
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  license_number TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ROUTES
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance_km NUMERIC(6,2),
  estimated_hours NUMERIC(4,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TRIPS
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id) ON DELETE RESTRICT,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE RESTRICT,
  terminal_id UUID REFERENCES terminals(id) ON DELETE RESTRICT,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  departure_at TIMESTAMPTZ NOT NULL,
  arrival_at TIMESTAMPTZ NOT NULL,
  base_price NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status trip_status NOT NULL DEFAULT 'SCHEDULED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SEATS
CREATE TABLE seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  seat_row INT,
  seat_column INT,
  comfort_class TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. BOOKINGS
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status seat_status NOT NULL DEFAULT 'AVAILABLE',
  total_amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  commission_amount NUMERIC(12,2) NOT NULL,
  qr_code_hash TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. BOOKING PASSENGERS
CREATE TABLE booking_passengers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  seat_id UUID REFERENCES seats(id) ON DELETE RESTRICT,
  passenger_name TEXT NOT NULL,
  passenger_phone TEXT NOT NULL,
  ticket_status seat_status NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. PAYMENTS (ESCROW ENGINE)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'Paystack' or 'Flutterwave'
  provider_ref TEXT NOT NULL UNIQUE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status payment_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. WALLETS (ESCROW HOLD & COMPANY BALANCES)
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL, -- Can point to either a Company ID or User ID (for platform)
  owner_type TEXT NOT NULL, -- 'company' or 'platform'
  available_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  pending_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'NGN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_owner_type CHECK (owner_type IN ('company', 'platform'))
);

-- 15. PAYOUTS
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  status payout_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. REFUNDS
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  amount NUMERIC(12,2) NOT NULL,
  percent NUMERIC(5,2) NOT NULL,
  status refund_status NOT NULL DEFAULT 'REQUESTED',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. REVIEWS
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  comfort INT NOT NULL CHECK (comfort BETWEEN 1 AND 5),
  timeliness INT NOT NULL CHECK (timeliness BETWEEN 1 AND 5),
  driver_conduct INT NOT NULL CHECK (driver_conduct BETWEEN 1 AND 5),
  cleanliness INT NOT NULL CHECK (cleanliness BETWEEN 1 AND 5),
  overall INT NOT NULL CHECK (overall BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. DISPUTES
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  raised_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- e.g., 'NO_SHOW', 'WRONG_SEAT', 'MISCONDUCT'
  description TEXT NOT NULL,
  status dispute_status NOT NULL DEFAULT 'OPEN',
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- e.g., 'BOOKING', 'PAYOUT', 'REFUND'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  channel TEXT NOT NULL, -- 'email', 'sms', 'in-app'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. PLATFORM SETTINGS
CREATE TABLE platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEED DATA FOR CONFIGURABLE SETTINGS
INSERT INTO platform_settings (key, value, description) VALUES
  ('commission_rate', '10'::jsonb, 'Platform commission percentage (%) seeded at 10%'),
  ('refund_policy', '[
    {"hours_before": 48, "refund_percent": 100},
    {"hours_before": 24, "refund_percent": 70},
    {"hours_before": 12, "refund_percent": 50},
    {"hours_before": 0,  "refund_percent": 0}
  ]'::jsonb, 'Refund policy tiers dynamic setup'),
  ('supported_currencies', '["NGN", "USD"]'::jsonb, 'Supported transactional currencies'),
  ('default_currency', '"NGN"'::jsonb, 'Default platform currency');

-- Enable RLS for Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Dynamic Policies for RLS
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profiles" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Companies viewable by everyone if approved" ON companies FOR SELECT USING (status = 'APPROVED' OR auth.uid() = owner_id);
CREATE POLICY "Owners can update their company" ON companies FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Trips viewable by everyone" ON trips FOR SELECT USING (true);
CREATE POLICY "Bookings viewable by the user who booked" ON bookings FOR SELECT USING (auth.uid() = user_id);
