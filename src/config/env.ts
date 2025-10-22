// Environment configuration
// Make sure to create a .env file with your Supabase credentials

import Constants from 'expo-constants';

// Get environment variables from expo-constants (works for all platforms including web)
const getEnvVar = (key: string, fallback: string = ''): string => {
  // Try expo-constants first (works for web builds on Vercel)
  const expoConfig = Constants.expoConfig?.extra;
  if (expoConfig) {
    switch (key) {
      case 'SUPABASE_URL':
        return expoConfig.supabaseUrl || fallback;
      case 'SUPABASE_ANON_KEY':
        return expoConfig.supabaseAnonKey || fallback;
      case 'GOOGLE_MAPS_API_KEY':
        return expoConfig.googleMapsApiKey || fallback;
    }
  }

  // Fallback to process.env for development
  const envMap: Record<string, string | undefined> = {
    SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  };

  return envMap[key] || fallback;
};

export const ENV = {
  SUPABASE_URL: getEnvVar('SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnvVar('SUPABASE_ANON_KEY'),
  GOOGLE_MAPS_API_KEY: getEnvVar('GOOGLE_MAPS_API_KEY'),
};

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'] as const;

export const validateEnv = () => {
  const missing = requiredEnvVars.filter(
    (key) => !ENV[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please ensure environment variables are set in Vercel or create a .env file based on .env.example\n' +
      `Current values: SUPABASE_URL=${ENV.SUPABASE_URL ? 'SET' : 'MISSING'}, SUPABASE_ANON_KEY=${ENV.SUPABASE_ANON_KEY ? 'SET' : 'MISSING'}`
    );
  }
};
