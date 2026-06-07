-- 009_financial_architecture.sql
-- Supabase PostgreSQL migration to add financial architecture tables and settings
-- Use create table if not exists and alter table if not exists for idempotent migrations

-- Enable UUID generation extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Company Wallets
create table if not exists company_wallets (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  balance numeric default 0,
  pending_balance numeric default 0,
  total_earned numeric default 0,
  total_withdrawn numeric default 0,
  currency text default 'NGN',
  is_frozen boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Wallet Transactions (company ledger)
create table if not exists wallet_transactions (
  id uuid primary key default uuid_generate_v4(),
  wallet_id uuid references company_wallets(id) on delete cascade,
  type text check (type in ('credit','debit','hold','release')),
  amount numeric not null,
  balance_after numeric not null,
  description text,
  reference text unique,
  booking_id uuid references bookings(id),
  payout_id uuid references payouts(id),
  created_at timestamptz default now()
);

-- 3. Passenger Wallets
create table if not exists passenger_wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  balance numeric default 0,
  total_funded numeric default 0,
  total_spent numeric default 0,
  currency text default 'NGN',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Passenger Wallet Transactions
create table if not exists passenger_wallet_transactions (
  id uuid primary key default uuid_generate_v4(),
  wallet_id uuid references passenger_wallets(id) on delete cascade,
  type text check (type in ('credit','debit','refund','topup')),
  amount numeric not null,
  balance_after numeric not null,
  description text,
  reference text unique,
  booking_id uuid references bookings(id),
  created_at timestamptz default now()
);

-- 5. Platform Treasury (RoutePro earnings)
create table if not exists platform_treasury (
  id uuid primary key default uuid_generate_v4(),
  transaction_type text check (transaction_type in ('commission','listing_fee','featured_fee','rental_commission','ad_slot','subscription')),
  amount numeric not null,
  source_id text,
  source_type text,
  description text,
  created_at timestamptz default now()
);

-- 6. Payout Requests
create table if not exists payout_requests (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  amount numeric not null,
  bank_account jsonb,
  status text default 'pending' check (status in ('pending','approved','processing','completed','rejected')),
  admin_note text,
  processed_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. Payouts (completed)
create table if not exists payouts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  amount numeric not null,
  net_amount numeric not null,
  payout_request_id uuid references payout_requests(id),
  reference text unique,
  bank_account jsonb,
  status text default 'pending' check (status in ('pending','completed','failed')),
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- 8. Refund Requests
create table if not exists refund_requests (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  amount numeric not null,
  reason text,
  status text default 'pending' check (status in ('pending','approved','processing','completed','rejected')),
  admin_note text,
  processed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 9. Rental Deposits
create table if not exists rental_deposits (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  amount numeric not null,
  status text default 'held' check (status in ('held','released','forfeited','partially_refunded')),
  held_at timestamptz default now(),
  released_at timestamptz,
  release_note text,
  created_at timestamptz default now()
);

-- 10. Vehicle Listing Payments
create table if not exists vehicle_listing_payments (
  id uuid primary key default uuid_generate_v4(),
  vehicle_id text,
  dealer_id uuid references auth.users(id) on delete cascade,
  payment_type text check (payment_type in ('listing','featured')),
  amount numeric not null,
  status text default 'paid' check (status in ('paid','refunded')),
  valid_until timestamptz,
  created_at timestamptz default now()
);

-- 11. Subscription Plans
create table if not exists subscription_plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price_monthly numeric not null,
  price_annual numeric not null,
  features jsonb,
  max_routes int,
  max_fleet int,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 12. Company Subscriptions
create table if not exists company_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  plan_id uuid references subscription_plans(id) on delete cascade,
  billing_cycle text check (billing_cycle in ('monthly','annual')),
  status text default 'active' check (status in ('active','expired','cancelled')),
  started_at timestamptz default now(),
  expires_at timestamptz,
  last_billed_at timestamptz,
  next_billing_at timestamptz,
  created_at timestamptz default now()
);

-- 13. Advertising Slots
create table if not exists ad_slots (
  id uuid primary key default uuid_generate_v4(),
  slot_type text check (slot_type in ('homepage_banner','search_top','featured_route','sidebar')),
  title text,
  company_id uuid references companies(id) on delete cascade,
  start_date timestamptz,
  end_date timestamptz,
  amount_paid numeric not null,
  status text default 'active' check (status in ('active','expired','scheduled')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 14. Insert default platform settings (only if not exists)
insert into platform_settings (id, key, value, label, category) values
  (uuid_generate_v4(), 'vehicle_listing_fee', '5000', 'Vehicle Listing Fee (NGN)', 'marketplace'),
  (uuid_generate_v4(), 'vehicle_featured_fee', '20000', 'Vehicle Featured Listing Fee (NGN)', 'marketplace'),
  (uuid_generate_v4(), 'rental_deposit_pct', '30', 'Rental Deposit Percentage', 'rental'),
  (uuid_generate_v4(), 'rental_commission_rate', '8', 'Rental Commission Rate (%)', 'rental'),
  (uuid_generate_v4(), 'payout_window_days', '7', 'Payout Window (days)', 'finance'),
  (uuid_generate_v4(), 'min_payout_amount', '10000', 'Minimum Payout Amount (NGN)', 'finance'),
  (uuid_generate_v4(), 'subscription_basic_price', '15000', 'Subscription Basic Price (NGN/month)', 'subscription'),
  (uuid_generate_v4(), 'subscription_pro_price', '45000', 'Subscription Pro Price (NGN/month)', 'subscription'),
  (uuid_generate_v4(), 'subscription_enterprise_price', '120000', 'Subscription Enterprise Price (NGN/month)', 'subscription'),
  (uuid_generate_v4(), 'ad_slot_banner_price', '50000', 'Ad Slot Banner Price (NGN)', 'advertising'),
  (uuid_generate_v4(), 'ad_slot_featured_route_price', '25000', 'Ad Slot Featured Route Price (NGN)', 'advertising')
on conflict (key) do nothing;

-- 15. RLS Policies (example for admin full access)
-- Adjust according to your auth policy; placeholder for admin role
create policy admin_full_access on company_wallets using (auth.role() = 'super_admin');
create policy admin_full_access on wallet_transactions using (auth.role() = 'super_admin');
create policy admin_full_access on passenger_wallets using (auth.role() = 'super_admin');
create policy admin_full_access on passenger_wallet_transactions using (auth.role() = 'super_admin');
create policy admin_full_access on platform_treasury using (auth.role() = 'super_admin');
create policy admin_full_access on payout_requests using (auth.role() = 'super_admin');
create policy admin_full_access on payouts using (auth.role() = 'super_admin');
create policy admin_full_access on refund_requests using (auth.role() = 'super_admin');
create policy admin_full_access on rental_deposits using (auth.role() = 'super_admin');
create policy admin_full_access on vehicle_listing_payments using (auth.role() = 'super_admin');
create policy admin_full_access on subscription_plans using (auth.role() = 'super_admin');
create policy admin_full_access on company_subscriptions using (auth.role() = 'super_admin');
create policy admin_full_access on ad_slots using (auth.role() = 'super_admin');

-- Company owners can read their own wallets and transactions
create policy company_wallet_read on company_wallets using (company_id = auth.uid());
create policy company_wallet_tx_read on wallet_transactions using (wallet_id in (select id from company_wallets where company_id = auth.uid()));

-- Passengers can read their own wallets and transactions
create policy passenger_wallet_read on passenger_wallets using (user_id = auth.uid());
create policy passenger_wallet_tx_read on passenger_wallet_transactions using (wallet_id in (select id from passenger_wallets where user_id = auth.uid()));

-- Public read for platform_settings (already exists) – ensure it remains
-- insert example subscription plans if not exist
insert into subscription_plans (id, name, price_monthly, price_annual, features, max_routes, max_fleet, is_active) values
  (uuid_generate_v4(), 'Basic', 15000, 150000, '[]'::jsonb, 10, 20, true),
  (uuid_generate_v4(), 'Professional', 45000, 450000, '[]'::jsonb, 50, 100, true),
  (uuid_generate_v4(), 'Enterprise', 120000, 1200000, '[]'::jsonb, 200, 500, true)
on conflict (name) do nothing;

-- Trigger to create admin notification on new partner application (already defined elsewhere)
-- Ensure the trigger exists (placeholder, adjust schema name as needed)
-- CREATE TRIGGER partner_application_notify AFTER INSERT ON partner_applications FOR EACH ROW EXECUTE FUNCTION fn_notify_admin_partner_application();
