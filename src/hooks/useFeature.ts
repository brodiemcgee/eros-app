/**
 * useFeature Hook
 *
 * React hook for checking if the current user has access to a specific feature.
 * Automatically updates when user's premium status or features change.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FeatureKey } from '../constants/features';
import {
  checkUserFeature,
  getUserFeatures,
  UserFeature,
  clearFeatureCache,
  getFeatureLimits,
  getAllUserLimits,
  getSpecificLimit,
  FeatureLimits,
  UserLimits,
} from '../services/features';

/**
 * Hook to check if current user has a specific feature
 *
 * @param featureKey - The feature key to check
 * @returns boolean - True if user has access to the feature
 *
 * @example
 * const hasWhoViewedMe = useFeature('who_viewed_me');
 * if (hasWhoViewedMe) {
 *   // Show who viewed me content
 * }
 */
export const useFeature = (featureKey: FeatureKey): boolean => {
  const { user } = useAuth();
  const [hasFeature, setHasFeature] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeature = async () => {
      if (!user) {
        setHasFeature(false);
        setLoading(false);
        return;
      }

      try {
        const result = await checkUserFeature(user.id, featureKey);
        setHasFeature(result);
      } catch (error) {
        console.error('Error checking feature:', error);
        setHasFeature(false);
      } finally {
        setLoading(false);
      }
    };

    loadFeature();
  }, [user, featureKey]);

  return hasFeature;
};

/**
 * Hook to get all features for the current user
 *
 * @returns Object with features array and loading state
 *
 * @example
 * const { features, loading, refresh } = useFeatures();
 */
export const useFeatures = () => {
  const { user } = useAuth();
  const [features, setFeatures] = useState<UserFeature[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeatures = useCallback(async () => {
    if (!user) {
      setFeatures([]);
      setLoading(false);
      return;
    }

    try {
      const userFeatures = await getUserFeatures(user.id);
      setFeatures(userFeatures);
    } catch (error) {
      console.error('Error loading features:', error);
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

  const refresh = useCallback(async () => {
    if (user) {
      clearFeatureCache(user.id);
      await loadFeatures();
    }
  }, [user, loadFeatures]);

  return { features, loading, refresh };
};

/**
 * Hook to check if user has any of the specified features
 *
 * @param featureKeys - Array of feature keys to check
 * @returns boolean - True if user has at least one of the features
 *
 * @example
 * const hasAnyMessagingFeature = useAnyFeature([
 *   'unlimited_messages',
 *   'read_receipts',
 *   'typing_indicators'
 * ]);
 */
export const useAnyFeature = (featureKeys: FeatureKey[]): boolean => {
  const { features } = useFeatures();
  const userFeatureKeys = new Set(features.map((f) => f.feature_key));

  return featureKeys.some((key) => userFeatureKeys.has(key));
};

/**
 * Hook to check if user has all of the specified features
 *
 * @param featureKeys - Array of feature keys to check
 * @returns boolean - True if user has all of the features
 *
 * @example
 * const hasAllPrivacyFeatures = useAllFeatures([
 *   'hide_distance',
 *   'hide_age',
 *   'incognito_mode'
 * ]);
 */
export const useAllFeatures = (featureKeys: FeatureKey[]): boolean => {
  const { features } = useFeatures();
  const userFeatureKeys = new Set(features.map((f) => f.feature_key));

  return featureKeys.every((key) => userFeatureKeys.has(key));
};

/**
 * Hook to check if user is on free tier (no premium features)
 *
 * @returns boolean - True if user has no premium features
 *
 * @example
 * const isFreeTier = useIsFreeTier();
 * if (isFreeTier) {
 *   // Show upgrade prompt
 * }
 */
export const useIsFreeTier = (): boolean => {
  const { features, loading } = useFeatures();

  if (loading) return true; // Default to free tier while loading

  return features.length === 0;
};

/**
 * Hook to get features grouped by category
 *
 * @returns Object with features grouped by category
 *
 * @example
 * const featuresByCategory = useFeaturesByCategory();
 * const messagingFeatures = featuresByCategory.messaging || [];
 */
export const useFeaturesByCategory = (): Record<string, UserFeature[]> => {
  const { features } = useFeatures();

  return features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, UserFeature[]>);
};

/**
 * Hook to get feature limits for a specific feature
 *
 * @param featureKey - The feature key to get limits for
 * @returns Object with limits and loading state (null = unlimited, object = limited)
 *
 * @example
 * const { limits, loading } = useFeatureLimits('unlimited_messages');
 * if (!loading && limits) {
 *   console.log('Max messages per day:', limits.max_messages_per_day);
 * }
 * if (!loading && limits === null) {
 *   console.log('Unlimited messages!');
 * }
 */
export const useFeatureLimits = (featureKey: FeatureKey) => {
  const { user } = useAuth();
  const [limits, setLimits] = useState<FeatureLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLimits = async () => {
      if (!user) {
        setLimits(null);
        setLoading(false);
        return;
      }

      try {
        const result = await getFeatureLimits(user.id, featureKey);
        setLimits(result);
      } catch (error) {
        console.error('Error loading feature limits:', error);
        setLimits(null); // Default to unlimited on error
      } finally {
        setLoading(false);
      }
    };

    loadLimits();
  }, [user, featureKey]);

  return { limits, loading };
};

/**
 * Hook to get all feature limits for the current user
 *
 * @returns Object with all limits and loading state
 *
 * @example
 * const { limits, loading } = useAllLimits();
 * limits.forEach(limit => {
 *   console.log(`${limit.feature_name}: ${limit.is_unlimited ? 'Unlimited' : JSON.stringify(limit.limits)}`);
 * });
 */
export const useAllLimits = () => {
  const { user } = useAuth();
  const [limits, setLimits] = useState<UserLimits[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLimits = async () => {
      if (!user) {
        setLimits([]);
        setLoading(false);
        return;
      }

      try {
        const result = await getAllUserLimits(user.id);
        setLimits(result);
      } catch (error) {
        console.error('Error loading all limits:', error);
        setLimits([]);
      } finally {
        setLoading(false);
      }
    };

    loadLimits();
  }, [user]);

  return { limits, loading };
};

/**
 * Hook to get a specific limit value
 *
 * @param featureKey - The feature key to get limit for
 * @param limitKey - The specific limit to retrieve (e.g., 'max_messages_per_day')
 * @returns number | null - The limit value or null if unlimited
 *
 * @example
 * const maxMessages = useSpecificLimit('unlimited_messages', 'max_messages_per_day');
 * if (maxMessages === null) {
 *   console.log('Unlimited messages!');
 * } else {
 *   console.log(`Can send ${maxMessages} messages per day`);
 * }
 */
export const useSpecificLimit = (
  featureKey: FeatureKey,
  limitKey: keyof FeatureLimits
): number | null => {
  const { user } = useAuth();
  const [limit, setLimit] = useState<number | null>(null);

  useEffect(() => {
    const loadLimit = async () => {
      if (!user) {
        setLimit(null);
        return;
      }

      try {
        const result = await getSpecificLimit(user.id, featureKey, limitKey);
        setLimit(result);
      } catch (error) {
        console.error('Error loading specific limit:', error);
        setLimit(null); // Default to unlimited on error
      }
    };

    loadLimit();
  }, [user, featureKey, limitKey]);

  return limit;
};
