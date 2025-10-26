# EROS Complete Deployment Guide

Complete step-by-step guide for deploying the EROS dating app and admin dashboard to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Edge Functions Deployment](#edge-functions-deployment)
4. [Admin Dashboard Deployment (Vercel)](#admin-dashboard-deployment-vercel)
5. [Mobile App Deployment (Expo/EAS)](#mobile-app-deployment-expoeas)
6. [Web App Deployment](#web-app-deployment)
7. [Stripe Configuration](#stripe-configuration)
8. [Testing Checklist](#testing-checklist)
9. [Production Launch Checklist](#production-launch-checklist)
10. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Required Accounts
- [x] Supabase account with project created
- [x] Stripe account (test and live keys)
- [x] Vercel account
- [x] Expo account
- [x] Apple Developer account (for iOS TestFlight)
- [x] Google Play Console account (optional, for Android)
- [ ] GitHub repository (for version control)

### Required CLI Tools

```bash
# Install Supabase CLI
npm install -g supabase

# Install Expo CLI
npm install -g eas-cli

# Verify installations
supabase --version
eas --version
```

### Credentials Checklist

Create a secure document with these credentials:

```
SUPABASE_URL: https://ycujqoxstawhtrfnchyb.supabase.co
SUPABASE_ANON_KEY: [from Supabase Dashboard > Settings > API]
SUPABASE_SERVICE_ROLE_KEY: [KEEP SECRET - from Supabase Dashboard]
STRIPE_PUBLISHABLE_KEY: pk_test_... (test) / pk_live_... (prod)
STRIPE_SECRET_KEY: sk_test_... (test) / sk_live_... (prod)
STRIPE_WEBHOOK_SECRET: whsec_... (get after webhook creation)
```

---

## Database Setup

### Step 1: Apply Main Schema

1. Open Supabase Dashboard: https://app.supabase.com
2. Navigate to your project: `ycujqoxstawhtrfnchyb`
3. Go to **SQL Editor** > **New Query**
4. Copy contents of `supabase/schema.sql`
5. Paste and run the query
6. Verify success (should see "Success. No rows returned")

### Step 2: Apply Admin Schema

1. In **SQL Editor**, create another new query
2. Copy contents of `supabase/admin_schema.sql`
3. Paste and run the query
4. Verify success

### Step 3: Apply Storage Schema

1. In **SQL Editor**, create another new query
2. Copy contents of `supabase/storage.sql`
3. Paste and run the query
4. Verify success

### Step 4: Configure Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Create these buckets:

```
profile-photos (public)
chat-media (private)
verification-photos (private)
admin-uploads (private)
```

For each bucket:
- Click **New bucket**
- Set name (e.g., `profile-photos`)
- Set public/private as noted above
- Click **Create bucket**

### Step 5: Verify Database Setup

Run this verification query in SQL Editor:

```sql
-- Verify all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should see all tables including:
-- profiles, user_photos, matches, messages, taps,
-- profile_views, blocked_users, reported_users,
-- subscription_plans, user_subscriptions, etc.

-- Verify storage buckets
SELECT * FROM storage.buckets;

-- Should see: profile-photos, chat-media, verification-photos, admin-uploads
```

### Step 6: Create Initial Admin User

```sql
-- Replace with your email
INSERT INTO admin_users (email, role, created_at)
VALUES ('your-email@example.com', 'super_admin', NOW())
ON CONFLICT (email) DO NOTHING;
```

### Step 7: Seed Subscription Plans

```sql
-- Insert subscription plans
INSERT INTO subscription_plans (
  name,
  description,
  price_amount,
  currency,
  duration_days,
  features,
  is_active,
  display_order
) VALUES
  (
    'Premium Monthly',
    'Unlock all premium features for 1 month',
    999,
    'usd',
    30,
    '["Unlimited likes", "See who viewed you", "Advanced filters", "Read receipts", "No ads"]',
    true,
    1
  ),
  (
    'Premium 3 Months',
    'Best value - 3 months of premium access',
    2499,
    'usd',
    90,
    '["Unlimited likes", "See who viewed you", "Advanced filters", "Read receipts", "No ads", "Priority support"]',
    true,
    2
  ),
  (
    'Premium Annual',
    'Save 40% with annual subscription',
    5999,
    'usd',
    365,
    '["Unlimited likes", "See who viewed you", "Advanced filters", "Read receipts", "No ads", "Priority support", "Exclusive badge"]',
    true,
    3
  )
ON CONFLICT DO NOTHING;
```

---

## Edge Functions Deployment

### Step 1: Login to Supabase CLI

```bash
cd /Users/brodie/Documents/Projects/hook/eros-app
supabase login
```

This will open your browser to authenticate.

### Step 2: Link Project

```bash
supabase link --project-ref ycujqoxstawhtrfnchyb
```

When prompted, enter your database password.

### Step 3: Set Stripe Secrets

```bash
# Use test keys for development
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Will set webhook secret later after creating webhook
```

### Step 4: Deploy All Edge Functions

```bash
# Deploy all functions at once
supabase functions deploy

# Or deploy individually
supabase functions deploy create-payment-intent
supabase functions deploy create-setup-intent
supabase functions deploy cancel-subscription
supabase functions deploy stripe-webhook
```

### Step 5: Verify Deployment

```bash
# List deployed functions
supabase functions list

# Should see all 4 functions with status "ACTIVE"
```

### Step 6: Get Function URLs

Your Edge Function URLs will be:
```
https://ycujqoxstawhtrfnchyb.supabase.co/functions/v1/create-payment-intent
https://ycujqoxstawhtrfnchyb.supabase.co/functions/v1/create-setup-intent
https://ycujqoxstawhtrfnchyb.supabase.co/functions/v1/cancel-subscription
https://ycujqoxstawhtrfnchyb.supabase.co/functions/v1/stripe-webhook
```

---

## Stripe Configuration

### Step 1: Get Stripe API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy **Publishable key** (starts with `pk_test_`)
3. Copy **Secret key** (starts with `sk_test_`)
4. Save these securely

### Step 2: Configure Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Enter webhook URL: `https://ycujqoxstawhtrfnchyb.supabase.co/functions/v1/stripe-webhook`
4. Click **Select events**
5. Choose these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Click **Add endpoint**
7. Copy the **Signing secret** (starts with `whsec_`)

### Step 3: Update Supabase Secrets

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Step 4: Test Webhook

```bash
# Install Stripe CLI (if not already installed)
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Test webhook forwarding
stripe listen --forward-to https://ycujqoxstawhtrfnchyb.supabase.co/functions/v1/stripe-webhook

# In another terminal, trigger test event
stripe trigger payment_intent.succeeded
```

### Step 5: Verify Webhook in Supabase

```bash
# Watch Edge Function logs
supabase functions logs stripe-webhook --tail

# You should see the webhook event being received
```

---

## Admin Dashboard Deployment (Vercel)

The admin dashboard is already on GitHub: https://github.com/brodiemcgee/eros-admin

### Step 1: Connect Repository to Vercel

1. Go to https://vercel.com
2. Click **Add New** > **Project**
3. Import Git Repository: `brodiemcgee/eros-admin`
4. Click **Import**

### Step 2: Configure Build Settings

Vercel should auto-detect:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Add Environment Variables

In Vercel project settings > Environment Variables, add:

```
VITE_SUPABASE_URL = https://ycujqoxstawhtrfnchyb.supabase.co
VITE_SUPABASE_ANON_KEY = [your-anon-key]
```

**DO NOT ADD SERVICE ROLE KEY** - it should only be used server-side.

### Step 4: Deploy

1. Click **Deploy**
2. Wait for build to complete (~2-3 minutes)
3. Vercel will provide a URL like: `https://eros-admin.vercel.app`

### Step 5: Verify Deployment

1. Visit your Vercel URL
2. Try logging in with your admin email
3. Check that all pages load:
   - Dashboard
   - Users
   - Photo Moderation
   - Subscriptions
   - Compliance
   - Analytics

### Step 6: Set Up Custom Domain (Optional)

1. In Vercel project settings > Domains
2. Add your custom domain (e.g., `admin.eros.app`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning

---

## Mobile App Deployment (Expo/EAS)

### Step 1: Configure Environment Variables

Create `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://ycujqoxstawhtrfnchyb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

**IMPORTANT**: Never commit `.env` to git. It's already in `.gitignore`.

### Step 2: Update app.json

Edit `app.json` and update these fields:

```json
{
  "expo": {
    "name": "EROS",
    "slug": "eros-app",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.eros",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.yourcompany.eros",
      "versionCode": 1
    }
  }
}
```

### Step 3: Login to Expo

```bash
eas login
```

Enter your Expo credentials.

### Step 4: Configure EAS Build

```bash
eas build:configure
```

This will set up `eas.json` (already created).

### Step 5: Update EAS Secrets

```bash
# Set environment variables for EAS builds
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://ycujqoxstawhtrfnchyb.supabase.co
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your-anon-key
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value pk_test_your_key
```

### Step 6: Build for iOS (TestFlight)

```bash
# Build for iOS
eas build --platform ios --profile production

# This will:
# 1. Upload your code to EAS
# 2. Build the app (~15-20 minutes)
# 3. Provide a download link for .ipa file
```

### Step 7: Submit to TestFlight

```bash
# Submit to App Store Connect
eas submit --platform ios --latest

# Or submit manually:
# 1. Download .ipa from EAS build
# 2. Upload to App Store Connect via Transporter app
# 3. In App Store Connect, create TestFlight group
# 4. Add testers
# 5. App will be available in TestFlight within 24-48 hours
```

### Step 8: Build for Android (Optional)

```bash
# Build for Android
eas build --platform android --profile production

# Submit to Google Play Internal Testing
eas submit --platform android --latest
```

### Step 9: Verify TestFlight Build

1. Go to https://appstoreconnect.apple.com
2. Select your app
3. Go to **TestFlight** tab
4. Verify build appears
5. Add internal testers
6. Install via TestFlight app on iOS device
7. Test core functionality

---

## Web App Deployment

### Option 1: Expo Web (Recommended for Quick Deploy)

```bash
# Build web version
npx expo export:web

# Deploy to Vercel
npm install -g vercel
vercel --prod

# Follow prompts to deploy
```

### Option 2: Netlify

```bash
# Build web version
npx expo export:web

# Deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod --dir web-build

# Follow prompts
```

### Option 3: Custom Server

```bash
# Build web version
npx expo export:web

# Upload web-build directory to your hosting provider
# Configure nginx/Apache to serve the static files
```

### Environment Variables for Web

Add these to your hosting provider:

```
EXPO_PUBLIC_SUPABASE_URL=https://ycujqoxstawhtrfnchyb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

---

## Testing Checklist

### Database Tests

- [ ] All tables exist
- [ ] Storage buckets configured
- [ ] Admin user created
- [ ] Can query profiles table
- [ ] RLS policies working (test with anon key)

### Edge Functions Tests

- [ ] create-payment-intent returns client secret
- [ ] create-setup-intent works
- [ ] cancel-subscription updates Stripe
- [ ] stripe-webhook receives events

### Stripe Tests

- [ ] Webhook endpoint active in Stripe dashboard
- [ ] Test payment completes successfully
- [ ] Subscription created in database
- [ ] User upgraded to premium
- [ ] Transaction recorded
- [ ] Payment method saves correctly

### Admin Dashboard Tests

- [ ] Deployed to Vercel successfully
- [ ] Can login with admin email
- [ ] Dashboard loads with stats
- [ ] Users table displays
- [ ] Photo moderation works
- [ ] Subscriptions page loads
- [ ] Analytics charts render
- [ ] Can ban/unban users
- [ ] Can approve/reject photos

### Mobile App Tests (TestFlight)

- [ ] App installs via TestFlight
- [ ] Splash screen shows
- [ ] Can create account
- [ ] Can login
- [ ] Profile creation works
- [ ] Photo upload works
- [ ] Can view discover feed
- [ ] Swiping works
- [ ] Messages send/receive
- [ ] Taps work
- [ ] Profile views tracked
- [ ] Settings save correctly
- [ ] Push notifications work
- [ ] Location permissions work
- [ ] Camera permissions work
- [ ] Premium upgrade flow works
- [ ] Payment processing works
- [ ] Subscription shows in billing

### Web App Tests

- [ ] App loads in browser
- [ ] Responsive design works
- [ ] All mobile features work
- [ ] Images load correctly
- [ ] Navigation works

---

## Production Launch Checklist

### Pre-Launch (1 Week Before)

- [ ] Switch Stripe to live mode
  - [ ] Update `STRIPE_SECRET_KEY` in Supabase secrets
  - [ ] Update `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` in app
  - [ ] Update webhook URL with live keys
  - [ ] Re-test payment flow

- [ ] Update Supabase to production tier
  - [ ] Review rate limits
  - [ ] Enable SSL enforcement
  - [ ] Set up daily backups
  - [ ] Configure point-in-time recovery

- [ ] Security audit
  - [ ] Verify all RLS policies active
  - [ ] Check for exposed secrets
  - [ ] Review API rate limiting
  - [ ] Enable Stripe Radar for fraud detection
  - [ ] Set up Sentry/error tracking

- [ ] Performance optimization
  - [ ] Run Lighthouse audit on web
  - [ ] Optimize image sizes
  - [ ] Enable CDN for static assets
  - [ ] Configure caching headers

- [ ] Legal compliance
  - [ ] Privacy Policy live
  - [ ] Terms of Service live
  - [ ] GDPR compliance (if EU users)
  - [ ] CCPA compliance (if CA users)
  - [ ] Cookie consent implemented

### Launch Day

- [ ] Deploy final version to all platforms
- [ ] Monitor error logs
- [ ] Watch Stripe dashboard for payments
- [ ] Check Supabase metrics
- [ ] Monitor Edge Function logs
- [ ] Test critical user flows
- [ ] Have team on standby for issues

### Post-Launch (First Week)

- [ ] Daily monitoring of:
  - [ ] Error rates
  - [ ] API response times
  - [ ] Database performance
  - [ ] Payment success rates
  - [ ] User signup rates
  - [ ] Crash reports

- [ ] Collect user feedback
- [ ] Fix critical bugs immediately
- [ ] Plan first update

---

## Monitoring & Maintenance

### Supabase Monitoring

1. Go to Supabase Dashboard > Project Settings > Usage
2. Monitor:
   - Database size
   - API requests
   - Auth users
   - Storage usage
   - Edge Function invocations

### Stripe Monitoring

1. Go to Stripe Dashboard > Developers > Events
2. Monitor:
   - Payment success rate
   - Failed payment reasons
   - Dispute rate
   - Webhook delivery success

### Vercel Monitoring

1. Go to Vercel Dashboard > Analytics
2. Monitor:
   - Page load times
   - Error rates
   - Visitor traffic
   - Bandwidth usage

### Set Up Alerts

#### Supabase Alerts
- Database > 80% capacity
- API errors > 5% rate
- Edge Function failures

#### Stripe Alerts
- Failed payments > 10%
- Dispute received
- Webhook delivery failures

#### Sentry (Error Tracking)
```bash
npm install @sentry/react-native
```

Configure in `App.tsx`:
```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: 'production',
});
```

### Regular Maintenance Tasks

**Daily**
- Check error logs
- Review payment failures
- Monitor user signup/login issues

**Weekly**
- Review database performance
- Check storage usage
- Update dependencies (security patches)
- Review moderation queue

**Monthly**
- Database optimization (vacuum, analyze)
- Review and optimize slow queries
- Check for unused indexes
- Review Edge Function costs
- Update app dependencies
- Review user feedback for features

**Quarterly**
- Security audit
- Performance review
- Cost optimization review
- Feature roadmap planning

---

## Rollback Procedures

### Rollback Admin Dashboard

```bash
# In Vercel dashboard
# 1. Go to Deployments
# 2. Find previous working deployment
# 3. Click "..." menu
# 4. Select "Promote to Production"
```

### Rollback Mobile App

```bash
# Submit previous build to stores
eas submit --platform ios --id <previous-build-id>

# Or rebuild from previous git commit
git checkout <previous-commit>
eas build --platform ios --profile production
```

### Rollback Edge Functions

```bash
# Git checkout previous version
git checkout <previous-commit>

# Redeploy
supabase functions deploy <function-name>
```

### Rollback Database Schema

```sql
-- NEVER drop tables in production
-- Instead, add migration to revert changes

-- Example: Remove column
ALTER TABLE profiles DROP COLUMN new_column;

-- Example: Revert RLS policy
DROP POLICY IF EXISTS new_policy ON profiles;
```

---

## Emergency Contacts

Keep this information handy:

- **Supabase Support**: https://supabase.com/support
- **Stripe Support**: https://support.stripe.com
- **Expo Support**: https://expo.dev/support
- **Vercel Support**: https://vercel.com/support

---

## Next Steps After Deployment

1. **Marketing Launch**
   - Social media announcement
   - Press release
   - App store optimization (ASO)

2. **User Onboarding**
   - Email welcome sequence
   - In-app tutorial improvements
   - First-time user experience optimization

3. **Feature Development**
   - Video chat integration
   - Voice messages
   - Advanced matching algorithms
   - Events/meetups feature

4. **Scaling Preparation**
   - Set up load testing
   - Plan database sharding strategy
   - Implement caching layer (Redis)
   - Set up read replicas

---

## Troubleshooting

### Common Issues

**Edge Function 500 Error**
```bash
# Check logs
supabase functions logs <function-name> --tail

# Verify secrets are set
supabase secrets list
```

**Stripe Webhook Not Receiving Events**
```bash
# Test with Stripe CLI
stripe listen --forward-to https://your-url/functions/v1/stripe-webhook

# Trigger test event
stripe trigger payment_intent.succeeded
```

**Mobile App Won't Build**
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules
npm install

# Clear Expo cache
expo start -c
```

**Database Connection Issues**
- Check if IP is whitelisted (Supabase > Database > Network)
- Verify connection string
- Check if database is paused (free tier)

---

## Success Metrics

Track these KPIs post-launch:

- **User Acquisition**
  - Daily signups
  - Signup completion rate
  - Referral rate

- **Engagement**
  - Daily active users (DAU)
  - Monthly active users (MAU)
  - Session duration
  - Messages sent per user
  - Matches per user

- **Revenue**
  - Premium conversion rate
  - Monthly recurring revenue (MRR)
  - Customer lifetime value (CLV)
  - Churn rate

- **Technical**
  - App crash rate (< 1%)
  - API response time (< 500ms p95)
  - Payment success rate (> 95%)
  - Uptime (> 99.9%)

---

## Conclusion

You're now ready to deploy EROS to production! Follow this guide step-by-step, and don't skip any verification steps.

**Remember**:
- Test thoroughly before production launch
- Start with test/staging environment
- Monitor closely after launch
- Have rollback plan ready
- Keep team on standby

Good luck with your launch! 🚀
