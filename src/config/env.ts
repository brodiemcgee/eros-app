// Environment configuration
// Make sure to create a .env file with your Supabase credentials

// Direct environment variable access - Expo automatically replaces EXPO_PUBLIC_* at build time
export const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
};

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'] as const;

export const validateEnv = () => {
  const missing = requiredEnvVars.filter(
    (key) => !ENV[key]
  );

  if (missing.length > 0) {
    console.error('Environment check:', {
      SUPABASE_URL: ENV.SUPABASE_URL,
      SUPABASE_ANON_KEY: ENV.SUPABASE_ANON_KEY ? '<hidden>' : 'MISSING',
      processEnv: typeof process !== 'undefined' ? 'available' : 'unavailable',
      nodeEnv: typeof process !== 'undefined' && process.env ? 'has .env' : 'no .env'
    });
    throw new Error(
      `[BUILD v3] Missing required environment variables: ${missing.join(', ')}\n` +
      `SUPABASE_URL=${ENV.SUPABASE_URL ? 'SET' : 'MISSING'}, SUPABASE_ANON_KEY=${ENV.SUPABASE_ANON_KEY ? 'SET' : 'MISSING'}\n` +
      'Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in Vercel'
    );
  }
};
