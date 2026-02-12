-- Create users table for customer authentication
-- This table is separate from profiles (which extends auth.users)
-- and is used for the main application users (customers, admins, superadmins)

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('superadmin', 'admin', 'customer')),
  tenant_id UUID REFERENCES public.tenants(id),
  pin_hash VARCHAR(255),
  pin_set_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own data"
  ON public.users FOR SELECT
  USING (phone = current_setting('request.jwt.claims', true)::json->>'phone' OR role = 'superadmin');

CREATE POLICY "Users can update their own data"
  ON public.users FOR UPDATE
  USING (phone = current_setting('request.jwt.claims', true)::json->>'phone');

CREATE POLICY "Service role can do everything"
  ON public.users FOR ALL
  USING (true)
  WITH CHECK (true);

-- Migrate existing data from profiles table
-- This ensures existing users with PINs can continue to log in
INSERT INTO public.users (id, phone, pin_hash, created_at)
SELECT 
  id, 
  phone, 
  pin_hash, 
  COALESCE(created_at, NOW())
FROM public.profiles
WHERE phone IS NOT NULL
ON CONFLICT (phone) DO UPDATE SET
  pin_hash = EXCLUDED.pin_hash,
  pin_set_at = CASE 
    WHEN EXCLUDED.pin_hash IS NOT NULL AND public.users.pin_hash IS NULL 
    THEN NOW() 
    ELSE public.users.pin_set_at 
  END;

-- Add comment
COMMENT ON TABLE public.users IS 'Application users (customers, admins, superadmins) with phone-based authentication';
COMMENT ON COLUMN public.users.pin_hash IS 'Bcrypt hashed 6-digit PIN code for user authentication';
COMMENT ON COLUMN public.users.pin_set_at IS 'Timestamp when PIN was first set or last reset';
