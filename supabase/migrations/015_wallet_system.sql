-- ============================================================
-- Migration 015: RoutePro Wallet System
-- ============================================================
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── 1. Passenger Wallets ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS passenger_wallets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spendable_balance     NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (spendable_balance >= 0),
  refund_balance        NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (refund_balance >= 0),
  total_funded          NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_spent           NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_withdrawn       NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  is_frozen             BOOLEAN NOT NULL DEFAULT FALSE,
  frozen_reason         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT passenger_wallets_user_id_key UNIQUE (user_id)
);

-- ─── 2. Passenger Wallet Transactions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS passenger_wallet_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id             UUID NOT NULL REFERENCES passenger_wallets(id) ON DELETE CASCADE,
  transaction_intent    TEXT NOT NULL,          -- WALLET_TOP_UP | WALLET_DEBIT | REFUND_CREDIT | TRIP_PAYMENT | ...
  payment_method        TEXT NOT NULL,          -- paystack | wallet | bank_transfer
  status                TEXT NOT NULL DEFAULT 'pending', -- pending | completed | failed
  amount                NUMERIC(15, 2) NOT NULL,
  balance_after         NUMERIC(15, 2),
  balance_type          TEXT DEFAULT 'spendable', -- spendable | refund
  description           TEXT,
  paystack_reference    TEXT,
  linked_entity_id      UUID,
  linked_entity_type    TEXT,                   -- booking | rental | withdrawal_request | ...
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 3. Passenger Withdrawal Requests ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS passenger_withdrawal_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id             UUID NOT NULL REFERENCES passenger_wallets(id) ON DELETE CASCADE,
  amount                NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  tier                  TEXT NOT NULL,          -- tier_1 | tier_2 | tier_3
  bank_account          JSONB NOT NULL,         -- { bankName, accountName, accountNumber }
  status                TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  notes                 TEXT,
  processed_at          TIMESTAMPTZ,
  processed_by          UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 4. Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pw_user_id         ON passenger_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_pwt_wallet_id      ON passenger_wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_pwt_intent         ON passenger_wallet_transactions(transaction_intent);
CREATE INDEX IF NOT EXISTS idx_pwt_status         ON passenger_wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pwr_user_id        ON passenger_withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_pwr_status         ON passenger_withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_pwr_wallet_id      ON passenger_withdrawal_requests(wallet_id);

-- ─── 5. Platform Settings (wallet category) ──────────────────────────────────
-- Ensure platform_settings table exists (non-destructive)
CREATE TABLE IF NOT EXISTS platform_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  label       TEXT,
  description TEXT,
  category    TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Insert wallet-related settings (skip if already present)
INSERT INTO platform_settings (key, value, label, description, category)
VALUES
  ('min_wallet_funding',          '500',    'Minimum Wallet Funding',      'Minimum amount (₦) a user can add to their wallet',                        'wallet'),
  ('wallet_withdrawal_tier1_max', '50000',  'Tier 1 Withdrawal Max (₦)',   'Balances below this cannot be withdrawn to a bank account',                 'wallet'),
  ('wallet_withdrawal_tier2_max', '250000', 'Tier 2 Withdrawal Max (₦)',   'Balances from Tier 1 max up to this amount process automatically',          'wallet'),
  ('wallet_withdrawal_fee_pct',   '1.5',    'Tier 2 Withdrawal Fee (%)',   'Percentage fee charged on Tier 2 (automatic) withdrawals',                  'wallet'),
  ('wallet_refund_withdrawable',  'false',  'Refund Balance Withdrawable', 'Whether refund credits can be withdrawn to bank (always false by design)',   'wallet')
ON CONFLICT (key) DO NOTHING;

-- ─── 6. Row Level Security ───────────────────────────────────────────────────
ALTER TABLE passenger_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE passenger_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE passenger_withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Wallets: users see only their own wallet
DROP POLICY IF EXISTS "wallet_owner_select" ON passenger_wallets;
CREATE POLICY "wallet_owner_select"
  ON passenger_wallets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wallet_owner_update" ON passenger_wallets;
CREATE POLICY "wallet_owner_update"
  ON passenger_wallets FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wallet_owner_insert" ON passenger_wallets;
CREATE POLICY "wallet_owner_insert"
  ON passenger_wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Transactions: users see only their own
DROP POLICY IF EXISTS "pwt_owner_select" ON passenger_wallet_transactions;
CREATE POLICY "pwt_owner_select"
  ON passenger_wallet_transactions FOR SELECT
  USING (
    wallet_id IN (
      SELECT id FROM passenger_wallets WHERE user_id = auth.uid()
    )
  );

-- Withdrawal requests: users see only their own
DROP POLICY IF EXISTS "pwr_owner_select" ON passenger_withdrawal_requests;
CREATE POLICY "pwr_owner_select"
  ON passenger_withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "pwr_owner_insert" ON passenger_withdrawal_requests;
CREATE POLICY "pwr_owner_insert"
  ON passenger_withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── 7. Updated_at triggers ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pw_updated_at  ON passenger_wallets;
CREATE TRIGGER trg_pw_updated_at
  BEFORE UPDATE ON passenger_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_pwt_updated_at ON passenger_wallet_transactions;
CREATE TRIGGER trg_pwt_updated_at
  BEFORE UPDATE ON passenger_wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_pwr_updated_at ON passenger_withdrawal_requests;
CREATE TRIGGER trg_pwr_updated_at
  BEFORE UPDATE ON passenger_withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Done ─────────────────────────────────────────────────────────────────────
-- Tables created:
--   passenger_wallets
--   passenger_wallet_transactions
--   passenger_withdrawal_requests
-- Settings seeded in platform_settings (category = 'wallet')
-- ─────────────────────────────────────────────────────────────────────────────
