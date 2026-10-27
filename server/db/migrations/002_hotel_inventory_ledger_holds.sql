-- Migration 002: Hotel Inventory, Room Types, Inventory Holds, Financial Ledger, and Host Business Verification

-- 1. Host Businesses and Verification Records
CREATE TABLE IF NOT EXISTS host_businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  registration_number text,
  tax_identifier text,
  registered_address text,
  business_type text NOT NULL DEFAULT 'individual' CHECK(business_type IN ('individual', 'partnership', 'company', 'trust')),
  verification_status text NOT NULL DEFAULT 'pending' CHECK(verification_status IN ('pending', 'under_review', 'verified', 'rejected')),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verification_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_reference text,
  storage_key text,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Host Team Members with Granular Role Permissions
CREATE TABLE IF NOT EXISTS host_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  team_role text NOT NULL CHECK(team_role IN ('manager', 'front_desk', 'housekeeping', 'maintenance', 'finance')),
  can_manage_inventory boolean NOT NULL DEFAULT false,
  can_manage_rates boolean NOT NULL DEFAULT false,
  can_view_financials boolean NOT NULL DEFAULT false,
  can_manage_bookings boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(host_id, user_id, property_id)
);

-- 3. Hotel Room Types and Multi-Unit Accommodation
CREATE TABLE IF NOT EXISTS room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text NOT NULL DEFAULT '',
  max_occupancy integer NOT NULL CHECK(max_occupancy > 0),
  adults_capacity integer NOT NULL DEFAULT 2 CHECK(adults_capacity > 0),
  children_capacity integer NOT NULL DEFAULT 1 CHECK(children_capacity >= 0),
  total_inventory integer NOT NULL CHECK(total_inventory > 0),
  base_nightly_rate numeric(12,2) NOT NULL CHECK(base_nightly_rate >= 0),
  weekend_nightly_rate numeric(12,2),
  bed_configuration text NOT NULL DEFAULT '1 King Bed',
  room_size_sqft integer,
  amenities jsonb NOT NULL DEFAULT '[]',
  photos jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id, slug)
);

CREATE TABLE IF NOT EXISTS room_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id uuid NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  unit_number text NOT NULL,
  floor_number text,
  status text NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'maintenance', 'blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_type_id, unit_number)
);

-- 4. Rate Plans (e.g. Room Only, Bed & Breakfast, Non-Refundable, Flexible Luxury)
CREATE TABLE IF NOT EXISTS rate_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id uuid NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  meal_plan text NOT NULL DEFAULT 'room_only' CHECK(meal_plan IN ('room_only', 'breakfast_included', 'half_board', 'all_inclusive')),
  cancellation_policy text NOT NULL DEFAULT 'flexible' CHECK(cancellation_policy IN ('flexible', 'moderate', 'strict', 'non_refundable')),
  rate_multiplier numeric(5,4) NOT NULL DEFAULT 1.0000 CHECK(rate_multiplier > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Temporary Transactional Inventory Holds (prevents race conditions and double bookings during checkout)
CREATE TABLE IF NOT EXISTS inventory_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_type_id uuid REFERENCES room_types(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  user_id uuid REFERENCES users(id),
  check_in date NOT NULL,
  check_out date NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK(quantity > 0),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'held' CHECK(status IN ('held', 'converted', 'released', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(check_out > check_in)
);
CREATE INDEX IF NOT EXISTS inventory_holds_active_idx ON inventory_holds(property_id, check_in, check_out, expires_at) WHERE status = 'held';

-- 6. Immutable Double-Entry Financial Ledger
CREATE TABLE IF NOT EXISTS financial_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id),
  transaction_type text NOT NULL CHECK(transaction_type IN (
    'guest_payment',
    'platform_service_fee',
    'host_commission',
    'host_payable_credit',
    'tax_collected',
    'refund_debit',
    'host_payout_debit',
    'payment_processing_fee',
    'manual_adjustment'
  )),
  entry_type text NOT NULL CHECK(entry_type IN ('debit', 'credit')),
  amount numeric(12,2) NOT NULL CHECK(amount >= 0),
  currency char(3) NOT NULL DEFAULT 'INR',
  account_name text NOT NULL,
  description text NOT NULL,
  reference_id text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS financial_ledger_booking_idx ON financial_ledger_entries(booking_id);
CREATE INDEX IF NOT EXISTS financial_ledger_type_idx ON financial_ledger_entries(transaction_type, created_at);

-- 7. Payout Attempts and Settlement Records
CREATE TABLE IF NOT EXISTS payout_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid REFERENCES owner_payouts(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES users(id),
  amount numeric(12,2) NOT NULL,
  currency char(3) NOT NULL DEFAULT 'INR',
  payout_method text NOT NULL CHECK(payout_method IN ('bank_transfer', 'upi', 'razorpay_x', 'stripe_connect')),
  account_details_redacted text NOT NULL,
  gateway_reference text,
  status text NOT NULL DEFAULT 'initiated' CHECK(status IN ('initiated', 'processing', 'completed', 'failed', 'reversed')),
  failure_reason text,
  initiated_by uuid REFERENCES users(id),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Add Room Type FK to Bookings if Hotel Booking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS room_type_id uuid REFERENCES room_types(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_type text NOT NULL DEFAULT 'entire_property' CHECK(booking_type IN ('entire_property', 'room_type'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meal_plan text DEFAULT 'room_only';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_policy text DEFAULT 'flexible';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_requests text DEFAULT '';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS expires_at timestamptz;
