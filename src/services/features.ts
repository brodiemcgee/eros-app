/**
 * Feature Service
 *
 * Handles feature access checks and feature retrieval from the database.
 * Integrates with the database functions: user_has_feature() and get_user_features()
 */

import { supabase } from './supabase';
import { FeatureKey } from '../constants/features';

// Type for user feature from database
export interface UserFeature {
  feature_key: FeatureKey;
  feature_name: string;
  category: string;
  source: 'admin_override' | 'feature_grant' | 'subscription' | 'free';
  config: {
    enabled: boolean;
    [key: string]: any;
  };
}

// Type for feature limits
export interface FeatureLimits {
  max_messages_per_day?: number;
  max_taps_per_day?: number;
  max_favorites?: number;
  max_photos?: number;
  max_distance_km?: number;
}

// Type for all user limits
export interface UserLimits {
  feature_key: FeatureKey;
  feature_name: string;
  limits: FeatureLimits | null; // null means unlimited (premium)
  is_unlimited: boolean;
}

// In-memory cache for user features (expires after 5 minutes)
interface FeatureCache {
  features: Set<FeatureKey>;
  timestamp: number;
  allFeatures: UserFeature[];
}

const featureCache = new Map<string, FeatureCache>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Clear the feature cache for a user
 */
export const clearFeatureCache = (userId: string): void => {
  featureCache.delete(userId);
};

/**
 * Clear all feature caches
 */
export const clearAllFeatureCaches = (): void => {
  featureCache.clear();
};

/**
 * Check if user has a specific feature
 * Uses database function: user_has_feature(user_id, feature_key)
 *
 * @param userId - User ID to check
 * @param featureKey - Feature key to check
 * @returns Promise<boolean> - True if user has access to the feature
 */
export const checkUserFeature = async (
  userId: string,
  featureKey: FeatureKey
): Promise<boolean> => {
  try {
    // Check cache first
    const cached = featureCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      return cached.features.has(featureKey);
    }

    // Call database function
    const { data, error } = await supabase.rpc('user_has_feature', {
      p_user_id: userId,
      p_feature_key: featureKey,
    });

    if (error) {
      console.error('Error checking user feature:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in checkUserFeature:', error);
    return false;
  }
};

/**
 * Get all features for a user
 * Uses database function: get_user_features(user_id)
 *
 * @param userId - User ID to get features for
 * @returns Promise<UserFeature[]> - Array of features the user has access to
 */
export const getUserFeatures = async (userId: string): Promise<UserFeature[]> => {
  try {
    // Check cache first
    const cached = featureCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      return cached.allFeatures;
    }

    // Call database function
    const { data, error } = await supabase.rpc('get_user_features', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error getting user features:', error);
      return [];
    }

    const features = (data || []) as UserFeature[];

    // Update cache
    const featureKeys = new Set(features.map((f) => f.feature_key));
    featureCache.set(userId, {
      features: featureKeys,
      timestamp: Date.now(),
      allFeatures: features,
    });

    return features;
  } catch (error) {
    console.error('Error in getUserFeatures:', error);
    return [];
  }
};

/**
 * Check if user has any of the specified features
 *
 * @param userId - User ID to check
 * @param featureKeys - Array of feature keys to check
 * @returns Promise<boolean> - True if user has at least one of the features
 */
export const hasAnyFeature = async (
  userId: string,
  featureKeys: FeatureKey[]
): Promise<boolean> => {
  try {
    const features = await getUserFeatures(userId);
    const userFeatureKeys = new Set(features.map((f) => f.feature_key));

    return featureKeys.some((key) => userFeatureKeys.has(key));
  } catch (error) {
    console.error('Error in hasAnyFeature:', error);
    return false;
  }
};

/**
 * Check if user has all of the specified features
 *
 * @param userId - User ID to check
 * @param featureKeys - Array of feature keys to check
 * @returns Promise<boolean> - True if user has all of the features
 */
export const hasAllFeatures = async (
  userId: string,
  featureKeys: FeatureKey[]
): Promise<boolean> => {
  try {
    const features = await getUserFeatures(userId);
    const userFeatureKeys = new Set(features.map((f) => f.feature_key));

    return featureKeys.every((key) => userFeatureKeys.has(key));
  } catch (error) {
    console.error('Error in hasAllFeatures:', error);
    return false;
  }
};

/**
 * Get features grouped by category
 *
 * @param userId - User ID to get features for
 * @returns Promise<Record<string, UserFeature[]>> - Features grouped by category
 */
export const getUserFeaturesByCategory = async (
  userId: string
): Promise<Record<string, UserFeature[]>> => {
  try {
    const features = await getUserFeatures(userId);

    return features.reduce((acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = [];
      }
      acc[feature.category].push(feature);
      return acc;
    }, {} as Record<string, UserFeature[]>);
  } catch (error) {
    console.error('Error in getUserFeaturesByCategory:', error);
    return {};
  }
};

/**
 * Prefetch and cache user features
 * Call this when user logs in or premium status changes
 *
 * @param userId - User ID to prefetch features for
 */
export const prefetchUserFeatures = async (userId: string): Promise<void> => {
  try {
    await getUserFeatures(userId);
  } catch (error) {
    console.error('Error prefetching user features:', error);
  }
};

/**
 * Check if user is on free tier (has no premium features)
 *
 * @param userId - User ID to check
 * @returns Promise<boolean> - True if user has no premium features
 */
export const isFreeTier = async (userId: string): Promise<boolean> => {
  try {
    const features = await getUserFeatures(userId);
    return features.length === 0;
  } catch (error) {
    console.error('Error in isFreeTier:', error);
    return true;
  }
};

/**
 * Get feature limits for a specific feature
 * Uses database function: get_user_feature_limits(user_id, feature_key)
 *
 * @param userId - User ID to check
 * @param featureKey - Feature key to get limits for
 * @returns Promise<FeatureLimits | null> - Limits object or null if unlimited
 */
export const getFeatureLimits = async (
  userId: string,
  featureKey: FeatureKey
): Promise<FeatureLimits | null> => {
  try {
    const { data, error } = await supabase.rpc('get_user_feature_limits', {
      p_user_id: userId,
      p_feature_key: featureKey,
    });

    if (error) {
      console.error('Error getting feature limits:', error);
      return null; // Default to unlimited on error (safe default)
    }

    // null means unlimited (premium)
    // {} means no access
    // {max_x: number} means limited
    return data as FeatureLimits | null;
  } catch (error) {
    console.error('Error in getFeatureLimits:', error);
    return null; // Default to unlimited on error
  }
};

/**
 * Get all feature limits for a user
 * Uses database function: get_all_user_limits(user_id)
 *
 * @param userId - User ID to get all limits for
 * @returns Promise<UserLimits[]> - Array of all feature limits
 */
export const getAllUserLimits = async (userId: string): Promise<UserLimits[]> => {
  try {
    const { data, error } = await supabase.rpc('get_all_user_limits', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error getting all user limits:', error);
      return [];
    }

    return (data || []) as UserLimits[];
  } catch (error) {
    console.error('Error in getAllUserLimits:', error);
    return [];
  }
};

/**
 * Get a specific limit value for a feature
 *
 * @param userId - User ID to check
 * @param featureKey - Feature key to get limit for
 * @param limitKey - Specific limit key (e.g., 'max_messages_per_day')
 * @returns Promise<number | null> - Limit value or null if unlimited
 */
export const getSpecificLimit = async (
  userId: string,
  featureKey: FeatureKey,
  limitKey: keyof FeatureLimits
): Promise<number | null> => {
  try {
    const limits = await getFeatureLimits(userId, featureKey);

    // null means unlimited (premium)
    if (limits === null) {
      return null;
    }

    // Return the specific limit value, or null if not set
    return limits[limitKey] ?? null;
  } catch (error) {
    console.error('Error in getSpecificLimit:', error);
    return null; // Default to unlimited on error
  }
};
