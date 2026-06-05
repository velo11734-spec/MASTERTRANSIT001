-- 004_company_verification.sql
-- Add columns for identity verification documents

ALTER TABLE companies
  ADD COLUMN id_document_url TEXT,
  ADD COLUMN selfie_url TEXT;
