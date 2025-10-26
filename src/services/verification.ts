/**
 * Age Verification Service
 *
 * Handles Stripe Identity age verification integration
 */

import { supabase } from './supabase';

export interface VerificationStatus {
  is_verified: boolean;
  verified_at: string | null;
  expires_at: string | null;
  is_expired: boolean;
  latest_request_status: 'pending' | 'approved' | 'rejected' | 'expired' | null;
  latest_request_method: 'document_upload' | 'third_party' | 'manual_review' | null;
  provider: string | null;
}

/**
 * Create a new age verification session
 * Returns the client_secret needed for Stripe Identity
 */
export const createVerificationSession = async (): Promise<{
  client_secret: string;
  session_id: string;
  verification_request_id: string;
}> => {
  const { data, error } = await supabase.functions.invoke('create-verification-session', {
    method: 'POST',
  });

  if (error) {
    console.error('Error creating verification session:', error);
    throw new Error(error.message || 'Failed to create verification session');
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to create verification session');
  }

  return {
    client_secret: data.client_secret,
    session_id: data.session_id,
    verification_request_id: data.verification_request_id,
  };
};

/**
 * Check the current verification status for the logged-in user
 */
export const checkVerificationStatus = async (): Promise<VerificationStatus> => {
  const { data, error } = await supabase.functions.invoke('check-verification-status', {
    method: 'POST',
  });

  if (error) {
    console.error('Error checking verification status:', error);
    throw new Error(error.message || 'Failed to check verification status');
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to check verification status');
  }

  return data.verification;
};

/**
 * Get verification status directly from profile (simpler, cached)
 */
export const getProfileVerificationStatus = async (userId: string): Promise<{
  is_verified: boolean;
  verified_at: string | null;
}> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_verified, verified_at')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error getting profile verification:', error);
    return { is_verified: false, verified_at: null };
  }

  return {
    is_verified: data?.is_verified || false,
    verified_at: data?.verified_at || null,
  };
};

/**
 * Check if user has valid (non-expired) verification
 */
export const isVerificationValid = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('is_verification_valid', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error checking verification validity:', error);
    return false;
  }

  return data === true;
};
