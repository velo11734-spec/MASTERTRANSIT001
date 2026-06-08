-- ============================================================
-- 017_schema_gap_fix.sql
-- RoutePro — Complete Schema Gap Remediation
-- Run AFTER: 015_wallet_system.sql + 016_fix_profile_trigger.sql
-- ============================================================

-- 1. ENABLE pg_trgm for full-text / trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── 2. PROFILES — add bank account + missing index columns ──────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_name            TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_account_number  TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_account_name    TEXT;

-- email lives in auth.users — expose it as a view
CREATE OR REPLACE VIEW profiles_with_email AS
  SELECT p.*, u.email
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id;

-- ─── 3. PAYMENTS — add reference + user_id ───────────────────────────────────
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_id   UUID REFERENCES auth.users(id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_reference
  ON payments(reference) WHERE reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_user_id  ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status   ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);

-- ─── 4. COMPANIES — add rating column ────────────────────────────────────────
ALTER TABLE companies ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_companies_rating   ON companies(rating DESC);
CREATE INDEX IF NOT EXISTS idx_companies_status   ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);

-- ─── 5. DISPUTES — enhance from basic (001) to full admin schema ──────────────
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS reference             TEXT;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS complainant_id        UUID REFERENCES auth.users(id);
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS respondent_company_id UUID;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS subject               TEXT;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS priority              TEXT NOT NULL DEFAULT 'medium'
  CHECK (priority IN ('low','medium','high','critical'));
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS assigned_to           UUID REFERENCES auth.users(id);
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS evidence              JSONB NOT NULL DEFAULT '[]';
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS refund_amount         NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolved_at           TIMESTAMPTZ;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_disputes_priority ON disputes(priority);
CREATE INDEX IF NOT EXISTS idx_disputes_status   ON disputes(status);

-- ─── 6. ROUTES — enhance from basic (001) to full admin/search schema ─────────
ALTER TABLE routes ADD COLUMN IF NOT EXISTS name            TEXT;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS status          TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active','inactive','pending'));
ALTER TABLE routes ADD COLUMN IF NOT EXISTS duration_minutes   INT;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS price_range_min    NUMERIC;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS price_range_max    NUMERIC;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS is_popular         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS created_by         UUID REFERENCES auth.users(id);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_routes_status        ON routes(status);
CREATE INDEX IF NOT EXISTS idx_routes_is_popular    ON routes(is_popular) WHERE is_popular = true;
CREATE INDEX IF NOT EXISTS idx_routes_origin        ON routes(origin);
CREATE INDEX IF NOT EXISTS idx_routes_destination   ON routes(destination);
CREATE INDEX IF NOT EXISTS idx_routes_origin_dest   ON routes(origin, destination) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_routes_origin_trgm   ON routes USING gin(origin gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_routes_dest_trgm     ON routes USING gin(destination gin_trgm_ops);

-- ─── 7. TERMINALS — enhance from basic (001) to full admin schema ─────────────
ALTER TABLE terminals ADD COLUMN IF NOT EXISTS status          TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active','inactive','maintenance'));
ALTER TABLE terminals ADD COLUMN IF NOT EXISTS manager_id      UUID REFERENCES auth.users(id);
ALTER TABLE terminals ADD COLUMN IF NOT EXISTS operating_hours JSONB;
ALTER TABLE terminals ADD COLUMN IF NOT EXISTS created_by      UUID REFERENCES auth.users(id);
ALTER TABLE terminals ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ NOT NULL DEFAULT now();

-- ─── 8. AUDIT LOGS — enhance from basic (001) to full admin schema ────────────
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_email TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS old_value   JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_value   JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address  TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent  TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id   ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity     ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ─── 9. MISSING ADMIN TABLES (from 008) ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS partner_applications (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_name             TEXT NOT NULL,
  org_type             TEXT NOT NULL,
  contact_person       TEXT NOT NULL,
  email                TEXT NOT NULL,
  phone                TEXT,
  country              TEXT,
  partnership_category TEXT NOT NULL,
  description          TEXT,
  status               TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','reviewing','approved','rejected')),
  admin_notes          TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_partner_applications" ON partner_applications;
CREATE POLICY "admin_all_partner_applications" ON partner_applications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin')));
DROP POLICY IF EXISTS "public_insert_partner_applications" ON partner_applications;
CREATE POLICY "public_insert_partner_applications" ON partner_applications
  FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS notifications_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  channel         TEXT CHECK (channel IN ('push','email','sms','in_app')),
  target_type     TEXT CHECK (target_type IN ('all','role','specific')),
  target_role     TEXT,
  target_user_ids UUID[],
  scheduled_at    TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','failed')),
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_notifications_log" ON notifications_log;
CREATE POLICY "admin_all_notifications_log" ON notifications_log FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin')));

CREATE TABLE IF NOT EXISTS fraud_flags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT CHECK (entity_type IN ('user','company','payment','review','booking')),
  entity_id   TEXT NOT NULL,
  reason      TEXT NOT NULL,
  severity    TEXT NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low','medium','high','critical')),
  status      TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','investigating','resolved','dismissed')),
  flagged_by  UUID REFERENCES auth.users(id),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE fraud_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_fraud_flags" ON fraud_flags;
CREATE POLICY "admin_all_fraud_flags" ON fraud_flags FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin')));

CREATE TABLE IF NOT EXISTS help_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  icon        TEXT,
  sort_order  INT  NOT NULL DEFAULT 0,
  is_active   BOOL NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE help_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_help_categories" ON help_categories;
CREATE POLICY "public_read_help_categories" ON help_categories
  FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "admin_all_help_categories" ON help_categories;
CREATE POLICY "admin_all_help_categories" ON help_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin')));

CREATE TABLE IF NOT EXISTS help_articles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id  UUID REFERENCES help_categories(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,
  content      TEXT NOT NULL,
  excerpt      TEXT,
  is_published BOOL NOT NULL DEFAULT false,
  sort_order   INT  NOT NULL DEFAULT 0,
  views        INT  NOT NULL DEFAULT 0,
  helpful_yes  INT  NOT NULL DEFAULT 0,
  helpful_no   INT  NOT NULL DEFAULT 0,
  tags         TEXT[],
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_published_help_articles" ON help_articles;
CREATE POLICY "public_read_published_help_articles" ON help_articles
  FOR SELECT USING (is_published = true);
DROP POLICY IF EXISTS "admin_all_help_articles" ON help_articles;
CREATE POLICY "admin_all_help_articles" ON help_articles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin')));

-- ─── 10. MISSING FINANCIAL TABLES (from 009) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id    UUID REFERENCES company_wallets(id) ON DELETE CASCADE,
  type         TEXT CHECK (type IN ('credit','debit','hold','release')),
  amount       NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  description  TEXT,
  reference    TEXT UNIQUE,
  booking_id   UUID REFERENCES bookings(id),
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "company_wallet_tx_read" ON wallet_transactions;
CREATE POLICY "company_wallet_tx_read" ON wallet_transactions FOR SELECT
  USING (
    wallet_id IN (
      SELECT id FROM company_wallets
      WHERE company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin'))
  );

CREATE TABLE IF NOT EXISTS platform_treasury (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_type TEXT CHECK (transaction_type IN ('commission','listing_fee','featured_fee','rental_commission','ad_slot','subscription')),
  amount           NUMERIC NOT NULL,
  source_id        TEXT,
  source_type      TEXT,
  description      TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE platform_treasury ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_read_treasury" ON platform_treasury;
CREATE POLICY "admin_read_treasury" ON platform_treasury FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin')));

CREATE TABLE IF NOT EXISTS payout_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
  amount       NUMERIC NOT NULL,
  bank_account JSONB,
  status       TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','approved','processing','completed','rejected')),
  admin_note   TEXT,
  processed_at TIMESTAMPTZ,
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "company_payout_request_read" ON payout_requests;
CREATE POLICY "company_payout_request_read" ON payout_requests FOR SELECT
  USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin'))
  );
DROP POLICY IF EXISTS "company_payout_request_insert" ON payout_requests;
CREATE POLICY "company_payout_request_insert" ON payout_requests FOR INSERT
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS refund_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id   UUID REFERENCES bookings(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount       NUMERIC NOT NULL,
  reason       TEXT,
  status       TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','approved','processing','completed','rejected')),
  admin_note   TEXT,
  processed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_refund_request_read" ON refund_requests;
CREATE POLICY "user_refund_request_read" ON refund_requests FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin'))
  );
DROP POLICY IF EXISTS "user_refund_request_insert" ON refund_requests;
CREATE POLICY "user_refund_request_insert" ON refund_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS subscription_plans (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL UNIQUE,
  price_monthly  NUMERIC NOT NULL,
  price_annual   NUMERIC NOT NULL,
  features       JSONB,
  max_routes     INT,
  max_fleet      INT,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_subscription_plans" ON subscription_plans;
CREATE POLICY "public_read_subscription_plans" ON subscription_plans
  FOR SELECT USING (is_active = true);
INSERT INTO subscription_plans (name, price_monthly, price_annual, max_routes, max_fleet)
VALUES
  ('Basic',        15000,  150000,  10,  20),
  ('Professional', 45000,  450000,  50,  100),
  ('Enterprise',   120000, 1200000, 200, 500)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS company_subscriptions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID REFERENCES companies(id) ON DELETE CASCADE,
  plan_id        UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  billing_cycle  TEXT CHECK (billing_cycle IN ('monthly','annual')),
  status         TEXT DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  started_at     TIMESTAMPTZ DEFAULT now(),
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE company_subscriptions ENABLE ROW LEVEL SECURITY;

-- ─── 11. FIX BROKEN RLS POLICIES (auth.role() is always null — fix to profile check) ──

-- company_wallets
ALTER TABLE company_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_full_access ON company_wallets;
DROP POLICY IF EXISTS company_wallet_read ON company_wallets;
CREATE POLICY "company_wallet_owner_read" ON company_wallets FOR SELECT
  USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin'))
  );

-- Fix passenger_wallets admin policy
DROP POLICY IF EXISTS admin_full_access ON passenger_wallets;
CREATE POLICY "admin_read_passenger_wallets" ON passenger_wallets FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin'))
  );

-- Fix passenger_withdrawal_requests admin management
CREATE POLICY "admin_manage_withdrawals" ON passenger_withdrawal_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin')));

-- profiles — allow OAuth users to self-insert (backup to trigger)
DROP POLICY IF EXISTS "profiles_self_insert" ON profiles;
CREATE POLICY "profiles_self_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- bookings — users can create
DROP POLICY IF EXISTS "bookings_user_insert" ON bookings;
CREATE POLICY "bookings_user_insert" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "bookings_user_update" ON bookings;
CREATE POLICY "bookings_user_update" ON bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- ─── 12. SEED Help Center categories ─────────────────────────────────────────
INSERT INTO help_categories (name, slug, sort_order) VALUES
  ('Accounts & Registration', 'accounts',  1),
  ('Booking & Tickets',       'booking',   2),
  ('Payments & Refunds',      'payments',  3),
  ('Trips & Routes',          'trips',     4),
  ('Companies',               'companies', 5),
  ('Safety & Security',       'safety',    6),
  ('Technical Support',       'technical', 7),
  ('Transport Partners',      'partners',  8),
  ('Wallet',                  'wallet',    9)
ON CONFLICT (slug) DO NOTHING;

-- ─── Done ─────────────────────────────────────────────────────────────────────
-- Tables created: partner_applications, notifications_log, fraud_flags,
--   help_categories, help_articles, wallet_transactions, platform_treasury,
--   payout_requests, refund_requests, subscription_plans, company_subscriptions
-- Columns added: profiles.bank_*, payments.reference, payments.user_id,
--   companies.rating, disputes.*, routes.*, terminals.*, audit_logs.*
-- Indexes fixed: 9 broken indexes from migration 013 now work
-- RLS fixed: auth.role() → profile role check pattern across all affected tables
-- ─────────────────────────────────────────────────────────────────────────────
