-- RoutePro RLS Architecture Migration
-- Ensures users, companies, and staff can properly insert, update, and delete their own records.

-- 1. Helper Functions
CREATE OR REPLACE FUNCTION public.is_company_owner(target_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM companies
    WHERE id = target_company_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_company_staff(target_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM company_staff
    WHERE company_id = target_company_id AND user_id = auth.uid() AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_company_access(target_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_company_owner(target_company_id) OR public.is_company_staff(target_company_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Companies
CREATE POLICY "Users can insert their own company" ON companies 
FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete pending companies" ON companies
FOR DELETE USING (auth.uid() = owner_id AND status != 'APPROVED');

-- 3. Company Verifications
CREATE POLICY "Owners can manage verifications" ON company_verifications
FOR ALL USING (public.is_company_owner(company_id))
WITH CHECK (public.is_company_owner(company_id));

-- 4. Vehicle Batches
CREATE POLICY "Company can manage vehicle batches" ON vehicle_batches
FOR ALL USING (public.has_company_access(company_id))
WITH CHECK (public.has_company_access(company_id));

-- 5. Vehicles
CREATE POLICY "Company can manage vehicles" ON vehicles
FOR ALL USING (public.has_company_access(company_id))
WITH CHECK (public.has_company_access(company_id));

-- 6. Terminals
CREATE POLICY "Company can manage terminals" ON terminals
FOR ALL USING (public.has_company_access(company_id))
WITH CHECK (public.has_company_access(company_id));

-- 7. Drivers
CREATE POLICY "Company can manage drivers" ON drivers
FOR ALL USING (public.has_company_access(company_id))
WITH CHECK (public.has_company_access(company_id));

-- 8. Routes
CREATE POLICY "Company can manage routes" ON routes
FOR ALL USING (public.has_company_access(company_id))
WITH CHECK (public.has_company_access(company_id));

-- 9. Trips
CREATE POLICY "Company can manage trips" ON trips
FOR ALL USING (public.has_company_access(company_id))
WITH CHECK (public.has_company_access(company_id));

-- 10. Bookings
CREATE POLICY "Users can insert bookings" ON bookings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their bookings" ON bookings
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Company can view bookings for their trips" ON bookings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM trips t
    WHERE t.id = trip_id AND public.has_company_access(t.company_id)
  )
);

-- 11. Booking Passengers
CREATE POLICY "Users can manage booking passengers" ON booking_passengers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_id AND b.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_id AND b.user_id = auth.uid()
  )
);

-- 12. Payments
CREATE POLICY "Users can insert payments" ON payments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their payments" ON payments
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 13. Reviews
CREATE POLICY "Users can manage their reviews" ON reviews
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 14. Disputes
CREATE POLICY "Users can manage their disputes" ON disputes
FOR ALL USING (auth.uid() = complainant_id)
WITH CHECK (auth.uid() = complainant_id);

-- 15. Notifications
CREATE POLICY "Users can update their notifications" ON notifications
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 16. Audit Logs (Only INSERT for users/companies)
CREATE POLICY "Users can insert audit logs" ON audit_logs
FOR INSERT WITH CHECK (auth.uid() = actor_id);

-- 17. Wallets (Customer & Company)
-- Wallet insertion is usually handled by triggers or service role, but just in case:
CREATE POLICY "Users can view their wallet" ON passenger_wallets
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can view their wallet" ON company_wallets
FOR SELECT USING (public.is_company_owner(company_id));

-- Note: We do NOT allow INSERT/UPDATE on wallets or transactions here. 
-- Those must be done via secure backend functions bypassing RLS.
