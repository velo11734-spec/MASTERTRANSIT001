-- ============================================================
-- Migration: 013_performance_indexes.sql
-- Purpose: Add strategic indexes for production performance
-- ============================================================

-- ── bookings ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_user_id       ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id       ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status        ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at    ON bookings(created_at DESC);

-- ── payments ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_booking_id    ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference     ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_status        ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id       ON payments(user_id);

-- ── trips ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_trips_status           ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_company_id       ON trips(company_id);
CREATE INDEX IF NOT EXISTS idx_trips_route_id         ON trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_departure_at     ON trips(departure_at);

-- ── routes ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_routes_status          ON routes(status);
CREATE INDEX IF NOT EXISTS idx_routes_is_popular      ON routes(is_popular) WHERE is_popular = true;
CREATE INDEX IF NOT EXISTS idx_routes_origin          ON routes(origin);
CREATE INDEX IF NOT EXISTS idx_routes_destination     ON routes(destination);
-- Composite for search engine queries
CREATE INDEX IF NOT EXISTS idx_routes_origin_dest     ON routes(origin, destination) WHERE status = 'active';

-- ── companies ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_companies_status       ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_owner_id     ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_rating       ON companies(rating DESC);

-- ── profiles ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_role          ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email         ON profiles(email);

-- ── audit_logs ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id    ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity      ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action      ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON audit_logs(created_at DESC);

-- ── disputes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_disputes_status        ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_reporter_id   ON disputes(reporter_id);
CREATE INDEX IF NOT EXISTS idx_disputes_ticket_type   ON disputes(ticket_type);
CREATE INDEX IF NOT EXISTS idx_disputes_priority      ON disputes(priority);

-- ── vehicle_listings ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vehicle_listings_status      ON vehicle_listings(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_listings_company_id  ON vehicle_listings(company_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_listings_type        ON vehicle_listings(vehicle_type);

-- ── rental_listings ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rental_listings_status       ON rental_listings(status);
CREATE INDEX IF NOT EXISTS idx_rental_listings_company_id   ON rental_listings(company_id);
CREATE INDEX IF NOT EXISTS idx_rental_listings_location     ON rental_listings(pickup_location);

-- ── jobs ──────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_jobs_status            ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id        ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_department        ON jobs(department);

-- ── job_applications ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id       ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status       ON job_applications(status);

-- ── help_articles ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_help_articles_category_id  ON help_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_help_articles_is_published ON help_articles(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_help_articles_views        ON help_articles(views DESC);

-- ── platform_treasury ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_treasury_type          ON platform_treasury(transaction_type);
CREATE INDEX IF NOT EXISTS idx_treasury_created_at    ON platform_treasury(created_at DESC);

-- ── fleet_vehicles ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_company_id ON fleet_vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_status     ON fleet_vehicles(status);

-- ── Full-text search on routes (for autocomplete) ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_routes_origin_trgm ON routes USING gin(origin gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_routes_dest_trgm   ON routes USING gin(destination gin_trgm_ops);
-- Note: Requires pg_trgm extension. Enable with:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
