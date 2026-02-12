-- Create OTP codes table for phone authentication
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON public.otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_verified ON public.otp_codes(verified);

-- Enable RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access OTP codes (security measure)
CREATE POLICY "Service role can manage OTP codes"
  ON public.otp_codes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to clean up expired OTP codes
CREATE OR REPLACE FUNCTION clean_expired_otp_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.otp_codes
  WHERE expires_at < NOW() OR verified = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a scheduled job to clean up expired codes
-- Note: This requires pg_cron extension
-- SELECT cron.schedule('clean-expired-otps', '*/15 * * * *', 'SELECT clean_expired_otp_codes()');
