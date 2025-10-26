/**
 * useVerified Hook
 *
 * React hook for checking if the current user is age-verified.
 * Automatically updates when user's verification status changes.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isVerificationValid } from '../services/verification';

/**
 * Hook to check if current user is verified
 *
 * @returns Object with verification status and refresh function
 *
 * @example
 * const { isVerified, loading, refresh } = useVerified();
 * if (isVerified) {
 *   // Show verified-only content
 * }
 */
export const useVerified = () => {
  const { user, profile } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadVerificationStatus = useCallback(async () => {
    if (!user) {
      setIsVerified(false);
      setLoading(false);
      return;
    }

    try {
      // First check profile cache
      if (profile?.is_verified) {
        setIsVerified(true);
        setLoading(false);
        return;
      }

      // Then verify it's not expired
      const valid = await isVerificationValid(user.id);
      setIsVerified(valid);
    } catch (error) {
      console.error('Error checking verification status:', error);
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    loadVerificationStatus();
  }, [loadVerificationStatus]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await loadVerificationStatus();
  }, [loadVerificationStatus]);

  return { isVerified, loading, refresh };
};

/**
 * Hook to require verification for a feature
 * Shows alert if user is not verified
 *
 * @param featureName - Name of the feature requiring verification
 * @returns Object with check function
 *
 * @example
 * const { requireVerification } = useRequireVerification('explicit content');
 * const canAccess = requireVerification();
 * if (canAccess) {
 *   // Show content
 * }
 */
export const useRequireVerification = (featureName: string = 'this feature') => {
  const { isVerified, loading } = useVerified();

  const requireVerification = useCallback(
    (
      onVerified?: () => void,
      onNotVerified?: () => void
    ): boolean => {
      if (loading) return false;

      if (isVerified) {
        onVerified?.();
        return true;
      }

      onNotVerified?.();
      return false;
    },
    [isVerified, loading]
  );

  return { requireVerification, isVerified, loading };
};
