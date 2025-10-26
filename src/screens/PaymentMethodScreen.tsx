import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StripeProvider, useStripe, CardField } from '@stripe/stripe-react-native';
import { useAuth } from '../contexts/AuthContext';
import { getStripePublishableKey } from '../services/stripe';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { supabase } from '../services/supabase';

const PaymentMethodScreenContent: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { confirmSetupIntent } = useStripe();

  const [cardComplete, setCardComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddPaymentMethod = async () => {
    if (!user || !cardComplete) {
      return;
    }

    setLoading(true);

    try {
      // Call backend to create setup intent
      const { data: setupData, error: setupError } = await supabase.functions.invoke(
        'create-setup-intent',
        {
          body: { userId: user.id },
        }
      );

      if (setupError) throw setupError;

      // Confirm setup intent with card details
      const { error: confirmError } = await confirmSetupIntent(setupData.client_secret, {
        paymentMethodType: 'Card',
      });

      if (confirmError) {
        Alert.alert('Error', confirmError.message);
        return;
      }

      Alert.alert(
        'Success',
        'Payment method added successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      Alert.alert('Error', error.message || 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Payment Method</Text>
        <Text style={styles.subtitle}>
          Your payment information is securely stored by Stripe
        </Text>
      </View>

      <View style={styles.cardContainer}>
        <Text style={styles.label}>Card Details</Text>
        <CardField
          postalCodeEnabled={true}
          placeholders={{
            number: '4242 4242 4242 4242',
          }}
          cardStyle={{
            backgroundColor: COLORS.white,
            textColor: COLORS.text,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: BORDER_RADIUS.md,
          }}
          style={styles.cardField}
          onCardChange={(cardDetails) => {
            setCardComplete(cardDetails.complete);
          }}
        />
      </View>

      <View style={styles.securityInfo}>
        <Text style={styles.securityIcon}>🔒</Text>
        <View style={styles.securityTextContainer}>
          <Text style={styles.securityTitle}>Secure Payment</Text>
          <Text style={styles.securityText}>
            Your card information is encrypted and stored securely by Stripe. We never store your
            full card details on our servers.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.addButton, (!cardComplete || loading) && styles.addButtonDisabled]}
        onPress={handleAddPaymentMethod}
        disabled={!cardComplete || loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.addButtonText}>Add Payment Method</Text>
        )}
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Test Cards</Text>
        <Text style={styles.infoText}>For testing, use:</Text>
        <Text style={styles.infoText}>• 4242 4242 4242 4242 (Success)</Text>
        <Text style={styles.infoText}>• Any future expiry date</Text>
        <Text style={styles.infoText}>• Any 3-digit CVC</Text>
        <Text style={styles.infoText}>• Any ZIP code</Text>
      </View>
    </ScrollView>
  );
};

export const PaymentMethodScreen: React.FC = () => {
  const publishableKey = getStripePublishableKey();

  return (
    <StripeProvider publishableKey={publishableKey}>
      <View style={styles.container}>
        <PaymentMethodScreenContent />
      </View>
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
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
  },
  cardContainer: {
    padding: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  cardField: {
    height: 50,
    marginVertical: SPACING.sm,
  },
  securityInfo: {
    flexDirection: 'row',
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  securityIcon: {
    fontSize: FONT_SIZES.xxl,
    marginRight: SPACING.md,
  },
  securityTextContainer: {
    flex: 1,
  },
  securityTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  securityText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.5,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold as any,
  },
  infoBox: {
    margin: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: '#FFF9E6',
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
});
