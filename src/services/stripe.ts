import { supabase } from './supabase';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  duration_days: number;
  price_amount: number;
  currency: string;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  features: string[];
  is_active: boolean;
  display_order: number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_plan_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: string;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  subscription_id: string | null;
  amount: number;
  currency: string;
  status: string;
  stripe_payment_intent_id: string | null;
  created_at: string;
}

// Get all active subscription plans
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }

  return data || [];
};

// Get user's active subscription
export const getUserSubscription = async (userId: string): Promise<UserSubscription | null> => {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Error fetching user subscription:', error);
    throw error;
  }

  return data;
};

// Create payment intent for subscription purchase
export const createPaymentIntent = async (
  planId: string,
  userId: string
): Promise<{ clientSecret: string; ephemeralKey: string; customerId: string }> => {
  // Call your backend/Supabase Edge Function to create payment intent
  const { data, error } = await supabase.functions.invoke('create-payment-intent', {
    body: { planId, userId },
  });

  if (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }

  return data;
};

// Create subscription after successful payment
export const createSubscription = async (
  userId: string,
  planId: string,
  stripeSubscriptionId: string,
  stripeCustomerId: string
): Promise<UserSubscription> => {
  // Get plan details
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('duration_days')
    .eq('id', planId)
    .single();

  if (!plan) {
    throw new Error('Plan not found');
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.duration_days);

  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      subscription_plan_id: planId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_customer_id: stripeCustomerId,
      status: 'active',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      auto_renew: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }

  // Update profile to mark as premium
  await supabase
    .from('profiles')
    .update({
      is_premium: true,
      premium_expires_at: endDate.toISOString(),
    })
    .eq('id', userId);

  return data;
};

// Cancel subscription
export const cancelSubscription = async (subscriptionId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      auto_renew: false,
    })
    .eq('id', subscriptionId);

  if (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }

  // Also cancel in Stripe via Edge Function
  await supabase.functions.invoke('cancel-subscription', {
    body: { subscriptionId },
  });
};

// Get payment transaction history
export const getPaymentHistory = async (userId: string): Promise<PaymentTransaction[]> => {
  const { data, error } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }

  return data || [];
};

// Check if user has active premium subscription
export const hasActivePremium = async (userId: string): Promise<boolean> => {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return false;
  }

  const endDate = new Date(subscription.end_date);
  const now = new Date();

  return endDate > now && subscription.status === 'active';
};

// Get Stripe publishable key from environment
export const getStripePublishableKey = (): string => {
  const key = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('Stripe publishable key not configured');
  }
  return key;
};
