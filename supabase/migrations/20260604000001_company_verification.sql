-- Enhanced Company Verification Schema
ALTER TABLE public.companies 
ADD COLUMN registration_cert_url TEXT,
ADD COLUMN tax_clearance_url TEXT,
ADD COLUMN gov_id_url TEXT,
ADD COLUMN selfie_verification_url TEXT,
ADD COLUMN bank_name TEXT,
ADD COLUMN account_number TEXT,
ADD COLUMN account_name TEXT,
ADD COLUMN verification_fee_paid BOOLEAN DEFAULT false,
ADD COLUMN verification_fee_amount DECIMAL(10,2) DEFAULT 50000.00, -- 50,000 NGN standard verification fee
ADD COLUMN vehicle_docs_url TEXT;

-- Update status constraint or enum if it exists to include new steps
-- For now, relying on 'pending', 'documents_submitted', 'fee_paid', 'verified', 'rejected'
