-- 003_company_details.sql
-- Add address and contact fields to companies table

ALTER TABLE companies
  ADD COLUMN address TEXT,
  ADD COLUMN city TEXT,
  ADD COLUMN state TEXT,
  ADD COLUMN phone TEXT;
