-- ============================================================
-- 008_admin_tables.sql
-- RoutePro Super Admin Backend — Full Migration
-- ============================================================

-- Enable uuid extension if not already enabled
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. TERMINALS — transport hubs / stops
-- ============================================================
create table if not exists terminals (
  id                uuid        primary key default uuid_generate_v4(),
  name              text        not null,
  city              text,
  state             text,
  country           text        not null default 'Nigeria',
  address           text,
  lat               numeric,
  lng               numeric,
  status            text        not null default 'active'
                      check (status in ('active', 'inactive', 'maintenance')),
  manager_id        uuid        references auth.users (id) on delete set null,
  operating_hours   jsonb,
  created_by        uuid        references auth.users (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table terminals enable row level security;

-- Admin full access
create policy "admin_all_terminals" on terminals
  for all
  using (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  )
  with check (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  );

-- Trigger: updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_terminals_updated_at
  before update on terminals
  for each row execute function set_updated_at();


-- ============================================================
-- 2. ROUTES — origin → destination routes
-- ============================================================
create table if not exists routes (
  id                  uuid        primary key default uuid_generate_v4(),
  name                text        not null,
  origin              text        not null,
  destination         text        not null,
  distance_km         numeric,
  duration_minutes    int,
  status              text        not null default 'active'
                        check (status in ('active', 'inactive', 'pending')),
  price_range_min     numeric,
  price_range_max     numeric,
  is_popular          bool        not null default false,
  created_by          uuid        references auth.users (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table routes enable row level security;

-- Admin full access
create policy "admin_all_routes" on routes
  for all
  using (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  )
  with check (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  );

-- Authenticated read (so passengers can view routes)
create policy "authenticated_read_routes" on routes
  for select
  using (auth.uid() is not null);

create trigger trg_routes_updated_at
  before update on routes
  for each row execute function set_updated_at();


-- ============================================================
-- 3. DISPUTES — passenger / company complaint cases
-- ============================================================
create table if not exists disputes (
  id                    uuid        primary key default uuid_generate_v4(),
  reference             text        unique not null,
  booking_id            uuid        references bookings (id) on delete set null,
  complainant_id        uuid        references auth.users (id) on delete set null,
  respondent_company_id uuid,
  subject               text        not null,
  description           text,
  status                text        not null default 'open'
                          check (status in (
                            'open', 'investigating', 'awaiting_response',
                            'resolved', 'closed', 'escalated'
                          )),
  priority              text        not null default 'medium'
                          check (priority in ('low', 'medium', 'high', 'critical')),
  assigned_to           uuid        references auth.users (id) on delete set null,
  evidence              jsonb       not null default '[]',
  resolution            text,
  refund_amount         numeric     not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  resolved_at           timestamptz
);

alter table disputes enable row level security;

-- Admin full access
create policy "admin_all_disputes" on disputes
  for all
  using (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  )
  with check (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  );

-- Authenticated users can insert their own dispute
create policy "authenticated_insert_disputes" on disputes
  for insert
  with check (auth.uid() is not null);

-- Complainant can view their own dispute
create policy "complainant_read_own_dispute" on disputes
  for select
  using (complainant_id = auth.uid());

create trigger trg_disputes_updated_at
  before update on disputes
  for each row execute function set_updated_at();


-- ============================================================
-- 4. AUDIT_LOGS — immutable record of all admin actions
-- ============================================================
create table if not exists audit_logs (
  id           uuid        primary key default uuid_generate_v4(),
  actor_id     uuid        not null references auth.users (id) on delete set null,
  actor_email  text,
  action       text        not null,
  entity_type  text,
  entity_id    text,
  old_value    jsonb,
  new_value    jsonb,
  ip_address   text,
  user_agent   text,
  created_at   timestamptz not null default now()
);

alter table audit_logs enable row level security;

-- Admin can read and insert — NO update/delete (append-only)
create policy "admin_read_audit_logs" on audit_logs
  for select
  using (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  );

create policy "admin_insert_audit_logs" on audit_logs
  for insert
  with check (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  );

-- No update policy
-- No delete policy
-- → effectively append-only


-- ============================================================
-- 5. PARTNER_APPLICATIONS — from partner page form
-- ============================================================
create table if not exists partner_applications (
  id                    uuid        primary key default uuid_generate_v4(),
  org_name              text        not null,
  org_type              text        not null,
  contact_person        text        not null,
  email                 text        not null,
  phone                 text,
  country               text,
  partnership_category  text        not null,
  description           text,
  status                text        not null default 'pending'
                          check (status in ('pending', 'reviewing', 'approved', 'rejected')),
  admin_notes           text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table partner_applications enable row level security;

-- Admin full access
create policy "admin_all_partner_applications" on partner_applications
  for all
  using (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  )
  with check (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  );

-- Public (unauthenticated) can INSERT (submit the form)
create policy "public_insert_partner_applications" on partner_applications
  for insert
  with check (true);

create trigger trg_partner_applications_updated_at
  before update on partner_applications
  for each row execute function set_updated_at();


-- ============================================================
-- 6. PLATFORM_SETTINGS — key-value store for platform config
-- ============================================================
create table if not exists platform_settings (
  id           uuid        primary key default uuid_generate_v4(),
  key          text        unique not null,
  value        text,
  label        text,
  description  text,
  category     text,
  updated_by   uuid        references auth.users (id) on delete set null,
  updated_at   timestamptz not null default now()
);

alter table platform_settings enable row level security;

-- Admin full access
create policy "admin_all_platform_settings" on platform_settings
  for all
  using (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  )
  with check (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  );

-- Public (anyone) can READ settings (so frontend can fetch config)
create policy "public_read_platform_settings" on platform_settings
  for select
  using (true);

-- Seed default settings
insert into platform_settings (id, key, value, label, category) values
  (uuid_generate_v4(), 'commission_rate',        '10',                   'Commission Rate (%)',        'finance'),
  (uuid_generate_v4(), 'refund_window_hours',    '24',                   'Refund Window (hours)',      'finance'),
  (uuid_generate_v4(), 'cancellation_fee_pct',   '5',                    'Cancellation Fee (%)',       'finance'),
  (uuid_generate_v4(), 'max_seats_per_booking',  '6',                    'Max Seats Per Booking',      'booking'),
  (uuid_generate_v4(), 'booking_advance_days',   '30',                   'Booking Advance Days',       'booking'),
  (uuid_generate_v4(), 'platform_name',          'RoutePro',             'Platform Name',              'branding'),
  (uuid_generate_v4(), 'support_email',          'support@routepro.ng',  'Support Email',              'contact'),
  (uuid_generate_v4(), 'support_phone',          '+234-800-ROUTEPRO',    'Support Phone',              'contact'),
  (uuid_generate_v4(), 'maintenance_mode',       'false',                'Maintenance Mode',           'system'),
  (uuid_generate_v4(), 'booking_freeze',         'false',                'Booking Freeze',             'emergency'),
  (uuid_generate_v4(), 'payment_freeze',         'false',                'Payment Freeze',             'emergency'),
  (uuid_generate_v4(), 'payout_freeze',          'false',                'Payout Freeze',              'emergency')
on conflict (key) do nothing;


-- ============================================================
-- 7. NOTIFICATIONS_LOG — sent notifications tracking
-- ============================================================
create table if not exists notifications_log (
  id               uuid        primary key default uuid_generate_v4(),
  title            text        not null,
  body             text        not null,
  channel          text        check (channel in ('push', 'email', 'sms', 'in_app')),
  target_type      text        check (target_type in ('all', 'role', 'specific')),
  target_role      text,
  target_user_ids  uuid[],
  scheduled_at     timestamptz,
  sent_at          timestamptz,
  status           text        not null default 'pending'
                     check (status in ('pending', 'sent', 'failed')),
  created_by       uuid        references auth.users (id) on delete set null,
  created_at       timestamptz not null default now()
);

alter table notifications_log enable row level security;

-- Admin full access
create policy "admin_all_notifications_log" on notifications_log
  for all
  using (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  )
  with check (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  );


-- ============================================================
-- 8. FRAUD_FLAGS — flagged entities
-- ============================================================
create table if not exists fraud_flags (
  id           uuid        primary key default uuid_generate_v4(),
  entity_type  text        check (entity_type in ('user', 'company', 'payment', 'review', 'booking')),
  entity_id    text        not null,
  reason       text        not null,
  severity     text        not null default 'medium'
                 check (severity in ('low', 'medium', 'high', 'critical')),
  status       text        not null default 'open'
                 check (status in ('open', 'investigating', 'resolved', 'dismissed')),
  flagged_by   uuid        references auth.users (id) on delete set null,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table fraud_flags enable row level security;

-- Admin full access
create policy "admin_all_fraud_flags" on fraud_flags
  for all
  using (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  )
  with check (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  );

create trigger trg_fraud_flags_updated_at
  before update on fraud_flags
  for each row execute function set_updated_at();


-- ============================================================
-- 9. HELP_CATEGORIES — help center categories (admin-editable)
-- ============================================================
create table if not exists help_categories (
  id           uuid        primary key default uuid_generate_v4(),
  name         text        not null,
  slug         text        unique not null,
  description  text,
  icon         text,
  sort_order   int         not null default 0,
  is_active    bool        not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table help_categories enable row level security;

-- Admin full access
create policy "admin_all_help_categories" on help_categories
  for all
  using (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  )
  with check (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  );

-- Public read (help center is publicly visible)
create policy "public_read_help_categories" on help_categories
  for select
  using (is_active = true);

create trigger trg_help_categories_updated_at
  before update on help_categories
  for each row execute function set_updated_at();

-- Seed default help categories
insert into help_categories (id, name, slug, sort_order) values
  (uuid_generate_v4(), 'Accounts & Registration', 'accounts',   1),
  (uuid_generate_v4(), 'Booking & Tickets',        'booking',    2),
  (uuid_generate_v4(), 'Payments & Refunds',       'payments',   3),
  (uuid_generate_v4(), 'Trips & Routes',           'trips',      4),
  (uuid_generate_v4(), 'Companies & Verification', 'companies',  5),
  (uuid_generate_v4(), 'Safety & Security',        'safety',     6),
  (uuid_generate_v4(), 'Technical Support',        'technical',  7),
  (uuid_generate_v4(), 'Transport Partners',       'partners',   8),
  (uuid_generate_v4(), 'Drivers & Fleet',          'drivers',    9)
on conflict (slug) do nothing;


-- ============================================================
-- 10. HELP_ARTICLES — help center articles (admin-editable)
-- ============================================================
create table if not exists help_articles (
  id            uuid        primary key default uuid_generate_v4(),
  category_id   uuid        references help_categories (id) on delete cascade,
  title         text        not null,
  slug          text        unique not null,
  content       text        not null,
  excerpt       text,
  is_published  bool        not null default false,
  sort_order    int         not null default 0,
  views         int         not null default 0,
  helpful_yes   int         not null default 0,
  helpful_no    int         not null default 0,
  tags          text[],
  created_by    uuid        references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table help_articles enable row level security;

-- Admin full access
create policy "admin_all_help_articles" on help_articles
  for all
  using (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  )
  with check (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  );

-- Public can read published articles
create policy "public_read_published_help_articles" on help_articles
  for select
  using (is_published = true);

create trigger trg_help_articles_updated_at
  before update on help_articles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------
-- Seed ~30 sample help articles
-- ---------------------------------------------------------------
do $$
declare
  cat_accounts   uuid;
  cat_booking    uuid;
  cat_payments   uuid;
  cat_trips      uuid;
  cat_companies  uuid;
  cat_safety     uuid;
  cat_technical  uuid;
  cat_partners   uuid;
  cat_drivers    uuid;
begin
  select id into cat_accounts  from help_categories where slug = 'accounts';
  select id into cat_booking   from help_categories where slug = 'booking';
  select id into cat_payments  from help_categories where slug = 'payments';
  select id into cat_trips     from help_categories where slug = 'trips';
  select id into cat_companies from help_categories where slug = 'companies';
  select id into cat_safety    from help_categories where slug = 'safety';
  select id into cat_technical from help_categories where slug = 'technical';
  select id into cat_partners  from help_categories where slug = 'partners';
  select id into cat_drivers   from help_categories where slug = 'drivers';

  insert into help_articles
    (id, category_id, title, slug, content, excerpt, is_published, sort_order)
  values

  -- ACCOUNTS & REGISTRATION (4 articles)
  (uuid_generate_v4(), cat_accounts,
   'How to Create a RoutePro Account',
   'how-to-create-routepro-account',
   'Creating a RoutePro account is quick and straightforward. Visit our website or download the mobile app, then click "Sign Up" and fill in your name, email address, and a secure password. You will receive a verification email — click the link inside to activate your account.'||chr(10)||chr(10)||
   'Once verified, you can complete your profile by adding your phone number, profile photo, and preferred payment method. A complete profile helps transport companies provide you with personalised service and also speeds up the booking process.',
   'Learn how to sign up and verify your RoutePro account in minutes.',
   true, 1),

  (uuid_generate_v4(), cat_accounts,
   'Resetting Your Password',
   'resetting-your-password',
   'If you have forgotten your password, navigate to the login page and click "Forgot Password". Enter the email address associated with your account and we will send you a password-reset link within a few minutes. Check your spam folder if the email does not appear in your inbox.'||chr(10)||chr(10)||
   'Once you click the link, you will be prompted to create a new password. For security, the link expires after 1 hour. Your new password must be at least 8 characters long and contain at least one number and one special character.',
   'Step-by-step guide to recovering access to your RoutePro account.',
   true, 2),

  (uuid_generate_v4(), cat_accounts,
   'Updating Your Profile Information',
   'updating-your-profile',
   'You can update your name, phone number, and profile photo at any time by logging in and navigating to "My Profile". Click "Edit Profile", make your changes, and tap "Save". Changes take effect immediately across the platform.'||chr(10)||chr(10)||
   'Email address changes require re-verification for security reasons. If you need to change your registered email, you will receive a confirmation link at both the old and new addresses before the change is finalised.',
   'How to keep your personal information up to date on RoutePro.',
   true, 3),

  (uuid_generate_v4(), cat_accounts,
   'Deleting Your RoutePro Account',
   'deleting-your-account',
   'To delete your account, go to "Settings" then "Account" and scroll to the bottom to find the "Delete Account" option. Please note that deleting your account is permanent — all your booking history, saved routes, and wallet balance will be lost.'||chr(10)||chr(10)||
   'Before deleting, ensure you have redeemed any wallet balance and downloaded any booking receipts you may need. Outstanding disputes or pending bookings must be resolved before the deletion request can be processed.',
   'Understand what happens when you delete your account and how to proceed.',
   true, 4),

  -- BOOKING & TICKETS (4 articles)
  (uuid_generate_v4(), cat_booking,
   'How to Book a Bus Ticket on RoutePro',
   'how-to-book-bus-ticket',
   'Booking a ticket on RoutePro takes less than two minutes. From the home screen, select your departure city, destination, travel date, and the number of passengers. A list of available trips with prices will appear — choose one, select your preferred seat, and proceed to payment.'||chr(10)||chr(10)||
   'After successful payment, your e-ticket will be sent to your registered email and will also be available in the "My Bookings" section of the app. You can present either the email or the app screen at the terminal for boarding.',
   'A complete walkthrough for booking your first bus ticket.',
   true, 1),

  (uuid_generate_v4(), cat_booking,
   'How to Cancel a Booking',
   'how-to-cancel-booking',
   'To cancel a booking, navigate to "My Bookings", select the relevant trip, and tap "Cancel Booking". Cancellations made more than 24 hours before departure qualify for a full refund minus the platform cancellation fee. Late cancellations may attract a higher fee or no refund.'||chr(10)||chr(10)||
   'Once cancelled, the refund will be processed within 3–5 business days to your original payment method. Wallet refunds are instantaneous. You will receive a cancellation confirmation email with the refund details.',
   'Understand the cancellation process and applicable refund timelines.',
   true, 2),

  (uuid_generate_v4(), cat_booking,
   'Viewing and Downloading Your E-Ticket',
   'viewing-downloading-eticket',
   'All your active and past tickets are accessible under "My Bookings". Tap any booking to see the full e-ticket, which includes the QR code, seat number, departure time, and terminal details. Use the "Download" button to save a PDF copy to your device.'||chr(10)||chr(10)||
   'If you did not receive a booking confirmation email, first check your spam folder. You can also resend the confirmation from within the app by tapping the ticket and selecting "Resend Email".',
   'Find, view, and download your RoutePro e-tickets anytime.',
   true, 3),

  (uuid_generate_v4(), cat_booking,
   'Group Bookings — Travelling with Others',
   'group-bookings',
   'RoutePro supports group bookings of up to 6 seats per transaction. Select the number of passengers on the search screen, then choose seats for all travellers. You can customise each passenger''s name and ID details on the checkout page.'||chr(10)||chr(10)||
   'For groups larger than 6, you will need to make multiple bookings. Corporate clients and frequent group travellers can contact our partnerships team for bulk booking arrangements and special pricing.',
   'Tips and instructions for booking multiple seats in one transaction.',
   true, 4),

  -- PAYMENTS & REFUNDS (4 articles)
  (uuid_generate_v4(), cat_payments,
   'Accepted Payment Methods',
   'accepted-payment-methods',
   'RoutePro accepts a wide range of payment methods to make your booking experience seamless. These include debit/credit cards (Visa, Mastercard, Verve), bank transfers via Paystack, USSD payments, and the RoutePro Wallet. All transactions are secured with 256-bit SSL encryption.'||chr(10)||chr(10)||
   'We are continuously adding new payment options. If your preferred method is not available, please contact our support team and we will do our best to accommodate you.',
   'Overview of all payment options accepted on the RoutePro platform.',
   true, 1),

  (uuid_generate_v4(), cat_payments,
   'Understanding the RoutePro Wallet',
   'routepro-wallet',
   'The RoutePro Wallet is a digital wallet linked to your account that you can fund and use to pay for bookings instantly. To fund your wallet, go to "Wallet" in the app and select "Add Funds". You can top up via card, bank transfer, or USSD.'||chr(10)||chr(10)||
   'Wallet balances do not expire and can be used for any booking on the platform. Refunds from cancelled bookings are often processed to the wallet within minutes, providing immediate reuse without waiting for bank processing times.',
   'How to fund, manage, and use your RoutePro Wallet effectively.',
   true, 2),

  (uuid_generate_v4(), cat_payments,
   'Refund Policy and Timelines',
   'refund-policy',
   'RoutePro''s refund policy is designed to be fair to both passengers and transport partners. Cancellations made 24 hours or more before departure are eligible for a full refund minus a 5% processing fee. Cancellations within 24 hours attract a 20% cancellation fee.'||chr(10)||chr(10)||
   'Refunds to cards or bank accounts typically take 3–5 working days depending on your bank. Wallet refunds are instant. If your refund has not arrived after 7 working days, please raise a support ticket and we will investigate immediately.',
   'Everything you need to know about refund eligibility and processing times.',
   true, 3),

  (uuid_generate_v4(), cat_payments,
   'Reporting a Failed Payment',
   'reporting-failed-payment',
   'If you were charged but did not receive a booking confirmation, do not panic. This sometimes occurs due to network delays. Wait 15 minutes and check "My Bookings" — the booking may still be processing. Also check your email (including spam) for a confirmation message.'||chr(10)||chr(10)||
   'If the booking does not appear after 30 minutes and funds were deducted from your account, take a screenshot of your bank statement showing the deduction and raise a dispute via the "Support" section of the app. Our team resolves such cases within 24 hours.',
   'Steps to take when a payment fails or funds are deducted without confirmation.',
   true, 4),

  -- TRIPS & ROUTES (3 articles)
  (uuid_generate_v4(), cat_trips,
   'Finding Available Routes',
   'finding-available-routes',
   'RoutePro covers hundreds of inter-city and intra-city routes across Nigeria. Use the search function on the home screen to find trips between your chosen cities. You can filter results by price, departure time, company rating, and available amenities.'||chr(10)||chr(10)||
   'Popular routes are highlighted on the home screen for quick access. If you cannot find a specific route, it may not currently be available on our platform — you can use the "Request a Route" feature to let us know about demand in your area.',
   'How to search and browse routes available on the RoutePro platform.',
   true, 1),

  (uuid_generate_v4(), cat_trips,
   'What to Do if Your Trip is Delayed or Cancelled by the Operator',
   'trip-delayed-cancelled-operator',
   'If a trip is delayed or cancelled by the transport company, you will receive an SMS and in-app notification as soon as possible. You will be offered the choice of a free rebooking on the next available trip or a full refund.'||chr(10)||chr(10)||
   'For delays exceeding 2 hours, RoutePro offers an additional travel credit as compensation credited directly to your wallet. You do not need to contact support — this happens automatically once the delay is confirmed in our system.',
   'Understand your rights and options when a transport company cancels or delays a trip.',
   true, 2),

  (uuid_generate_v4(), cat_trips,
   'How to Leave a Review After Your Trip',
   'leaving-a-trip-review',
   'After your trip has departed, you will receive a prompt in the app asking you to rate your experience. You can rate the overall journey, comfort, punctuality, and driver professionalism. Reviews help other passengers make informed choices.'||chr(10)||chr(10)||
   'Reviews are published after a brief moderation check. RoutePro does not allow reviews that contain offensive language or personal information. If you notice a fraudulent or inaccurate review, you can flag it using the "Report" option next to any review.',
   'Share your travel experience and help improve service quality on RoutePro.',
   true, 3),

  -- COMPANIES & VERIFICATION (3 articles)
  (uuid_generate_v4(), cat_companies,
   'How Transport Companies Are Verified on RoutePro',
   'transport-company-verification',
   'All transport companies on RoutePro go through a rigorous verification process before they are allowed to list trips. This includes submission of business registration documents, proof of vehicle insurance, driver licence verification, and a safety inspection report.'||chr(10)||chr(10)||
   'Verified companies display a blue checkmark badge on their profile. We conduct periodic re-verifications to ensure ongoing compliance. If you suspect a company has false credentials, please report it via the "Report Company" option on their profile page.',
   'How RoutePro ensures every listed transport company meets safety and regulatory standards.',
   true, 1),

  (uuid_generate_v4(), cat_companies,
   'Reporting a Transport Company',
   'reporting-transport-company',
   'If you experience poor service, safety concerns, or fraudulent behaviour from a transport company, you can report them directly from their profile page or from your booking receipt. Tap "Report Company", select the reason, and provide as much detail as possible.'||chr(10)||chr(10)||
   'All reports are reviewed by the RoutePro trust and safety team within 48 hours. Severe violations may result in immediate suspension pending investigation. You will be notified of the outcome once the review is complete.',
   'Steps to report unsafe or fraudulent transport companies on the platform.',
   true, 2),

  (uuid_generate_v4(), cat_companies,
   'Becoming a Listed Transport Company',
   'becoming-listed-company',
   'If you operate a transport company and would like to list your services on RoutePro, visit our Partners page and complete the onboarding application. You will need to provide your CAC registration, vehicle fleet details, and insurance documentation.'||chr(10)||chr(10)||
   'Our onboarding team will review your application within 5 business days. Approved companies gain access to our operator dashboard where they can manage routes, schedules, pricing, and view analytics for their fleet.',
   'How transport operators can apply to list their services on RoutePro.',
   true, 3),

  -- SAFETY & SECURITY (3 articles)
  (uuid_generate_v4(), cat_safety,
   'Staying Safe When Travelling with RoutePro',
   'staying-safe-travelling',
   'RoutePro is committed to passenger safety. Always verify the bus plate number and company name match your ticket before boarding. Never travel in an unlicensed vehicle, and use only official RoutePro terminals and pick-up points.'||chr(10)||chr(10)||
   'Share your trip details with a trusted contact using the "Share My Trip" feature in the app. This lets your contact track your journey in real time. If you feel unsafe at any point during your journey, use the SOS button within the app to alert our support team.',
   'Essential safety tips for every RoutePro passenger.',
   true, 1),

  (uuid_generate_v4(), cat_safety,
   'How to Protect Your Account from Fraud',
   'protect-account-from-fraud',
   'RoutePro will never ask for your password, OTP, or card PIN via email, SMS, or phone call. If you receive such a request, it is fraudulent — do not comply and report it immediately. Use a strong, unique password and enable two-factor authentication in your settings.'||chr(10)||chr(10)||
   'Be cautious of third-party websites or agents claiming to offer RoutePro tickets at a discount. Always book directly through the official website or app. Fraudulent tickets will not be honoured at terminals.',
   'Tips to keep your RoutePro account and personal data secure.',
   true, 2),

  (uuid_generate_v4(), cat_safety,
   'RoutePro''s Data Privacy and NDPR Compliance',
   'data-privacy-ndpr-compliance',
   'RoutePro takes data privacy seriously and is fully compliant with Nigeria''s Data Protection Regulation (NDPR). We only collect personal data necessary to provide our services and never sell your data to third parties.'||chr(10)||chr(10)||
   'You can request a copy of all data we hold about you, or request deletion of your personal data, by contacting our Data Protection Officer at privacy@routepro.ng. We respond to all data requests within 30 days.',
   'How RoutePro handles your personal data and complies with NDPR.',
   true, 3),

  -- TECHNICAL SUPPORT (3 articles)
  (uuid_generate_v4(), cat_technical,
   'The RoutePro App is Crashing — What to Do',
   'app-crashing-troubleshoot',
   'If the RoutePro app is crashing or behaving unexpectedly, start by closing the app completely and reopening it. If the problem persists, check that you have the latest version installed — we regularly release updates with bug fixes.'||chr(10)||chr(10)||
   'Clearing the app cache (Settings > Apps > RoutePro > Clear Cache) resolves most stability issues. If the problem continues after an update and cache clear, please uninstall and reinstall the app. Contact support if the issue persists after reinstallation.',
   'Troubleshooting steps for app crashes and performance issues.',
   true, 1),

  (uuid_generate_v4(), cat_technical,
   'Why Is My Booking Not Showing?',
   'booking-not-showing',
   'There can be several reasons a booking may not appear in "My Bookings". The most common is a payment processing delay — wait 15–30 minutes and refresh the page. Another cause is that you may be logged into a different account than the one used to make the booking.'||chr(10)||chr(10)||
   'Check your email for a booking confirmation — it will contain the booking reference. You can use this reference to look up your booking via "My Bookings > Search by Reference". If nothing resolves the issue, contact support with your payment reference number.',
   'What to check if a confirmed booking is missing from your account.',
   true, 2),

  (uuid_generate_v4(), cat_technical,
   'Supported Browsers and Devices',
   'supported-browsers-devices',
   'The RoutePro web platform supports all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated to the latest version for the best experience. Internet Explorer is not supported.'||chr(10)||chr(10)||
   'The RoutePro mobile app is available for Android 8.0+ and iOS 13+. If your device does not meet these requirements, you can still access all features through the mobile web browser. Contact support if you encounter compatibility issues on a supported device.',
   'Check which browsers and devices are fully supported by RoutePro.',
   true, 3),

  -- TRANSPORT PARTNERS (3 articles)
  (uuid_generate_v4(), cat_partners,
   'Partner Dashboard Overview',
   'partner-dashboard-overview',
   'The RoutePro Partner Dashboard is your central hub for managing your transport business on the platform. From here you can add and manage routes, set schedules and pricing, view bookings, manage your fleet, and access financial reports and payouts.'||chr(10)||chr(10)||
   'The dashboard is designed to be intuitive, but we also offer a full video tutorial series accessible from the "Help" section within the dashboard. New partners are assigned a dedicated onboarding manager for the first 30 days.',
   'An introduction to all features available in the RoutePro operator dashboard.',
   true, 1),

  (uuid_generate_v4(), cat_partners,
   'How Payouts Work for Transport Partners',
   'partner-payouts',
   'RoutePro collects ticket revenue on behalf of transport partners and disburses payouts on a weekly basis, every Tuesday. The payout includes all bookings that departed in the previous week, minus the platform commission (currently 10%).'||chr(10)||chr(10)||
   'Payouts are sent directly to the bank account registered on your partner profile. You can view a detailed breakdown of each payout in the "Finance" section of your dashboard. If you have a payout query, raise a ticket through the partner support channel.',
   'Understanding the payout schedule and commission structure for RoutePro partners.',
   true, 2),

  (uuid_generate_v4(), cat_partners,
   'Adding and Managing Your Fleet',
   'adding-managing-fleet',
   'To add a vehicle to your fleet, go to "Fleet Management" in the partner dashboard and click "Add Vehicle". Enter the vehicle details including plate number, model, year, seating capacity, and upload the vehicle insurance and roadworthiness certificates.'||chr(10)||chr(10)||
   'Vehicles are reviewed within 24 hours. Once approved, you can assign them to specific routes and schedules. You can deactivate a vehicle temporarily (e.g., for maintenance) without removing it from your fleet, and reactivate it when it returns to service.',
   'Step-by-step guide to registering and managing vehicles on the RoutePro platform.',
   true, 3),

  -- DRIVERS & FLEET (3 articles)
  (uuid_generate_v4(), cat_drivers,
   'Driver Onboarding Requirements',
   'driver-onboarding-requirements',
   'All drivers operating under transport companies on RoutePro must complete the driver onboarding process. Required documents include a valid driver''s licence (minimum 3 years driving experience), a police clearance certificate, and proof of health fitness from a certified medical provider.'||chr(10)||chr(10)||
   'Documents are reviewed within 48 hours. Approved drivers receive a unique QR-code driver ID that passengers can scan to verify their credentials. Driver profiles are linked to their assigned vehicle and visible to passengers at the point of boarding.',
   'What documents and requirements are needed for drivers to operate on RoutePro.',
   true, 1),

  (uuid_generate_v4(), cat_drivers,
   'Driver Ratings and Performance Metrics',
   'driver-ratings-performance',
   'Passengers can rate their driver after every trip on a scale of 1 to 5 stars across categories including punctuality, driving safety, politeness, and vehicle cleanliness. These ratings are aggregated to form the driver''s overall score visible on their profile.'||chr(10)||chr(10)||
   'Drivers who maintain a rating below 3.5 over a rolling 30-day period may be temporarily suspended pending a performance review. RoutePro provides drivers with access to their dashboard showing their ratings history and feedback to help them improve.',
   'How driver performance is measured and what happens with low ratings.',
   true, 2),

  (uuid_generate_v4(), cat_drivers,
   'Reporting a Driver Concern',
   'reporting-driver-concern',
   'If you experienced unsafe driving, harassment, or any other serious concern involving a driver, please report it immediately using the "Report Driver" button on your trip receipt. Provide as much detail as possible including the time, route, and nature of the incident.'||chr(10)||chr(10)||
   'For safety emergencies during a trip, use the in-app SOS button which alerts our 24/7 safety team. All driver reports are handled confidentially. Drivers found to have violated safety standards are suspended immediately pending investigation.',
   'How to report dangerous or inappropriate driver behaviour on RoutePro.',
   true, 3)

  on conflict (slug) do nothing;
end;
$$;


-- ============================================================
-- 11. ADMIN_NOTIFICATIONS — in-app messages to admin dashboard
-- ============================================================
create table if not exists admin_notifications (
  id           uuid        primary key default uuid_generate_v4(),
  title        text        not null,
  body         text        not null,
  type         text        not null default 'info'
                 check (type in ('info', 'warning', 'success', 'error')),
  link         text,
  is_read      bool        not null default false,
  source       text,
  entity_type  text,
  entity_id    text,
  created_at   timestamptz not null default now()
);

alter table admin_notifications enable row level security;

-- Admin full access
create policy "admin_all_admin_notifications" on admin_notifications
  for all
  using (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  )
  with check (
    auth.jwt() ->> 'email' = 'olaideheritagetemitope@gmail.com'
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin')
    )
  );

-- Authenticated (service role / triggers) can insert
create policy "authenticated_insert_admin_notifications" on admin_notifications
  for insert
  with check (auth.uid() is not null or current_setting('role') = 'postgres');


-- ============================================================
-- TRIGGER: partner_applications INSERT → admin_notifications
-- ============================================================
create or replace function notify_admin_on_partner_application()
returns trigger language plpgsql security definer as $$
begin
  insert into admin_notifications (
    id,
    title,
    body,
    type,
    link,
    source,
    entity_type,
    entity_id
  ) values (
    uuid_generate_v4(),
    'New Partner Application',
    new.org_name || ' applied as ' || new.partnership_category,
    'info',
    '/admin/partners/' || new.id::text,
    'partner_applications',
    'partner_application',
    new.id::text
  );
  return new;
end;
$$;

drop trigger if exists trg_partner_application_notify on partner_applications;
create trigger trg_partner_application_notify
  after insert on partner_applications
  for each row execute function notify_admin_on_partner_application();


-- ============================================================
-- INDEXES — for query performance
-- ============================================================
create index if not exists idx_terminals_status      on terminals (status);
create index if not exists idx_terminals_city        on terminals (city);
create index if not exists idx_routes_status         on routes (status);
create index if not exists idx_routes_origin_dest    on routes (origin, destination);
create index if not exists idx_disputes_status       on disputes (status);
create index if not exists idx_disputes_priority     on disputes (priority);
create index if not exists idx_disputes_complainant  on disputes (complainant_id);
create index if not exists idx_audit_logs_actor      on audit_logs (actor_id);
create index if not exists idx_audit_logs_entity     on audit_logs (entity_type, entity_id);
create index if not exists idx_audit_logs_created    on audit_logs (created_at desc);
create index if not exists idx_partner_apps_status   on partner_applications (status);
create index if not exists idx_fraud_flags_entity    on fraud_flags (entity_type, entity_id);
create index if not exists idx_fraud_flags_status    on fraud_flags (status);
create index if not exists idx_help_articles_cat     on help_articles (category_id);
create index if not exists idx_help_articles_pub     on help_articles (is_published);
create index if not exists idx_admin_notif_read      on admin_notifications (is_read);
create index if not exists idx_admin_notif_created   on admin_notifications (created_at desc);
create index if not exists idx_notifications_log_status on notifications_log (status);
