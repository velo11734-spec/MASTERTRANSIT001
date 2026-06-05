-- Create cart_reservations table
CREATE TABLE public.cart_reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  trip_id UUID REFERENCES public.trips(id) NOT NULL,
  seat_number TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cart_reservations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own reservations"
ON public.cart_reservations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reservations"
ON public.cart_reservations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reservations"
ON public.cart_reservations FOR DELETE
USING (auth.uid() = user_id);

-- Create a function to clean up expired reservations automatically
CREATE OR REPLACE FUNCTION delete_expired_reservations() RETURNS void AS $$
BEGIN
  DELETE FROM public.cart_reservations WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
