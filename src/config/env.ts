// Environment configuration
// Make sure to create a .env file with your Supabase credentials

// Import from generated file (created at build time by scripts/generate-env.js)
export { ENV } from './env.generated';

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
