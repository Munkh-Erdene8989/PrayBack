-- ============================================================
-- Multi-Tenant Bookstore SaaS — Seed Data (Development Only)
-- ============================================================
-- Run this AFTER the migrations to populate dev users/tenant.
-- Book & category data is loaded via migration
-- 20260206000001_seed_books_data.sql (from xlsx).
-- ============================================================

-- ---------- Create sample tenants ----------

INSERT INTO tenants (id, name, slug, logo_url, theme_config) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Номын Дэлгүүр', 'nomyn-delguur', NULL, '{"primaryColor": "#2563eb", "accentColor": "#f59e0b"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ---------- Create sample users ----------

-- Superadmin
INSERT INTO users (id, phone, name, role, tenant_id) VALUES
  ('b0000000-0000-0000-0000-000000000001', '99001122', 'Super Admin', 'superadmin', NULL)
ON CONFLICT (id) DO NOTHING;

-- Admin for the tenant
INSERT INTO users (id, phone, name, role, tenant_id) VALUES
  ('b0000000-0000-0000-0000-000000000002', '99112233', 'Номын Дэлгүүр Admin', 'admin', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Customer
INSERT INTO users (id, phone, name, role, tenant_id) VALUES
  ('b0000000-0000-0000-0000-000000000004', '99334455', 'Бат', 'customer', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;
