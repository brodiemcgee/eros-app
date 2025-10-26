import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import {
  getSubscriptionPlans,
  getUserSubscription,
  createPaymentIntent,
  createSubscription,
  getStripePublishableKey,
  SubscriptionPlan,
  UserSubscription,
} from '../services/stripe';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../utils/theme';

const PlanCard: React.FC<{
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  onSelect: () => void;
  loading: boolean;
}> = ({ plan, isCurrentPlan, onSelect, loading }) => {
  const price = (plan.price_amount / 100).toFixed(2);
  const duration = plan.duration_days === 30 ? 'month' : `${plan.duration_days} days`;

  return (
    <View style={[styles.planCard, isCurrentPlan && styles.currentPlanCard]}>
      {isCurrentPlan && (
        <View style={styles.currentPlanBadge}>
          <Text style={styles.currentPlanText}>CURRENT PLAN</Text>
        </View>
      )}

      <Text style={styles.planName}>{plan.name}</Text>
      <Text style={styles.planDescription}>{plan.description}</Text>

      <View style={styles.priceContainer}>
        <Text style={styles.priceSymbol}>$</Text>
        <Text style={styles.priceAmount}>{price}</Text>
        <Text style={styles.pricePeriod}>/ {duration}</Text>
      </View>

      {plan.features && plan.features.length > 0 && (
        <View style={styles.featuresContainer}>
          {plan.features.map((feature, idx) => (
            <View key={idx} style={styles.featureItem}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.selectButton, isCurrentPlan && styles.currentButton]}
        onPress={onSelect}
        disabled={isCurrentPlan || loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.selectButtonText}>
            {isCurrentPlan ? 'Active' : 'Select Plan'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// Web-only component - Premium purchases only available on mobile
const WebOnlyMessage: React.FC = () => {
  return (
    <View style={styles.centerContainer}>
      <View style={styles.webMessageContainer}>
        <Text style={styles.webMessageIcon}>📱</Text>
        <Text style={styles.webMessageTitle}>Premium Available on Mobile</Text>
        <Text style={styles.webMessageText}>
          Premium subscriptions are only available through our mobile app.
        </Text>
        <Text style={[styles.webMessageText, { marginTop: SPACING.md }]}>
          Download the EROS app from the App Store or Google Play to upgrade to Premium.
        </Text>
      </View>
    </View>
  );
};

const SubscriptionScreenContent: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  // On web, Stripe React Native is not available
  const stripe = Platform.OS !== 'web' ? require('@stripe/stripe-react-native').useStripe() : null;

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  // Show web-only message if on web platform
  if (Platform.OS === 'web') {
    return <WebOnlyMessage />;
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansData, subscriptionData] = await Promise.all([
        getSubscriptionPlans(),
        user ? getUserSubscription(user.id) : null,
      ]);

      setPlans(plansData);
      setCurrentSubscription(subscriptionData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      Alert.alert('Error', 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (plan: SubscriptionPlan) => {
    if (!user || !stripe) {
      Alert.alert('Error', 'Please log in to purchase a subscription');
      return;
    }

    setProcessingPlanId(plan.id);

    try {
      // Create payment intent
      const { clientSecret, ephemeralKey, customerId } = await createPaymentIntent(
        plan.id,
        user.id
      );

      // Initialize payment sheet
      const { error: initError } = await stripe.initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'EROS',
        customerId,
        customerEphemeralKeySecret: ephemeralKey,
        returnURL: 'eros://subscription-success',
        defaultBillingDetails: {
          email: user.email,
        },
      });

      if (initError) {
        Alert.alert('Error', initError.message);
        return;
      }

      // Present payment sheet
      const { error: presentError } = await stripe.presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== 'Canceled') {
          Alert.alert('Payment Failed', presentError.message);
        }
        return;
      }

      // Payment successful - create subscription in database
      await createSubscription(user.id, plan.id, '', customerId);

      Alert.alert(
        'Success!',
        `You are now a premium member! Enjoy your ${plan.name} subscription.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', error.message || 'Failed to process payment');
    } finally {
      setProcessingPlanId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upgrade to Premium</Text>
        <Text style={styles.subtitle}>
          Unlock exclusive features and enhance your experience
        </Text>
      </View>

      {/* Premium Features Overview */}
      <View style={styles.benefitsSection}>
        <Text style={styles.benefitsTitle}>Premium Benefits</Text>
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>👁️</Text>
            <Text style={styles.benefitText}>See who viewed your profile</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⭐</Text>
            <Text style={styles.benefitText}>Unlimited favorites</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🔍</Text>
            <Text style={styles.benefitText}>Advanced search filters</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🚫</Text>
            <Text style={styles.benefitText}>Ad-free experience</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✅</Text>
            <Text style={styles.benefitText}>Read receipts</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⚡</Text>
            <Text style={styles.benefitText}>Priority support</Text>
          </View>
        </View>
      </View>

      {/* Subscription Plans */}
      <View style={styles.plansSection}>
        <Text style={styles.plansTitle}>Choose Your Plan</Text>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={currentSubscription?.subscription_plan_id === plan.id}
            onSelect={() => handlePurchase(plan)}
            loading={processingPlanId === plan.id}
          />
        ))}
      </View>

      {/* Fine Print */}
      <View style={styles.finePrint}>
        <Text style={styles.finePrintText}>
          • Auto-renews unless canceled before renewal date
        </Text>
        <Text style={styles.finePrintText}>
          • Cancel anytime in Settings → Manage Subscription
        </Text>
        <Text style={styles.finePrintText}>
          • Payments processed securely by Stripe
        </Text>
      </View>
    </ScrollView>
  );
};

export const SubscriptionScreen: React.FC = () => {
  // On web, show message directly without Stripe provider
  if (Platform.OS === 'web') {
    return <SubscriptionScreenContent />;
  }

  // On native platforms, wrap with Stripe provider
  const publishableKey = getStripePublishableKey();
  const { StripeProvider } = require('@stripe/stripe-react-native');

  return (
    <StripeProvider publishableKey={publishableKey}>
      <SubscriptionScreenContent />
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  benefitsSection: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
  },
  benefitsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  benefitsList: {
    gap: SPACING.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  benefitIcon: {
    fontSize: FONT_SIZES.xl,
  },
  benefitText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  plansSection: {
    padding: SPACING.lg,
  },
  plansTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.md,
  },
  currentPlanCard: {
    borderColor: COLORS.primary,
  },
  currentPlanBadge: {
    position: 'absolute',
    top: -10,
    right: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  currentPlanText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  planName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  planDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.md,
  },
  priceSymbol: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.primary,
  },
  priceAmount: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.primary,
  },
  pricePeriod: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  featuresContainer: {
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  featureCheck: {
    color: COLORS.success,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  featureText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  selectButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  currentButton: {
    backgroundColor: COLORS.textSecondary,
  },
  selectButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold as any,
  },
  finePrint: {
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  finePrintText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  webMessageContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    margin: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  webMessageIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  webMessageTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  webMessageText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
