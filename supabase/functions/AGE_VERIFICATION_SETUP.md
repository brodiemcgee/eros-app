# Age Verification Setup Guide

## Stripe Identity Integration

This guide explains how to set up and deploy the age verification system using Stripe Identity.

## Prerequisites

1. Stripe account with Identity enabled
2. Supabase project with Edge Functions support
3. Supabase CLI installed (`brew install supabase/tap/supabase`)

## Step 1: Enable Stripe Identity

1. Go to https://dashboard.stripe.com/settings/identity
2. Enable Stripe Identity for your account
3. **Important:** Activate "Live Mode" for Identity (test mode has limitations)

## Step 2: Get Stripe API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Secret Key** (starts with `sk_live_...` or `sk_test_...`)
3. Create a **Webhook Signing Secret**:
   - Go to https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - URL: `https://[YOUR_PROJECT_REF].supabase.co/functions/v1/verification-webhook`
   - Select events:
     - `identity.verification_session.verified`
     - `identity.verification_session.requires_input`
     - `identity.verification_session.canceled`
     - `identity.verification_session.redacted`
   - Copy the **Signing secret** (starts with `whsec_...`)

## Step 3: Set Supabase Secrets

Run these commands to set your secrets:

\`\`\`bash
# Set Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY

# Set Stripe Webhook Secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
\`\`\`

## Step 4: Deploy Edge Functions

Deploy all three Edge Functions:

\`\`\`bash
# From the thirsty-app directory
cd supabase/functions

# Deploy all functions
supabase functions deploy create-verification-session
supabase functions deploy verification-webhook
supabase functions deploy check-verification-status
\`\`\`

Verify deployment:
\`\`\`bash
supabase functions list
\`\`\`

## Step 5: Test the Flow

### Test Create Session (from your app or terminal):

\`\`\`bash
curl -X POST https://[YOUR_PROJECT_REF].supabase.co/functions/v1/create-verification-session \
  -H "Authorization: Bearer [USER_JWT_TOKEN]" \
  -H "apikey: [YOUR_ANON_KEY]"
\`\`\`

Expected response:
\`\`\`json
{
  "success": true,
  "client_secret": "vs_1_secret_...",
  "session_id": "vs_...",
  "verification_request_id": "uuid"
}
\`\`\`

### Test Check Status:

\`\`\`bash
curl -X POST https://[YOUR_PROJECT_REF].supabase.co/functions/v1/check-verification-status \
  -H "Authorization: Bearer [USER_JWT_TOKEN]" \
  -H "apikey: [YOUR_ANON_KEY]"
\`\`\`

Expected response:
\`\`\`json
{
  "success": true,
  "verification": {
    "is_verified": false,
    "verified_at": null,
    "expires_at": null,
    "is_expired": false,
    "latest_request_status": "pending",
    "latest_request_method": "third_party",
    "provider": "stripe_identity"
  }
}
\`\`\`

## Step 6: Configure Stripe Identity Settings

1. Go to https://dashboard.stripe.com/settings/identity
2. Configure verification options:
   - **Document Types:** ID card, Passport, Driver's license
   - **Selfie matching:** ENABLED (recommended)
   - **Countries:** Select supported countries
   - **Accepted age:** 18+ (set minimum age requirement)

## Step 7: Test Webhook Locally (Optional)

For local testing with Stripe CLI:

\`\`\`bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local function
stripe listen --forward-to http://localhost:54321/functions/v1/verification-webhook
\`\`\`

## Function Endpoints

After deployment, your functions will be available at:

- **Create Session:** `https://[PROJECT_REF].supabase.co/functions/v1/create-verification-session`
- **Webhook:** `https://[PROJECT_REF].supabase.co/functions/v1/verification-webhook`
- **Check Status:** `https://[PROJECT_REF].supabase.co/functions/v1/check-verification-status`

## Cost Breakdown

- **Stripe Identity:** $1.50 per verification
- **Supabase Edge Functions:** Free tier: 500K requests/month
- **Database:** Minimal impact (few queries per verification)

## Monitoring

### View Function Logs:

\`\`\`bash
# View logs for specific function
supabase functions logs create-verification-session
supabase functions logs verification-webhook
\`\`\`

### Check Verification Stats:

Query the verification_stats view in your database:

\`\`\`sql
SELECT * FROM verification_stats;
\`\`\`

### Monitor Stripe Dashboard:

- Go to https://dashboard.stripe.com/identity/verifications
- View all verification attempts
- See success/failure rates
- Download reports

## Troubleshooting

### Webhook not receiving events:

1. Check webhook URL is correct
2. Verify signing secret is set correctly
3. Check Stripe dashboard webhook logs
4. Test with Stripe CLI

### Verification session creation fails:

1. Check STRIPE_SECRET_KEY is set
2. Verify Stripe Identity is enabled
3. Check function logs: `supabase functions logs create-verification-session`

### User not getting marked as verified:

1. Check webhook is receiving `identity.verification_session.verified` events
2. Verify user_id is in session metadata
3. Check database for verification_requests table entries
4. Check function logs: `supabase functions logs verification-webhook`

## Security Notes

- Never expose Stripe Secret Key or Webhook Secret
- Always verify webhook signatures
- Use HTTPS only for all endpoints
- Stripe stores verification documents (encrypted)
- We only store: verification status, timestamps, session IDs

## Next Steps

After deployment:
1. Integrate verification flow in the React Native app
2. Add verified badge display
3. Implement feature gates
4. Build admin dashboard for verification management
5. Add analytics tracking
