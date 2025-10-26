# Supabase Edge Functions Setup Guide

Complete guide for deploying Stripe payment Edge Functions to Supabase.

## Overview

Edge Functions are serverless TypeScript functions that run on Supabase's edge network. We use them to securely handle Stripe payments without exposing your secret keys to the client.

## Prerequisites

1. Supabase CLI installed: `npm install -g supabase`
2. Supabase project created
3. Stripe account with API keys

## Edge Functions We're Deploying

1. **create-payment-intent** - Creates payment intent for subscriptions
2. **create-setup-intent** - Adds payment methods
3. **cancel-subscription** - Cancels subscriptions
4. **stripe-webhook** - Handles Stripe webhook events

## Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

## Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate.

## Step 3: Link Your Project

```bash
cd /Users/brodie/Documents/Projects/hook/eros-app
supabase link --project-ref ycujqoxstawhtrfnchyb
```

When prompted, enter your database password.

## Step 4: Set Stripe Environment Variables

You need to add Stripe keys to your Supabase project:

### Get Your Stripe Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Secret key** (starts with `sk_test_` for test mode)
3. For production, use `sk_live_` keys

### Set Secrets in Supabase

```bash
# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Set webhook secret (get this after creating webhook in Stripe)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Step 5: Deploy Edge Functions

Deploy all functions at once:

```bash
# Deploy create-payment-intent
supabase functions deploy create-payment-intent

# Deploy create-setup-intent
supabase functions deploy create-setup-intent

# Deploy cancel-subscription
supabase functions deploy cancel-subscription

# Deploy stripe-webhook
supabase functions deploy stripe-webhook
```

Or deploy all at once:
```bash
supabase functions deploy
```

## Step 6: Set Up Stripe Webhook

### Get Webhook URL

Your webhook URL will be:
```
https://ycujqoxstawhtrfnchyb.supabase.co/functions/v1/stripe-webhook
```

### Configure in Stripe Dashboard

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL (above)
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)
7. Update your Supabase secret:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_copied_secret
   ```

## Step 7: Test Edge Functions

### Test create-payment-intent

```bash
curl -X POST \
  'https://ycujqoxstawhtrfnchyb.supabase.co/functions/v1/create-payment-intent' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "planId": "plan-id-from-database",
    "userId": "user-id-from-auth"
  }'
```

### Test create-setup-intent

```bash
curl -X POST \
  'https://ycujqoxstawhtrfnchyb.supabase.co/functions/v1/create-setup-intent' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "user-id-from-auth"
  }'
```

### Test via App

The app will automatically use these endpoints when:
- User clicks "Select Plan" on SubscriptionScreen
- User adds a payment method on PaymentMethodScreen
- User cancels subscription on BillingHistoryScreen

## Step 8: Monitor Functions

### View Logs

```bash
# Watch logs in real-time
supabase functions serve stripe-webhook --debug

# Or view in Supabase Dashboard
# Go to Edge Functions → select function → Logs
```

### Check Function Status

```bash
supabase functions list
```

## Step 9: Update App Environment Variables

Add to your `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://ycujqoxstawhtrfnchyb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

## Troubleshooting

### Function Returns 500 Error

Check logs:
```bash
supabase functions logs create-payment-intent --tail
```

Common issues:
- Stripe keys not set: Run `supabase secrets list` to verify
- Database connection issues: Check RLS policies
- CORS errors: Functions already have CORS headers

### Webhook Not Receiving Events

1. Check webhook URL is correct in Stripe Dashboard
2. Verify webhook secret is set: `supabase secrets list`
3. Check webhook events are selected in Stripe
4. Test with Stripe CLI:
   ```bash
   stripe listen --forward-to https://ycujqoxstawhtrfnchyb.supabase.co/functions/v1/stripe-webhook
   ```

### Payment Intent Creation Fails

Common causes:
- Plan not found in database
- User not found
- Stripe customer creation failed

Check logs and verify data exists in Supabase.

## Production Checklist

Before going live:

- [ ] Switch to Stripe live keys (`sk_live_`, `pk_live_`)
- [ ] Update webhook URL with live keys
- [ ] Set production secrets:
  ```bash
  supabase secrets set STRIPE_SECRET_KEY=sk_live_your_live_key
  ```
- [ ] Test full payment flow end-to-end
- [ ] Monitor webhook events in Stripe Dashboard
- [ ] Set up error alerting
- [ ] Configure Stripe tax settings (if applicable)
- [ ] Enable Stripe Radar for fraud detection

## Useful Commands

```bash
# List all functions
supabase functions list

# List secrets
supabase secrets list

# Delete a function
supabase functions delete function-name

# Redeploy after changes
supabase functions deploy function-name

# Serve locally for development
supabase functions serve create-payment-intent --debug
```

## Local Development

To test functions locally:

```bash
# Start Supabase locally
supabase start

# Serve function locally
supabase functions serve create-payment-intent --env-file .env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/create-payment-intent \
  -H 'Content-Type: application/json' \
  -d '{"planId": "test", "userId": "test"}'
```

## Security Notes

- Never commit Stripe secret keys to git
- Use environment variables for all secrets
- Always verify webhook signatures
- Use Stripe test keys for development
- Enable Stripe Radar for production
- Regularly rotate API keys

## Support

- Supabase Docs: https://supabase.com/docs/guides/functions
- Stripe Docs: https://stripe.com/docs/api
- Edge Functions Logs: Supabase Dashboard → Edge Functions → Logs
- Stripe Events: Stripe Dashboard → Developers → Events

## Next Steps

1. ✅ Deploy all Edge Functions
2. ✅ Configure Stripe webhook
3. ✅ Test payment flow in app
4. → Add more subscription plans in database
5. → Configure tax collection (if needed)
6. → Set up production monitoring
