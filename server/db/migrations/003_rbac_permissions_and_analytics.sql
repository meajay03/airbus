-- Migration 003: Comprehensive RBAC Permissions, Analytics Events, Admin Notes & Indexes

-- 1. Ensure all platform roles exist in the roles table
INSERT INTO roles (name) VALUES 
  ('guest'),
  ('host'),
  ('owner'),
  ('property_manager'),
  ('hotel_manager'),
  ('front_desk'),
  ('housekeeping'),
  ('support_agent'),
  ('finance_operator'),
  ('property_reviewer'),
  ('admin'),
  ('super_admin')
ON CONFLICT (name) DO NOTHING;

-- 2. Granular Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  description text NOT NULL
);

-- Seed Explicit Permissions
INSERT INTO permissions (name, category, description) VALUES
  ('users.read', 'users', 'View user directory and profiles'),
  ('users.update', 'users', 'Update user profiles and contact info'),
  ('users.suspend', 'users', 'Suspend or reactivate user accounts'),
  ('users.roles.manage', 'users', 'Assign or revoke user roles and permissions'),
  ('properties.read', 'properties', 'View property listings and details'),
  ('properties.review', 'properties', 'Review property submissions and legal documentation'),
  ('properties.publish', 'properties', 'Publish, approve, or delist properties'),
  ('bookings.read', 'bookings', 'View booking records and itineraries'),
  ('bookings.manage', 'bookings', 'Modify or cancel bookings and resolve disputes'),
  ('payments.read', 'finance', 'View transactions, gateways, and payment status'),
  ('refunds.request', 'finance', 'Initiate refund requests for guest bookings'),
  ('refunds.approve', 'finance', 'Authorize and execute financial refunds'),
  ('payouts.read', 'finance', 'View host earnings and payable balances'),
  ('payouts.manage', 'finance', 'Process host payouts and settlement transfers'),
  ('analytics.read', 'analytics', 'View operational analytics and business KPIs'),
  ('analytics.financial.read', 'analytics', 'View financial analytics, revenue, and margins'),
  ('reports.export', 'analytics', 'Export raw data and executive PDF/CSV summaries'),
  ('settings.manage', 'system', 'Configure platform fees, commissions, and policies'),
  ('audit_logs.read', 'system', 'Inspect immutable audit logs and security events'),
  ('roles.manage', 'system', 'Create and modify system roles and permission sets')
ON CONFLICT (name) DO NOTHING;

-- 3. Role-to-Permissions Mapping Table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id smallint NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id integer NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Seed Role Permissions mapping function
DO $$
DECLARE
  r_guest smallint;
  r_host smallint;
  r_owner smallint;
  r_prop_mgr smallint;
  r_hotel_mgr smallint;
  r_front_desk smallint;
  r_housekeeping smallint;
  r_support smallint;
  r_finance smallint;
  r_reviewer smallint;
  r_admin smallint;
  r_super_admin smallint;
BEGIN
  SELECT id INTO r_guest FROM roles WHERE name = 'guest';
  SELECT id INTO r_host FROM roles WHERE name = 'host';
  SELECT id INTO r_owner FROM roles WHERE name = 'owner';
  SELECT id INTO r_prop_mgr FROM roles WHERE name = 'property_manager';
  SELECT id INTO r_hotel_mgr FROM roles WHERE name = 'hotel_manager';
  SELECT id INTO r_front_desk FROM roles WHERE name = 'front_desk';
  SELECT id INTO r_housekeeping FROM roles WHERE name = 'housekeeping';
  SELECT id INTO r_support FROM roles WHERE name = 'support_agent';
  SELECT id INTO r_finance FROM roles WHERE name = 'finance_operator';
  SELECT id INTO r_reviewer FROM roles WHERE name = 'property_reviewer';
  SELECT id INTO r_admin FROM roles WHERE name = 'admin';
  SELECT id INTO r_super_admin FROM roles WHERE name = 'super_admin';

  -- GUEST
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_guest, id FROM permissions WHERE name IN ('properties.read', 'bookings.read')
  ON CONFLICT DO NOTHING;

  -- HOST & OWNER
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_host, id FROM permissions WHERE name IN ('properties.read', 'bookings.read', 'bookings.manage', 'payouts.read')
  ON CONFLICT DO NOTHING;
  
  IF r_owner IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r_owner, id FROM permissions WHERE name IN ('properties.read', 'bookings.read', 'bookings.manage', 'payouts.read')
    ON CONFLICT DO NOTHING;
  END IF;

  -- PROPERTY MANAGER
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_prop_mgr, id FROM permissions WHERE name IN ('properties.read', 'bookings.read', 'bookings.manage')
  ON CONFLICT DO NOTHING;

  -- HOTEL MANAGER
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_hotel_mgr, id FROM permissions WHERE name IN ('properties.read', 'bookings.read', 'bookings.manage', 'payouts.read')
  ON CONFLICT DO NOTHING;

  -- FRONT DESK
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_front_desk, id FROM permissions WHERE name IN ('properties.read', 'bookings.read', 'bookings.manage')
  ON CONFLICT DO NOTHING;

  -- HOUSEKEEPING
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_housekeeping, id FROM permissions WHERE name IN ('properties.read')
  ON CONFLICT DO NOTHING;

  -- SUPPORT AGENT
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_support, id FROM permissions WHERE name IN ('users.read', 'properties.read', 'bookings.read', 'bookings.manage', 'refunds.request')
  ON CONFLICT DO NOTHING;

  -- FINANCE OPERATOR
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_finance, id FROM permissions WHERE name IN ('users.read', 'bookings.read', 'payments.read', 'refunds.request', 'refunds.approve', 'payouts.read', 'payouts.manage', 'analytics.financial.read', 'reports.export')
  ON CONFLICT DO NOTHING;

  -- PROPERTY REVIEWER
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_reviewer, id FROM permissions WHERE name IN ('properties.read', 'properties.review', 'properties.publish')
  ON CONFLICT DO NOTHING;

  -- ADMIN
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_admin, id FROM permissions WHERE name IN (
    'users.read', 'users.update', 'users.suspend',
    'properties.read', 'properties.review', 'properties.publish',
    'bookings.read', 'bookings.manage',
    'payments.read', 'refunds.request', 'refunds.approve',
    'payouts.read', 'payouts.manage',
    'analytics.read', 'analytics.financial.read',
    'reports.export', 'settings.manage', 'audit_logs.read'
  )
  ON CONFLICT DO NOTHING;

  -- SUPER ADMIN (All permissions)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_super_admin, id FROM permissions
  ON CONFLICT DO NOTHING;
END $$;

-- 4. Analytics Events table for funnel tracking, conversion, and retention
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  session_id text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created ON analytics_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created ON analytics_events(user_id, created_at);

-- 5. Admin User Notes
CREATE TABLE IF NOT EXISTS admin_user_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id),
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Performance Indexes for Analytics Aggregations
CREATE INDEX IF NOT EXISTS idx_bookings_created_status ON bookings(created_at, status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON bookings(check_in);
CREATE INDEX IF NOT EXISTS idx_users_created_status ON users(created_at, status);
CREATE INDEX IF NOT EXISTS idx_payments_created_status ON payments(created_at, status);
CREATE INDEX IF NOT EXISTS idx_refunds_created_status ON refunds(created_at, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created ON audit_logs(actor_id, created_at);

-- 7. Ensure test admin accounts have super_admin role
DO $$
DECLARE
  super_admin_role_id smallint;
  admin_user_id uuid;
BEGIN
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'super_admin';
  SELECT id INTO admin_user_id FROM users WHERE email = 'admin@maisonvela.com';
  
  IF admin_user_id IS NOT NULL AND super_admin_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id)
    VALUES (admin_user_id, super_admin_role_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
