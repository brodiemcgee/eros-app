// Supabase client configuration

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV, validateEnv } from '../config/env';
import { Database } from '../types/database';

// Validate environment variables
validateEnv();

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient<Database>(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Helper function to get the current user's profile
export const getCurrentUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, photos:profile_photos(*)')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return profile;
};

// Helper function to upload file to storage
export const uploadFile = async (
  bucket: 'profile-photos' | 'album-photos' | 'chat-media',
  path: string,
  file: Blob | File
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
};

// Helper function to delete file from storage
export const deleteFile = async (
  bucket: 'profile-photos' | 'album-photos' | 'chat-media',
  path: string
) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw error;
  }
};
