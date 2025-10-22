// Environment configuration
// Values are injected at build time via window.__ENV__ in index.html

declare global {
  interface Window {
    __ENV__?: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
      GOOGLE_MAPS_API_KEY: string;
    };
  }
}

// For web builds, use injected values; for native, use process.env
const isWeb = typeof window !== 'undefined';
const injectedEnv = isWeb && window.__ENV__ ? window.__ENV__ : null;

export const ENV = {
  SUPABASE_URL: injectedEnv?.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: injectedEnv?.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  GOOGLE_MAPS_API_KEY: injectedEnv?.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
};

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'] as const;

export const validateEnv = () => {
  const missing = requiredEnvVars.filter(
    (key) => !ENV[key]
  );

  if (missing.length > 0) {
    console.error('[ENV-GENERATED] Environment check failed:', {
      SUPABASE_URL: ENV.SUPABASE_URL || 'EMPTY',
      SUPABASE_ANON_KEY: ENV.SUPABASE_ANON_KEY ? 'SET' : 'EMPTY',
      ENV_OBJECT: ENV
    });
    throw new Error(
      `[ENV-GENERATED] Missing: ${missing.join(', ')} | ` +
      `URL=${ENV.SUPABASE_URL ? 'SET' : 'EMPTY'} KEY=${ENV.SUPABASE_ANON_KEY ? 'SET' : 'EMPTY'} | ` +
      'Check Vercel env vars: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
};
