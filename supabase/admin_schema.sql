-- ============================================
-- EROS ADMIN DASHBOARD DATABASE SCHEMA
-- Created: 2025-01-22
-- Purpose: Admin panel, moderation, compliance, payments
-- ============================================

-- ============================================
-- PHASE 1.1: ADMIN USER MANAGEMENT
-- ============================================

-- Admin role types
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'moderator', 'support');

-- Admin users table (separate from regular users)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role admin_role NOT NULL DEFAULT 'moderator',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID, -- which admin created this admin, FK added below
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT, -- TOTP secret for 2FA
  ip_allowlist TEXT[], -- optional IP restrictions for super admins
  metadata JSONB DEFAULT '{}'::JSONB -- additional data like phone and notes
);

-- Add self-referencing foreign key constraint after table creation
ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES admin_users(id);

-- Create index for faster lookups
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);

-- Admin sessions (for tracking concurrent logins)
CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);

-- Admin invitations (for adding new admins)
CREATE TABLE admin_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  role admin_role NOT NULL,
  invited_by UUID NOT NULL REFERENCES admin_users(id),
  invitation_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  is_used BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_admin_invitations_email ON admin_invitations(email);
CREATE INDEX idx_admin_invitations_token ON admin_invitations(invitation_token);

-- ============================================
-- PHASE 1.2: MODERATION & AUDIT TABLES
-- ============================================

-- Action types for audit logging
CREATE TYPE moderation_action_type AS ENUM (
  'ban_user',
  'unban_user',
  'suspend_user',
  'unsuspend_user',
  'verify_user',
  'unverify_user',
  'delete_photo',
  'approve_photo',
  'reject_photo',
  'resolve_report',
  'dismiss_report',
  'add_note',
  'send_warning',
  'delete_account',
  'grant_credits',
  'refund_payment',
  'approve_age_verification',
  'reject_age_verification',
  'update_subscription',
  'force_logout',
  'edit_profile',
  'other'
);

-- Audit log of all moderation actions
CREATE TABLE moderation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_id UUID NOT NULL REFERENCES admin_users(id),
  action_type moderation_action_type NOT NULL,
  target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- user being moderated
  target_content_id UUID, -- generic ID for photos or messages
  reason TEXT, -- reason provided by admin
  notes TEXT, -- additional admin notes
  metadata JSONB DEFAULT '{}'::JSONB, -- flexible data like duration and old/new values
  ip_address INET,
  result TEXT DEFAULT 'success' -- success, failed, partial
);

CREATE INDEX idx_moderation_actions_admin ON moderation_actions(admin_id);
CREATE INDEX idx_moderation_actions_user ON moderation_actions(target_user_id);
CREATE INDEX idx_moderation_actions_type ON moderation_actions(action_type);
CREATE INDEX idx_moderation_actions_created ON moderation_actions(created_at DESC);

-- Admin notes on users (private notes visible to admins only)
CREATE TABLE admin_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES admin_users(id),
  note TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT FALSE, -- highlight important notes
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_admin_notes_user ON admin_notes(user_id);
CREATE INDEX idx_admin_notes_admin ON admin_notes(admin_id);
CREATE INDEX idx_admin_notes_flagged ON admin_notes(is_flagged) WHERE is_flagged = TRUE;

-- User suspensions (temporary bans)
CREATE TABLE user_suspensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  suspended_by UUID NOT NULL REFERENCES admin_users(id),
  suspended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  lifted_at TIMESTAMP WITH TIME ZONE,
  lifted_by UUID REFERENCES admin_users(id),
  lift_reason TEXT
);

CREATE INDEX idx_user_suspensions_user ON user_suspensions(user_id);
CREATE INDEX idx_user_suspensions_active ON user_suspensions(is_active, expires_at);

-- Photo moderation queue
CREATE TYPE photo_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');

CREATE TABLE photo_moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES profile_photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status photo_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  ai_moderation_score NUMERIC(3,2), -- 0.00 to 1.00 from AWS Rekognition
  ai_flags TEXT[], -- array of detected issues like nudity or violence
  notes TEXT
);

CREATE INDEX idx_photo_moderation_status ON photo_moderation_queue(status);
CREATE INDEX idx_photo_moderation_user ON photo_moderation_queue(user_id);
CREATE INDEX idx_photo_moderation_submitted ON photo_moderation_queue(submitted_at);

-- ============================================
-- PHASE 1.3: PAYMENT & SUBSCRIPTION TABLES
-- ============================================

-- Subscription plan tiers
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10,2) NOT NULL,
  price_annual NUMERIC(10,2),
  stripe_price_id_monthly TEXT UNIQUE, -- Stripe Price ID
  stripe_price_id_annual TEXT UNIQUE,
  stripe_product_id TEXT UNIQUE, -- Stripe Product ID
  features JSONB NOT NULL DEFAULT '{}'::JSONB, -- JSON array of feature flags
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (name, description, price_monthly, price_annual, features, display_order) VALUES
('Free', 'Basic features', 0.00, 0.00, '{"unlimited_messages": false, "who_viewed_me": false, "advanced_filters": false, "no_ads": false, "read_receipts": false, "priority_visibility": false}'::JSONB, 1),
('Premium', 'Unlock all features', 9.99, 79.99, '{"unlimited_messages": true, "who_viewed_me": true, "advanced_filters": true, "no_ads": true, "read_receipts": true, "priority_visibility": true}'::JSONB, 2);

-- User subscriptions
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid', 'expired', 'trialing');

CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_subscription_id TEXT UNIQUE, -- Stripe Subscription ID
  stripe_customer_id TEXT, -- Stripe Customer ID
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_stripe ON user_subscriptions(stripe_subscription_id);

-- Payment transactions
CREATE TYPE transaction_type AS ENUM ('subscription', 'one_time', 'refund', 'credit');
CREATE TYPE transaction_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');

CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  type transaction_type NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_created ON payment_transactions(created_at DESC);

-- Credits ledger (for manual credits, refunds, promotions)
CREATE TYPE credit_reason AS ENUM ('admin_grant', 'refund', 'promotion', 'compensation', 'gift', 'other');

CREATE TABLE credits_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admin_users(id), -- null if automated
  amount NUMERIC(10,2) NOT NULL, -- can be negative for deductions
  balance_after NUMERIC(10,2) NOT NULL,
  reason credit_reason NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_credits_ledger_user ON credits_ledger(user_id);
CREATE INDEX idx_credits_ledger_created ON credits_ledger(created_at DESC);

-- ============================================
-- PHASE 1.4: COMPLIANCE TABLES
-- ============================================

-- Age verification requests
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
CREATE TYPE verification_method AS ENUM ('document_upload', 'third_party', 'manual_review');

CREATE TABLE age_verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  method verification_method NOT NULL DEFAULT 'document_upload',
  status verification_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  document_url TEXT, -- Secure S3/Supabase storage URL
  document_type TEXT, -- 'drivers_license', 'passport', 'national_id'
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::JSONB -- store OCR data and third-party responses
);

CREATE INDEX idx_age_verification_user ON age_verification_requests(user_id);
CREATE INDEX idx_age_verification_status ON age_verification_requests(status);
CREATE INDEX idx_age_verification_submitted ON age_verification_requests(submitted_at);

-- GDPR data export requests
CREATE TYPE export_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'expired');

CREATE TABLE data_export_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status export_status NOT NULL DEFAULT 'pending',
  download_url TEXT, -- Signed URL to download zip file
  download_expires_at TIMESTAMP WITH TIME ZONE, -- URL expires after 7 days
  completed_at TIMESTAMP WITH TIME ZONE,
  file_size_bytes BIGINT,
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_data_export_user ON data_export_requests(user_id);
CREATE INDEX idx_data_export_status ON data_export_requests(status);

-- Account deletion requests (Right to be Forgotten)
CREATE TYPE deletion_status AS ENUM ('pending', 'scheduled', 'completed', 'canceled');

CREATE TABLE account_deletions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_for TIMESTAMP WITH TIME ZONE, -- Soft delete after 30 days, hard delete after 90
  status deletion_status NOT NULL DEFAULT 'pending',
  reason TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES admin_users(id), -- if admin forced deletion
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_account_deletions_user ON account_deletions(user_id);
CREATE INDEX idx_account_deletions_status ON account_deletions(status);
CREATE INDEX idx_account_deletions_scheduled ON account_deletions(scheduled_for);

-- Terms & Privacy Policy acceptance log
CREATE TABLE terms_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL, -- e.g., 'v1.0', 'v2.0'
  privacy_version TEXT NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_terms_acceptances_user ON terms_acceptances(user_id);
CREATE INDEX idx_terms_acceptances_version ON terms_acceptances(terms_version, privacy_version);

-- Content moderation flags (AI-detected issues)
CREATE TYPE content_type AS ENUM ('photo', 'profile', 'message', 'bio');
CREATE TYPE flag_type AS ENUM ('nudity', 'violence', 'hate_speech', 'spam', 'underage', 'drugs', 'weapons', 'other');
CREATE TYPE flag_status AS ENUM ('pending', 'reviewed', 'dismissed', 'actioned');

CREATE TABLE content_moderation_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL, -- generic ID like photo_id or message_id
  content_type content_type NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  flag_type flag_type NOT NULL,
  ai_confidence NUMERIC(3,2), -- 0.00 to 1.00
  ai_metadata JSONB DEFAULT '{}'::JSONB, -- raw AI response
  flagged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status flag_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT, -- deleted, warned, or dismissed
  notes TEXT
);

CREATE INDEX idx_content_flags_status ON content_moderation_flags(status);
CREATE INDEX idx_content_flags_user ON content_moderation_flags(user_id);
CREATE INDEX idx_content_flags_type ON content_moderation_flags(flag_type);
CREATE INDEX idx_content_flags_confidence ON content_moderation_flags(ai_confidence DESC);

-- ============================================
-- PHASE 1.5: ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE age_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_deletions ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation_flags ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is an active admin
CREATE OR REPLACE FUNCTION is_active_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current admin role
CREATE OR REPLACE FUNCTION get_admin_role() RETURNS admin_role AS $$
DECLARE
  user_role admin_role;
BEGIN
  SELECT role INTO user_role FROM admin_users WHERE id = auth.uid() AND is_active = TRUE;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin users: Admins can view all, only Super Admins can modify
CREATE POLICY "admins_can_view_all_admins" ON admin_users
  FOR SELECT USING (is_active_admin());

CREATE POLICY "super_admins_can_insert_admins" ON admin_users
  FOR INSERT WITH CHECK (get_admin_role() = 'super_admin');

CREATE POLICY "super_admins_can_update_admins" ON admin_users
  FOR UPDATE USING (get_admin_role() = 'super_admin');

CREATE POLICY "super_admins_can_delete_admins" ON admin_users
  FOR DELETE USING (get_admin_role() = 'super_admin');

-- Moderation actions: All admins can view and insert, append-only (no updates/deletes)
CREATE POLICY "admins_can_view_moderation_actions" ON moderation_actions
  FOR SELECT USING (is_active_admin());

CREATE POLICY "admins_can_log_actions" ON moderation_actions
  FOR INSERT WITH CHECK (is_active_admin() AND admin_id = auth.uid());

-- Photo moderation: All admins can view, Moderators+ can update
CREATE POLICY "admins_can_view_photo_queue" ON photo_moderation_queue
  FOR SELECT USING (is_active_admin());

CREATE POLICY "moderators_can_review_photos" ON photo_moderation_queue
  FOR UPDATE USING (
    is_active_admin() AND get_admin_role() IN ('moderator', 'admin', 'super_admin')
  );

-- User suspensions: Admins+ can manage
CREATE POLICY "admins_can_view_suspensions" ON user_suspensions
  FOR SELECT USING (is_active_admin());

CREATE POLICY "admins_can_create_suspensions" ON user_suspensions
  FOR INSERT WITH CHECK (
    is_active_admin() AND get_admin_role() IN ('admin', 'super_admin')
  );

CREATE POLICY "admins_can_update_suspensions" ON user_suspensions
  FOR UPDATE USING (
    is_active_admin() AND get_admin_role() IN ('admin', 'super_admin')
  );

-- Payment transactions: Super Admins only
CREATE POLICY "super_admins_can_view_payments" ON payment_transactions
  FOR SELECT USING (get_admin_role() = 'super_admin');

CREATE POLICY "super_admins_can_modify_payments" ON payment_transactions
  FOR ALL USING (get_admin_role() = 'super_admin');

-- Credits ledger: Super Admins only
CREATE POLICY "super_admins_can_manage_credits" ON credits_ledger
  FOR ALL USING (get_admin_role() = 'super_admin');

-- Age verification: Admins+ can review
CREATE POLICY "admins_can_view_age_verification" ON age_verification_requests
  FOR SELECT USING (is_active_admin());

CREATE POLICY "admins_can_update_age_verification" ON age_verification_requests
  FOR UPDATE USING (
    is_active_admin() AND get_admin_role() IN ('admin', 'super_admin')
  );

-- GDPR requests: Admins can view, Super Admins can manage
CREATE POLICY "admins_can_view_gdpr_requests" ON data_export_requests
  FOR SELECT USING (is_active_admin());

CREATE POLICY "super_admins_can_manage_gdpr" ON data_export_requests
  FOR ALL USING (get_admin_role() = 'super_admin');

-- Account deletions: Admins can view, Super Admins can manage
CREATE POLICY "admins_can_view_account_deletions" ON account_deletions
  FOR SELECT USING (is_active_admin());

CREATE POLICY "super_admins_can_manage_deletions" ON account_deletions
  FOR ALL USING (get_admin_role() = 'super_admin');

-- Content flags: Moderators+ can view and review
CREATE POLICY "moderators_can_view_content_flags" ON content_moderation_flags
  FOR SELECT USING (
    is_active_admin() AND get_admin_role() IN ('moderator', 'admin', 'super_admin')
  );

CREATE POLICY "moderators_can_update_content_flags" ON content_moderation_flags
  FOR UPDATE USING (
    is_active_admin() AND get_admin_role() IN ('moderator', 'admin', 'super_admin')
  );

-- ============================================
-- HELPER FUNCTIONS FOR COMMON OPERATIONS
-- ============================================

-- Function to ban a user (sets is_banned = true and logs action)
CREATE OR REPLACE FUNCTION ban_user(
  target_user_id UUID,
  ban_reason TEXT,
  admin_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  admin_id_val UUID;
BEGIN
  -- Get current admin
  admin_id_val := auth.uid();

  -- Check if admin has permission (admin or super_admin)
  IF get_admin_role() NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to ban users';
  END IF;

  -- Ban the user
  UPDATE profiles SET is_banned = TRUE WHERE id = target_user_id;

  -- Log the action
  INSERT INTO moderation_actions (admin_id, action_type, target_user_id, reason, notes)
  VALUES (admin_id_val, 'ban_user', target_user_id, ban_reason, admin_notes);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unban a user
CREATE OR REPLACE FUNCTION unban_user(
  target_user_id UUID,
  unban_reason TEXT,
  admin_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  admin_id_val UUID;
BEGIN
  admin_id_val := auth.uid();

  IF get_admin_role() NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to unban users';
  END IF;

  UPDATE profiles SET is_banned = FALSE WHERE id = target_user_id;

  INSERT INTO moderation_actions (admin_id, action_type, target_user_id, reason, notes)
  VALUES (admin_id_val, 'unban_user', target_user_id, unban_reason, admin_notes);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INITIAL DATA & TRIGGERS
-- ============================================

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_notes_updated_at BEFORE UPDATE ON admin_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Additional indexes for common queries
CREATE INDEX idx_moderation_actions_recent ON moderation_actions(created_at DESC, admin_id);
CREATE INDEX idx_photo_moderation_pending ON photo_moderation_queue(submitted_at) WHERE status = 'pending';
CREATE INDEX idx_user_subscriptions_active ON user_subscriptions(user_id, status) WHERE status = 'active';
CREATE INDEX idx_content_flags_pending ON content_moderation_flags(flagged_at DESC) WHERE status = 'pending';

-- ============================================
-- GRANTS (if needed)
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE admin_users IS 'Admin panel users with role-based permissions';
COMMENT ON TABLE moderation_actions IS 'Audit log of all admin/moderator actions (append-only)';
COMMENT ON TABLE user_subscriptions IS 'User premium subscriptions linked to Stripe';
COMMENT ON TABLE age_verification_requests IS 'Enhanced age verification for compliance';
COMMENT ON TABLE content_moderation_flags IS 'AI-detected content issues for manual review';

-- ============================================
-- END OF ADMIN SCHEMA
-- ============================================
