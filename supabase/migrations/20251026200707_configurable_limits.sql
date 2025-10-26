-- ============================================================================
-- CONFIGURABLE LIMITS MIGRATION
-- Makes all free tier limits editable by admins per subscription plan
-- ============================================================================

-- ============================================================================
-- 1. UPDATE PLAN_FEATURES TO INCLUDE LIMIT VALUES
-- The plan_features.value JSONB column will now store limit configurations
-- ============================================================================

-- Example value structure:
-- {
--   "enabled": true,
--   "limits": {
--     "max_messages_per_day": 50,
--     "max_taps_per_day": 10,
--     "max_favorites": 25,
--     "max_photos": 6,
--     "max_distance_km": 50
--   }
-- }

COMMENT ON COLUMN plan_features.value IS 'Feature configuration including limits. Format: {"enabled": true, "limits": {"max_messages_per_day": 50, ...}}';

-- ============================================================================
-- 2. CREATE FUNCTION TO GET USER FEATURE LIMITS
-- Returns the limit values for a specific feature and user
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_feature_limits(
  p_user_id UUID,
  p_feature_key TEXT
) RETURNS JSONB AS $$
DECLARE
  v_limits JSONB := '{}'::JSONB;
  v_active_subscription UUID;
  v_feature_id UUID;
  v_has_premium_override BOOLEAN;
BEGIN
  -- Get feature ID
  SELECT id INTO v_feature_id
  FROM features
  WHERE feature_key = p_feature_key AND is_active = true;

  IF v_feature_id IS NULL THEN
    RETURN v_limits;
  END IF;

  -- Check for premium override (unlimited)
  SELECT EXISTS(
    SELECT 1
    FROM user_premium_overrides
    WHERE user_id = p_user_id
    AND override_type IN ('full_premium', 'promo')
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO v_has_premium_override;

  -- If user has premium override, return unlimited (null limits)
  IF v_has_premium_override THEN
    RETURN NULL;
  END IF;

  -- Check for specific feature override
  SELECT (metadata->'limits')
  INTO v_limits
  FROM user_premium_overrides
  WHERE user_id = p_user_id
  AND override_type = 'specific_feature'
  AND (metadata->>'feature_id')::UUID = v_feature_id
  AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  IF v_limits IS NOT NULL AND v_limits != '{}'::JSONB THEN
    RETURN v_limits;
  END IF;

  -- Get limits from active subscription plan
  SELECT us.subscription_plan_id INTO v_active_subscription
  FROM user_subscriptions us
  WHERE us.user_id = p_user_id
  AND us.status = 'active'
  AND us.end_date > NOW()
  ORDER BY us.end_date DESC
  LIMIT 1;

  IF v_active_subscription IS NOT NULL THEN
    SELECT pf.value->'limits'
    INTO v_limits
    FROM plan_features pf
    WHERE pf.subscription_plan_id = v_active_subscription
    AND pf.feature_id = v_feature_id
    AND (pf.value->>'enabled')::boolean = true;
  END IF;

  RETURN v_limits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_feature_limits IS 'Returns limit configuration for a user and feature. NULL means unlimited (premium), {} means feature disabled.';

-- ============================================================================
-- 3. SEED DEFAULT LIMITS FOR FREE TIER
-- Apply default limits to the Free plan
-- ============================================================================

DO $$
DECLARE
  v_free_plan_id UUID;
  v_feature_unlimited_messages UUID;
  v_feature_unlimited_taps UUID;
  v_feature_unlimited_favorites UUID;
  v_feature_unlimited_photos UUID;
  v_feature_extended_distance UUID;
BEGIN
  -- Get Free plan ID
  SELECT id INTO v_free_plan_id
  FROM subscription_plans
  WHERE name = 'Free'
  LIMIT 1;

  IF v_free_plan_id IS NULL THEN
    RAISE NOTICE 'Free plan not found, skipping limit configuration';
    RETURN;
  END IF;

  -- Get feature IDs
  SELECT id INTO v_feature_unlimited_messages FROM features WHERE feature_key = 'unlimited_messages';
  SELECT id INTO v_feature_unlimited_taps FROM features WHERE feature_key = 'unlimited_taps';
  SELECT id INTO v_feature_unlimited_favorites FROM features WHERE feature_key = 'unlimited_favorites';
  SELECT id INTO v_feature_unlimited_photos FROM features WHERE feature_key = 'unlimited_photos';
  SELECT id INTO v_feature_extended_distance FROM features WHERE feature_key = 'extended_distance';

  -- Configure messaging limits (50 messages per day)
  IF v_feature_unlimited_messages IS NOT NULL THEN
    INSERT INTO plan_features (subscription_plan_id, feature_id, value)
    VALUES (
      v_free_plan_id,
      v_feature_unlimited_messages,
      '{"enabled": false, "limits": {"max_messages_per_day": 50}}'::JSONB
    )
    ON CONFLICT (subscription_plan_id, feature_id)
    DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Configure taps limits (10 taps per day)
  IF v_feature_unlimited_taps IS NOT NULL THEN
    INSERT INTO plan_features (subscription_plan_id, feature_id, value)
    VALUES (
      v_free_plan_id,
      v_feature_unlimited_taps,
      '{"enabled": false, "limits": {"max_taps_per_day": 10}}'::JSONB
    )
    ON CONFLICT (subscription_plan_id, feature_id)
    DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Configure favorites limits (25 total favorites)
  IF v_feature_unlimited_favorites IS NOT NULL THEN
    INSERT INTO plan_features (subscription_plan_id, feature_id, value)
    VALUES (
      v_free_plan_id,
      v_feature_unlimited_favorites,
      '{"enabled": false, "limits": {"max_favorites": 25}}'::JSONB
    )
    ON CONFLICT (subscription_plan_id, feature_id)
    DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Configure photo limits (6 photos total)
  IF v_feature_unlimited_photos IS NOT NULL THEN
    INSERT INTO plan_features (subscription_plan_id, feature_id, value)
    VALUES (
      v_free_plan_id,
      v_feature_unlimited_photos,
      '{"enabled": false, "limits": {"max_photos": 6}}'::JSONB
    )
    ON CONFLICT (subscription_plan_id, feature_id)
    DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Configure distance limits (50km max)
  IF v_feature_extended_distance IS NOT NULL THEN
    INSERT INTO plan_features (subscription_plan_id, feature_id, value)
    VALUES (
      v_free_plan_id,
      v_feature_extended_distance,
      '{"enabled": false, "limits": {"max_distance_km": 50}}'::JSONB
    )
    ON CONFLICT (subscription_plan_id, feature_id)
    DO UPDATE SET value = EXCLUDED.value;
  END IF;

  RAISE NOTICE 'Free tier limits configured successfully';
END $$;

-- ============================================================================
-- 4. CONFIGURE PREMIUM PLANS (NO LIMITS)
-- Premium plans get unlimited everything (limits = null)
-- ============================================================================

DO $$
DECLARE
  v_plan_record RECORD;
  v_feature_record RECORD;
BEGIN
  -- For all non-Free plans, set unlimited (no limits) for limit-based features
  FOR v_plan_record IN
    SELECT id, name FROM subscription_plans WHERE name != 'Free' AND is_active = true
  LOOP
    -- Set unlimited for all limit-based features
    FOR v_feature_record IN
      SELECT id FROM features
      WHERE feature_key IN (
        'unlimited_messages',
        'unlimited_taps',
        'unlimited_favorites',
        'unlimited_photos',
        'extended_distance'
      )
    LOOP
      INSERT INTO plan_features (subscription_plan_id, feature_id, value)
      VALUES (
        v_plan_record.id,
        v_feature_record.id,
        '{"enabled": true}'::JSONB  -- No limits key means unlimited
      )
      ON CONFLICT (subscription_plan_id, feature_id)
      DO UPDATE SET value = EXCLUDED.value;
    END LOOP;

    RAISE NOTICE 'Configured unlimited limits for plan: %', v_plan_record.name;
  END LOOP;
END $$;

-- ============================================================================
-- 5. CREATE HELPER FUNCTION TO GET ALL LIMITS FOR A USER
-- Returns all limit values across all features for a user
-- ============================================================================

CREATE OR REPLACE FUNCTION get_all_user_limits(p_user_id UUID)
RETURNS TABLE(
  feature_key TEXT,
  feature_name TEXT,
  limits JSONB,
  is_unlimited BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.feature_key,
    f.name as feature_name,
    get_user_feature_limits(p_user_id, f.feature_key) as limits,
    CASE
      WHEN get_user_feature_limits(p_user_id, f.feature_key) IS NULL THEN true
      ELSE false
    END as is_unlimited
  FROM features f
  WHERE f.feature_key IN (
    'unlimited_messages',
    'unlimited_taps',
    'unlimited_favorites',
    'unlimited_photos',
    'extended_distance'
  )
  AND f.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_all_user_limits IS 'Returns all limit configurations for a user across all limit-based features';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
