#!/usr/bin/env node

// Generate environment configuration at build time
const fs = require('fs');
const path = require('path');

const envVars = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
};

console.log('Generating environment config...');
console.log('SUPABASE_URL:', envVars.SUPABASE_URL ? 'SET' : 'MISSING');
console.log('SUPABASE_ANON_KEY:', envVars.SUPABASE_ANON_KEY ? 'SET' : 'MISSING');

const content = `// Auto-generated at build time - DO NOT EDIT
// Generated on ${new Date().toISOString()}
export const ENV = ${JSON.stringify(envVars, null, 2)};
`;

const outputPath = path.join(__dirname, '..', 'src', 'config', 'env.generated.ts');
fs.writeFileSync(outputPath, content);

console.log('Environment config generated successfully');
