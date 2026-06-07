-- 010_company_roles.sql
-- Adds business_roles array, dashboard_enabled flag, and company_team_members table

create extension if not exists "uuid-ossp";

-- 1. Add business_roles and dashboard_enabled to companies
alter table companies add column if not exists business_roles text[] default '{}';
alter table companies add column if not exists dashboard_enabled boolean default false;

-- 2. Company Team Members
create table if not exists company_team_members (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in (
    'owner','manager','operations','fleet_manager',
    'booking_officer','sales_officer','rental_officer','accountant'
  )) default 'manager',
  permissions jsonb default '{}',
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  status text default 'invited' check (status in ('invited','active','suspended','removed')),
  created_at timestamptz default now()
);

-- 3. Enable RLS on new table
alter table company_team_members enable row level security;

-- Admin full access
create policy admin_team_members_all on company_team_members
  using (
    exists(select 1 from profiles where id = auth.uid() and role in ('super_admin','admin'))
    or auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
  );

-- Company owner can manage their own team
create policy company_owner_team_members on company_team_members
  using (company_id in (select id from companies where owner_id = auth.uid()));

-- Team member can see their own membership
create policy team_member_self on company_team_members
  using (user_id = auth.uid());

-- 4. Vehicle Leads table (for vehicle dealer role)
create table if not exists vehicle_leads (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  vehicle_id text,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  interest_type text check (interest_type in ('purchase','inspection','quote','test_drive')),
  stage text default 'new' check (stage in ('new','contacted','negotiating','sold','closed','lost')),
  notes text,
  assigned_to uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table vehicle_leads enable row level security;
create policy company_owner_leads on vehicle_leads
  using (company_id in (select id from companies where owner_id = auth.uid()));

-- 5. Fleet vehicles table (for transport operator fleet management)
create table if not exists fleet_vehicles (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  registration_number text unique,
  make text,
  model text,
  year int,
  capacity int,
  vehicle_type text check (vehicle_type in ('bus','minibus','taxi','van','truck','boat','train','other')),
  status text default 'available' check (status in ('available','scheduled','in_transit','maintenance','inactive')),
  driver_id uuid references auth.users(id),
  last_maintenance_at timestamptz,
  next_maintenance_at timestamptz,
  documents jsonb default '{}',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table fleet_vehicles enable row level security;
create policy company_owner_fleet on fleet_vehicles
  using (company_id in (select id from companies where owner_id = auth.uid()));

-- 6. Drivers table
create table if not exists company_drivers (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references auth.users(id),
  full_name text not null,
  phone text,
  license_number text,
  license_expiry date,
  status text default 'active' check (status in ('active','inactive','suspended')),
  assigned_vehicle_id uuid references fleet_vehicles(id),
  created_at timestamptz default now()
);

alter table company_drivers enable row level security;
create policy company_owner_drivers on company_drivers
  using (company_id in (select id from companies where owner_id = auth.uid()));

-- Admin access to all new tables
create policy admin_fleet on fleet_vehicles
  using (exists(select 1 from profiles where id = auth.uid() and role in ('super_admin','admin')));
create policy admin_leads on vehicle_leads
  using (exists(select 1 from profiles where id = auth.uid() and role in ('super_admin','admin')));
create policy admin_drivers on company_drivers
  using (exists(select 1 from profiles where id = auth.uid() and role in ('super_admin','admin')));
