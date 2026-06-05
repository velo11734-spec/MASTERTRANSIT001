-- 006_company_bank_details.sql
-- Add bank details to companies for onboarding and automatic payouts

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
