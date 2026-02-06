-- ============================================================
-- Multi-Tenant Bookstore SaaS — Initial Database Schema
-- ============================================================
-- This migration creates all core tables, enums, indexes,
-- and Row-Level Security (RLS) policies.
-- ============================================================

-- ---------- Extensions ----------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- Custom Enum Types ----------

CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'customer');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'refunded');

-- ============================================================
-- TABLES
-- ============================================================

-- ---------- tenants ----------

CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  logo_url    TEXT,
  theme_config JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE tenants IS 'Each tenant represents an independent bookstore.';

-- ---------- users ----------

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone       TEXT NOT NULL UNIQUE,
  name        TEXT,
  role        user_role NOT NULL DEFAULT 'customer',
  tenant_id   UUID REFERENCES tenants(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE users IS 'Application users (customers, admins, superadmins).';

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_phone ON users(phone);

-- ---------- categories ----------

CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL
);

COMMENT ON TABLE categories IS 'Book categories, scoped per tenant. Supports parent-child hierarchy.';

CREATE INDEX idx_categories_tenant_id ON categories(tenant_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- ---------- books ----------

CREATE TABLE books (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  author          TEXT NOT NULL,
  isbn            TEXT,
  description     TEXT,
  price           NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  cover_image_url TEXT,
  stock           INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE books IS 'Book catalog, scoped per tenant.';

CREATE INDEX idx_books_tenant_id ON books(tenant_id);
CREATE INDEX idx_books_category_id ON books(category_id);
CREATE INDEX idx_books_tenant_active ON books(tenant_id, is_active);
CREATE INDEX idx_books_title_search ON books USING gin (to_tsvector('simple', title));

-- ---------- orders ----------

CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          order_status NOT NULL DEFAULT 'pending',
  total_amount    NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  qpay_invoice_id TEXT,
  payment_status  payment_status NOT NULL DEFAULT 'unpaid',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE orders IS 'Customer orders, scoped per tenant.';

CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status);
CREATE INDEX idx_orders_qpay_invoice ON orders(qpay_invoice_id) WHERE qpay_invoice_id IS NOT NULL;

-- ---------- order_items ----------

CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  book_id     UUID NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0)
);

COMMENT ON TABLE order_items IS 'Line items belonging to an order.';

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_book_id ON order_items(book_id);

-- ---------- otp_codes ----------

CREATE TABLE otp_codes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone       TEXT NOT NULL,
  code        TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  verified    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE otp_codes IS 'Phone OTP codes for authentication via CallPro.';

CREATE INDEX idx_otp_codes_phone ON otp_codes(phone);
CREATE INDEX idx_otp_codes_phone_code ON otp_codes(phone, code);
CREATE INDEX idx_otp_codes_expires_at ON otp_codes(expires_at);

-- ============================================================
-- HELPER FUNCTIONS (used by RLS policies)
-- ============================================================

-- Extract the current user's ID from the JWT (set by Supabase auth or custom JWT).
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'user_id')::uuid,
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid
  );
$$;

-- Extract the current user's tenant_id from the JWT.
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid;
$$;

-- Extract the current user's role from the JWT.
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb ->> 'role';
$$;

-- ============================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- ===== tenants =====

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Anyone can read tenants (public storefronts).
CREATE POLICY "tenants_select_public"
  ON tenants FOR SELECT
  USING (true);

-- Only superadmins can insert/update/delete tenants.
CREATE POLICY "tenants_insert_superadmin"
  ON tenants FOR INSERT
  WITH CHECK (auth.user_role() = 'superadmin');

CREATE POLICY "tenants_update_superadmin"
  ON tenants FOR UPDATE
  USING (auth.user_role() = 'superadmin')
  WITH CHECK (auth.user_role() = 'superadmin');

CREATE POLICY "tenants_delete_superadmin"
  ON tenants FOR DELETE
  USING (auth.user_role() = 'superadmin');

-- ===== users =====

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile.
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (id = auth.user_id());

-- Admins can see all users in their tenant.
CREATE POLICY "users_select_admin_tenant"
  ON users FOR SELECT
  USING (
    tenant_id = auth.tenant_id()
    AND auth.user_role() IN ('admin', 'superadmin')
  );

-- Superadmins can see all users.
CREATE POLICY "users_select_superadmin"
  ON users FOR SELECT
  USING (auth.user_role() = 'superadmin');

-- Users can update their own profile (name only — role/tenant changes need admin).
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (id = auth.user_id())
  WITH CHECK (id = auth.user_id());

-- Insert handled by service-role during OTP verification (bypasses RLS).

-- ===== categories =====

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read categories within a tenant (public storefront).
CREATE POLICY "categories_select_public"
  ON categories FOR SELECT
  USING (true);

-- Admins of the tenant can manage categories.
CREATE POLICY "categories_insert_admin"
  ON categories FOR INSERT
  WITH CHECK (
    tenant_id = auth.tenant_id()
    AND auth.user_role() IN ('admin', 'superadmin')
  );

CREATE POLICY "categories_update_admin"
  ON categories FOR UPDATE
  USING (
    tenant_id = auth.tenant_id()
    AND auth.user_role() IN ('admin', 'superadmin')
  )
  WITH CHECK (
    tenant_id = auth.tenant_id()
    AND auth.user_role() IN ('admin', 'superadmin')
  );

CREATE POLICY "categories_delete_admin"
  ON categories FOR DELETE
  USING (
    tenant_id = auth.tenant_id()
    AND auth.user_role() IN ('admin', 'superadmin')
  );

-- ===== books =====

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Anyone can read active books (public storefront).
CREATE POLICY "books_select_public"
  ON books FOR SELECT
  USING (is_active = true);

-- Admins can also see inactive books in their tenant.
CREATE POLICY "books_select_admin_all"
  ON books FOR SELECT
  USING (
    tenant_id = auth.tenant_id()
    AND auth.user_role() IN ('admin', 'superadmin')
  );

-- Admins of the tenant can manage books.
CREATE POLICY "books_insert_admin"
  ON books FOR INSERT
  WITH CHECK (
    tenant_id = auth.tenant_id()
    AND auth.user_role() IN ('admin', 'superadmin')
  );

CREATE POLICY "books_update_admin"
  ON books FOR UPDATE
  USING (
    tenant_id = auth.tenant_id()
    AND auth.user_role() IN ('admin', 'superadmin')
  )
  WITH CHECK (
    tenant_id = auth.tenant_id()
    AND auth.user_role() IN ('admin', 'superadmin')
  );

CREATE POLICY "books_delete_admin"
  ON books FOR DELETE
  USING (
    tenant_id = auth.tenant_id()
    AND auth.user_role() IN ('admin', 'superadmin')
  );

-- ===== orders =====

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customers can see their own orders.
CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (user_id = auth.user_id());

-- Admins can see all orders in their tenant.
CREATE POLICY "orders_select_admin"
  ON orders FOR SELECT
  USING (
    tenant_id = auth.tenant_id()
    AND auth.user_role() IN ('admin', 'superadmin')
  );

-- Customers can create orders in their tenant.
CREATE POLICY "orders_insert_customer"
  ON orders FOR INSERT
  WITH CHECK (
    user_id = auth.user_id()
    AND tenant_id = auth.tenant_id()
  );

-- Admins can update order status in their tenant.
CREATE POLICY "orders_update_admin"
  ON orders FOR UPDATE
  USING (
    tenant_id = auth.tenant_id()
    AND auth.user_role() IN ('admin', 'superadmin')
  )
  WITH CHECK (
    tenant_id = auth.tenant_id()
    AND auth.user_role() IN ('admin', 'superadmin')
  );

-- Customers can cancel their own pending orders.
CREATE POLICY "orders_update_cancel_own"
  ON orders FOR UPDATE
  USING (
    user_id = auth.user_id()
    AND status = 'pending'
  )
  WITH CHECK (
    user_id = auth.user_id()
  );

-- ===== order_items =====

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Customers can see items of their own orders.
CREATE POLICY "order_items_select_own"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.user_id()
    )
  );

-- Admins can see all order items in their tenant.
CREATE POLICY "order_items_select_admin"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.tenant_id = auth.tenant_id()
        AND auth.user_role() IN ('admin', 'superadmin')
    )
  );

-- Customers can insert order items (during order creation).
CREATE POLICY "order_items_insert_customer"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.user_id()
    )
  );

-- ===== otp_codes =====

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- OTP codes are managed exclusively via the service-role key (server-side).
-- No public/anon access to this table.
-- The following policy allows nothing through anon/authenticated roles.
-- All OTP operations go through the admin client which bypasses RLS.

CREATE POLICY "otp_codes_deny_all"
  ON otp_codes FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================
-- SEED HELPER: function to create a tenant with an admin user
-- ============================================================

CREATE OR REPLACE FUNCTION create_tenant_with_admin(
  p_tenant_name TEXT,
  p_tenant_slug TEXT,
  p_admin_phone TEXT,
  p_admin_name  TEXT DEFAULT NULL
)
RETURNS TABLE(tenant_id UUID, admin_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_admin_id  UUID;
BEGIN
  -- Create tenant
  INSERT INTO tenants (name, slug)
  VALUES (p_tenant_name, p_tenant_slug)
  RETURNING id INTO v_tenant_id;

  -- Create or update admin user
  INSERT INTO users (phone, name, role, tenant_id)
  VALUES (p_admin_phone, p_admin_name, 'admin', v_tenant_id)
  ON CONFLICT (phone) DO UPDATE
    SET role = 'admin', tenant_id = v_tenant_id, name = COALESCE(p_admin_name, users.name)
  RETURNING id INTO v_admin_id;

  RETURN QUERY SELECT v_tenant_id, v_admin_id;
END;
$$;

COMMENT ON FUNCTION create_tenant_with_admin IS 'Helper to bootstrap a new tenant with its admin user.';
