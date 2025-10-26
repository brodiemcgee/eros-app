-- ============================================================================
-- AGE VERIFICATION SYSTEM MIGRATION
-- Supports Stripe Identity and other third-party verification providers
-- ============================================================================

-- ============================================================================
-- 1. UPDATE AGE_VERIFICATION_REQUESTS TABLE
-- Add support for third-party verification providers
-- ============================================================================

-- Add columns for third-party verification
ALTER TABLE age_verification_requests
  ADD COLUMN IF NOT EXISTS verification_session_id TEXT,
  ADD COLUMN IF NOT EXISTS verification_provider TEXT DEFAULT 'stripe_identity',
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add index for faster lookups by session ID
CREATE INDEX IF NOT EXISTS idx_age_verification_session
  ON age_verification_requests(verification_session_id);

-- Add check constraint for valid providers
ALTER TABLE age_verification_requests
  DROP CONSTRAINT IF EXISTS valid_verification_provider;

ALTER TABLE age_verification_requests
  ADD CONSTRAINT valid_verification_provider
  CHECK (verification_provider IN ('stripe_identity', 'persona', 'manual', 'document_upload'));

COMMENT ON COLUMN age_verification_requests.verification_session_id IS 'Session ID from verification provider (e.g., Stripe Identity session)';
COMMENT ON COLUMN age_verification_requests.verification_provider IS 'Provider used: stripe_identity, persona, manual, document_upload';
COMMENT ON COLUMN age_verification_requests.completed_at IS 'When verification was completed';
COMMENT ON COLUMN age_verification_requests.expires_at IS 'When verification expires (optional, e.g., after 2 years)';

-- ============================================================================
-- 2. UPDATE PROFILES TABLE
-- Add verification timestamp and expiry tracking
-- ============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;

-- Create index for querying verified profiles
CREATE INDEX IF NOT EXISTS idx_profiles_verified
  ON profiles(is_verified, verified_at)
  WHERE is_verified = TRUE;

COMMENT ON COLUMN profiles.verified_at IS 'Timestamp when user was verified';
COMMENT ON COLUMN profiles.verification_expires_at IS 'When verification expires (optional re-verification)';

-- ============================================================================
-- 3. HELPER FUNCTION: Check if user verification is valid
-- ============================================================================

CREATE OR REPLACE FUNCTION is_verification_valid(
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_verified BOOLEAN;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Get verification status
  SELECT is_verified, verification_expires_at
  INTO v_is_verified, v_expires_at
  FROM profiles
  WHERE id = p_user_id;

  -- Not verified
  IF NOT v_is_verified THEN
    RETURN FALSE;
  END IF;

  -- No expiry date means verification is permanent
  IF v_expires_at IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check if verification has expired
  RETURN v_expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_verification_valid IS 'Checks if user has valid (non-expired) age verification';

-- ============================================================================
-- 4. HELPER FUNCTION: Get user verification status
-- ============================================================================

CREATE OR REPLACE FUNCTION get_verification_status(
  p_user_id UUID
) RETURNS TABLE(
  is_verified BOOLEAN,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_expired BOOLEAN,
  latest_request_status verification_status,
  latest_request_method verification_method,
  provider TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.is_verified,
    p.verified_at,
    p.verification_expires_at,
    CASE
      WHEN p.verification_expires_at IS NOT NULL AND p.verification_expires_at < NOW() THEN TRUE
      ELSE FALSE
    END as is_expired,
    avr.status,
    avr.method,
    avr.verification_provider
  FROM profiles p
  LEFT JOIN LATERAL (
    SELECT status, method, verification_provider
    FROM age_verification_requests
    WHERE user_id = p_user_id
    ORDER BY submitted_at DESC
    LIMIT 1
  ) avr ON TRUE
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_verification_status IS 'Returns complete verification status for a user';

-- ============================================================================
-- 5. HELPER FUNCTION: Mark user as verified
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_user_verified(
  p_user_id UUID,
  p_verification_request_id UUID,
  p_expires_in_days INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Calculate expiry date if specified
  IF p_expires_in_days IS NOT NULL THEN
    v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;
  ELSE
    v_expires_at := NULL; -- No expiry
  END IF;

  -- Update profile
  UPDATE profiles
  SET
    is_verified = TRUE,
    verified_at = NOW(),
    verification_expires_at = v_expires_at,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Update verification request
  UPDATE age_verification_requests
  SET
    status = 'approved',
    completed_at = NOW(),
    expires_at = v_expires_at,
    reviewed_at = NOW()
  WHERE id = p_verification_request_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_user_verified IS 'Marks a user as verified and updates their verification request';

-- ============================================================================
-- 6. HELPER FUNCTION: Revoke verification
-- ============================================================================

CREATE OR REPLACE FUNCTION revoke_user_verification(
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Update profile
  UPDATE profiles
  SET
    is_verified = FALSE,
    verified_at = NULL,
    verification_expires_at = NULL,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Update latest verification request
  UPDATE age_verification_requests
  SET
    status = 'rejected',
    rejection_reason = p_reason,
    reviewed_at = NOW()
  WHERE id IN (
    SELECT id
    FROM age_verification_requests
    WHERE user_id = p_user_id
    AND status = 'approved'
    ORDER BY reviewed_at DESC
    LIMIT 1
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION revoke_user_verification IS 'Revokes a user verification (admin action)';

-- ============================================================================
-- 7. ANALYTICS VIEW: Verification Statistics
-- ============================================================================

CREATE OR REPLACE VIEW verification_stats AS
SELECT
  COUNT(DISTINCT CASE WHEN p.is_verified THEN p.id END) as verified_users,
  COUNT(DISTINCT p.id) as total_users,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN p.is_verified THEN p.id END) /
    NULLIF(COUNT(DISTINCT p.id), 0),
    2
  ) as verification_rate_percent,
  COUNT(CASE WHEN avr.status = 'pending' THEN 1 END) as pending_requests,
  COUNT(CASE WHEN avr.status = 'approved' THEN 1 END) as approved_requests,
  COUNT(CASE WHEN avr.status = 'rejected' THEN 1 END) as rejected_requests,
  COUNT(CASE WHEN avr.verification_provider = 'stripe_identity' THEN 1 END) as stripe_verifications,
  COUNT(CASE WHEN avr.verification_provider = 'manual' THEN 1 END) as manual_verifications
FROM profiles p
LEFT JOIN age_verification_requests avr ON avr.user_id = p.id;

COMMENT ON VIEW verification_stats IS 'Real-time statistics on age verification';

-- ============================================================================
-- 8. SEED FEATURE: verified_badge
-- Add verified badge as a feature that doesn't need to be assigned
-- ============================================================================

-- Insert verified_badge feature if it doesn't exist
INSERT INTO features (feature_key, name, description, category, is_active)
VALUES (
  'verified_badge',
  'Verified Badge',
  'Display verified checkmark on profile',
  'profile',
  true
)
ON CONFLICT (feature_key) DO NOTHING;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
