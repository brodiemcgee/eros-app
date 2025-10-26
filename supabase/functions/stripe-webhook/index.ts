// Handle Stripe Webhook Events
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.6.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeKey || !webhookSecret) {
      throw new Error('Stripe keys not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify webhook signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature', { status: 400 });
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log('Received webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const userId = paymentIntent.metadata.userId;
        const planId = paymentIntent.metadata.planId;

        if (userId && planId) {
          // Get plan details
          const { data: plan } = await supabase
            .from('subscription_plans')
            .select('duration_days')
            .eq('id', planId)
            .single();

          if (plan) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + plan.duration_days);

            // Create subscription record
            await supabase.from('user_subscriptions').insert({
              user_id: userId,
              subscription_plan_id: planId,
              stripe_customer_id: paymentIntent.customer as string,
              stripe_subscription_id: paymentIntent.id,
              status: 'active',
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              auto_renew: true,
            });

            // Update profile to premium
            await supabase
              .from('profiles')
              .update({
                is_premium: true,
                premium_expires_at: endDate.toISOString(),
              })
              .eq('id', userId);

            // Create transaction record
            await supabase.from('payment_transactions').insert({
              user_id: userId,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              status: 'completed',
              stripe_payment_intent_id: paymentIntent.id,
              metadata: paymentIntent.metadata,
            });
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const userId = paymentIntent.metadata.userId;

        if (userId) {
          // Create failed transaction record
          await supabase.from('payment_transactions').insert({
            user_id: userId,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: 'failed',
            stripe_payment_intent_id: paymentIntent.id,
            metadata: paymentIntent.metadata,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Find and update subscription in database
        const { data: dbSubscription } = await supabase
          .from('user_subscriptions')
          .select('user_id, id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (dbSubscription) {
          // Update subscription status
          await supabase
            .from('user_subscriptions')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
              auto_renew: false,
            })
            .eq('id', dbSubscription.id);

          // Update profile premium status
          await supabase
            .from('profiles')
            .update({
              is_premium: false,
              premium_expires_at: null,
            })
            .eq('id', dbSubscription.user_id);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        // Find subscription in database
        const { data: dbSubscription } = await supabase
          .from('user_subscriptions')
          .select('id, user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (dbSubscription) {
          const status = subscription.status === 'active' ? 'active' : subscription.status;
          const endDate = new Date(subscription.current_period_end * 1000);

          // Update subscription
          await supabase
            .from('user_subscriptions')
            .update({
              status: status,
              end_date: endDate.toISOString(),
              auto_renew: !subscription.cancel_at_period_end,
            })
            .eq('id', dbSubscription.id);

          // Update profile if subscription became inactive
          if (status !== 'active') {
            await supabase
              .from('profiles')
              .update({
                is_premium: false,
              })
              .eq('id', dbSubscription.user_id);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
