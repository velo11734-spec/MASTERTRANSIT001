-- 014_extended_footer_settings.sql
-- Fix schema for platform_settings to match admin requirements and add footer branding settings

-- First, ensure the platform_settings table has the correct columns.
-- Earlier migrations used 'IF NOT EXISTS' which failed to update the schema if it already existed.
DO $$
BEGIN
    -- Add id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_settings' AND column_name = 'id') THEN
        -- We must drop the old primary key constraint first (which was 'key')
        ALTER TABLE platform_settings DROP CONSTRAINT IF EXISTS platform_settings_pkey CASCADE;
        ALTER TABLE platform_settings ADD COLUMN id uuid DEFAULT uuid_generate_v4();
        ALTER TABLE platform_settings ADD PRIMARY KEY (id);
        ALTER TABLE platform_settings ADD CONSTRAINT platform_settings_key_key UNIQUE (key);
    END IF;

    -- Add label column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_settings' AND column_name = 'label') THEN
        ALTER TABLE platform_settings ADD COLUMN label text;
    END IF;

    -- Add category column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_settings' AND column_name = 'category') THEN
        ALTER TABLE platform_settings ADD COLUMN category text;
    END IF;

    -- Convert value from JSONB to TEXT if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'platform_settings' AND column_name = 'value' AND data_type = 'jsonb') THEN
        ALTER TABLE platform_settings ALTER COLUMN value TYPE text USING value::text;
    END IF;
END $$;


-- Insert default credits if they do not exist
INSERT INTO platform_settings (id, key, value, label, description, category)
SELECT uuid_generate_v4(), 'company_attribution_name', 'RoutePro Mobility Technologies', 'Company Attribution', 'The company name displayed in the footer', 'branding'
WHERE NOT EXISTS (SELECT 1 FROM platform_settings WHERE key = 'company_attribution_name');

INSERT INTO platform_settings (id, key, value, label, description, category)
SELECT uuid_generate_v4(), 'dev_team_name', 'LoneWolf Development Team', 'Development Team Name', 'The name of the development team/agency', 'branding'
WHERE NOT EXISTS (SELECT 1 FROM platform_settings WHERE key = 'dev_team_name');

INSERT INTO platform_settings (id, key, value, label, description, category)
SELECT uuid_generate_v4(), 'dev_team_url', 'https://future-development-website.com', 'Development Team URL', 'The link to the development team website', 'branding'
WHERE NOT EXISTS (SELECT 1 FROM platform_settings WHERE key = 'dev_team_url');

INSERT INTO platform_settings (id, key, value, label, description, category)
SELECT uuid_generate_v4(), 'partner_name', 'Mighty Seed Investment Ltd', 'Partner / Investor Name', 'The name of the main investment or supporting partner', 'branding'
WHERE NOT EXISTS (SELECT 1 FROM platform_settings WHERE key = 'partner_name');

INSERT INTO platform_settings (id, key, value, label, description, category)
SELECT uuid_generate_v4(), 'partner_url', 'https://future-investment-website.com', 'Partner / Investor URL', 'The link to the partner or investor website', 'branding'
WHERE NOT EXISTS (SELECT 1 FROM platform_settings WHERE key = 'partner_url');

INSERT INTO platform_settings (id, key, value, label, description, category)
SELECT uuid_generate_v4(), 'footer_copyright_year', '2026', 'Footer Copyright Year', 'The year displayed next to the copyright symbol', 'branding'
WHERE NOT EXISTS (SELECT 1 FROM platform_settings WHERE key = 'footer_copyright_year');

INSERT INTO platform_settings (id, key, value, label, description, category)
SELECT uuid_generate_v4(), 'enable_partner_attribution', 'true', 'Enable Partner Attribution', 'Display the partner/investor attribution in the footer (true/false)', 'branding'
WHERE NOT EXISTS (SELECT 1 FROM platform_settings WHERE key = 'enable_partner_attribution');

INSERT INTO platform_settings (id, key, value, label, description, category)
SELECT uuid_generate_v4(), 'enable_dev_attribution', 'true', 'Enable Developer Attribution', 'Display the development team attribution in the footer (true/false)', 'branding'
WHERE NOT EXISTS (SELECT 1 FROM platform_settings WHERE key = 'enable_dev_attribution');
