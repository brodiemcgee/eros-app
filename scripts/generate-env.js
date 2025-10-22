#!/usr/bin/env node

// Inject environment variables into index.html at build time
const fs = require('fs');
const path = require('path');

const envVars = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
};

console.log('Environment check at build time:');
console.log('SUPABASE_URL:', envVars.SUPABASE_URL ? `SET (${envVars.SUPABASE_URL})` : 'MISSING');
console.log('SUPABASE_ANON_KEY:', envVars.SUPABASE_ANON_KEY ? 'SET' : 'MISSING');

// Wait for expo export to complete, then inject into index.html
const distPath = path.join(__dirname, '..', 'dist', 'index.html');

// Check if we're in post-build (index.html exists)
if (fs.existsSync(distPath)) {
  console.log('Injecting environment variables into index.html...');
  let html = fs.readFileSync(distPath, 'utf8');

  const envScript = `<script>window.__ENV__=${JSON.stringify(envVars)};</script>`;
  html = html.replace('</head>', `${envScript}</head>`);

  fs.writeFileSync(distPath, html);
  console.log('Environment variables injected successfully');
} else {
  console.log('index.html not found yet - will be injected in postbuild');
}
