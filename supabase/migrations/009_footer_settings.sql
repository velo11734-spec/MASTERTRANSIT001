-- 009_footer_settings.sql
-- Add default footer credit setting for website credits

-- Insert default credit if not exists
INSERT INTO platform_settings (id, key, value, label, description, category)
SELECT uuid_generate_v4(), 'footer_credit', '© {year} Lonewolfdevteam & Mighty Seeds Investment Ltd', 'Footer Credit', 'HTML/text displayed in website footer for credit', 'branding'
WHERE NOT EXISTS (SELECT 1 FROM platform_settings WHERE key = 'footer_credit');
