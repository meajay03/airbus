-- Migration 004: Launch with exactly Six Roles and Strict RBAC Matrix

-- 1. Ensure the six official launch roles exist
INSERT INTO roles (name)
VALUES
  ('guest'),
  ('host'),
  ('property_manager'),
  ('support_agent'),
  ('admin'),
  ('super_admin')
ON CONFLICT (name) DO NOTHING;

-- 2. Map existing user_roles from legacy role names into the six launch roles
UPDATE user_roles
SET role_id = (SELECT id FROM roles WHERE name = 'host' LIMIT 1)
WHERE role_id IN (SELECT id FROM roles WHERE name = 'owner');

UPDATE user_roles
SET role_id = (SELECT id FROM roles WHERE name = 'property_manager' LIMIT 1)
WHERE role_id IN (SELECT id FROM roles WHERE name IN ('manager', 'hotel_manager'));

UPDATE user_roles
SET role_id = (SELECT id FROM roles WHERE name = 'support_agent' LIMIT 1)
WHERE role_id IN (SELECT id FROM roles WHERE name IN ('staff', 'front_desk', 'housekeeping', 'finance_operator', 'property_reviewer'));

-- 3. Delete non-launch roles from role_permissions and roles table
DELETE FROM role_permissions
WHERE role_id NOT IN (
  SELECT id FROM roles WHERE name IN ('guest', 'host', 'property_manager', 'support_agent', 'admin', 'super_admin')
);

DELETE FROM roles
WHERE name NOT IN ('guest', 'host', 'property_manager', 'support_agent', 'admin', 'super_admin');

-- 4. Ensure properties.update permission exists in permissions table
INSERT INTO permissions (name, category, description)
VALUES ('properties.update', 'properties', 'Update owned or managed property listings')
ON CONFLICT (name) DO NOTHING;

-- 5. Re-seed permissions mapping strictly for the six launch roles
DELETE FROM role_permissions;

DO $$
DECLARE
  r_guest smallint;
  r_host smallint;
  r_prop_mgr smallint;
  r_support smallint;
  r_admin smallint;
  r_super_admin smallint;
BEGIN
  SELECT id INTO r_guest FROM roles WHERE name = 'guest';
  SELECT id INTO r_host FROM roles WHERE name = 'host';
  SELECT id INTO r_prop_mgr FROM roles WHERE name = 'property_manager';
  SELECT id INTO r_support FROM roles WHERE name = 'support_agent';
  SELECT id INTO r_admin FROM roles WHERE name = 'admin';
  SELECT id INTO r_super_admin FROM roles WHERE name = 'super_admin';

  -- 1. GUEST: Bookings and payments (personal stays only)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_guest, id FROM permissions WHERE name IN (
    'properties.read',
    'bookings.read'
  );

  -- 2. HOST: Listings and earnings (owned properties only)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_host, id FROM permissions WHERE name IN (
    'properties.read',
    'properties.update',
    'bookings.read',
    'bookings.manage',
    'payouts.read'
  );

  -- 3. PROPERTY MANAGER: Assigned operational tasks and hotel/estate management
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_prop_mgr, id FROM permissions WHERE name IN (
    'properties.read',
    'properties.update',
    'bookings.read',
    'bookings.manage'
  );

  -- 4. SUPPORT AGENT: Customer service, disputes, refund requests (NO financial reports or admin rights)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_support, id FROM permissions WHERE name IN (
    'users.read',
    'properties.read',
    'bookings.read',
    'bookings.manage',
    'refunds.request'
  );

  -- 5. ADMIN: Platform-wide operations & analytics (CANNOT execute super-admin-only operations)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_admin, id FROM permissions WHERE name IN (
    'users.read',
    'users.update',
    'users.suspend',
    'properties.read',
    'properties.review',
    'properties.publish',
    'bookings.read',
    'bookings.manage',
    'payments.read',
    'refunds.request',
    'refunds.approve',
    'payouts.read',
    'payouts.manage',
    'analytics.read',
    'analytics.financial.read',
    'reports.export',
    'settings.manage',
    'audit_logs.read'
  );

  -- 6. SUPER ADMIN: Full governance, role management, and system administration
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_super_admin, id FROM permissions;

END $$;
