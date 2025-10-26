import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getPaymentHistory, getUserSubscription, cancelSubscription } from '../services/stripe';
import type { PaymentTransaction } from '../services/stripe';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { formatRelativeTime } from '../utils/helpers';

export const BillingHistoryScreen: React.FC = () => {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;

    try {
      const [paymentData, subscriptionData] = await Promise.all([
        getPaymentHistory(user.id),
        getUserSubscription(user.id),
      ]);

      setTransactions(paymentData);

      if (subscriptionData) {
        setHasActiveSubscription(true);
        setSubscriptionId(subscriptionData.id);
      }
    } catch (error) {
      console.error('Error loading billing history:', error);
      Alert.alert('Error', 'Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription?',
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.',
      [
        {
          text: 'No, Keep It',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            if (!subscriptionId) return;

            setCancelling(true);
            try {
              await cancelSubscription(subscriptionId);
              Alert.alert(
                'Subscription Cancelled',
                'Your subscription has been cancelled. You will retain premium access until the end of your billing period.'
              );
              setHasActiveSubscription(false);
            } catch (error: any) {
              console.error('Error cancelling subscription:', error);
              Alert.alert('Error', error.message || 'Failed to cancel subscription');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const renderTransaction = ({ item }: { item: PaymentTransaction }) => {
    const amount = (item.amount / 100).toFixed(2);
    const date = new Date(item.created_at);

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionIconContainer}>
            <Text style={styles.transactionIcon}>
              {item.status === 'completed' ? '✅' : item.status === 'pending' ? '⏳' : '❌'}
            </Text>
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionAmount}>
              ${amount} {item.currency.toUpperCase()}
            </Text>
            <Text style={styles.transactionDate}>
              {date.toLocaleDateString()} at {date.toLocaleTimeString()}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              item.status === 'completed' && styles.statusCompleted,
              item.status === 'pending' && styles.statusPending,
              item.status === 'failed' && styles.statusFailed,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                item.status === 'completed' && styles.statusTextCompleted,
                item.status === 'pending' && styles.statusTextPending,
                item.status === 'failed' && styles.statusTextFailed,
              ]}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        {item.stripe_payment_intent_id && (
          <Text style={styles.transactionId}>ID: {item.stripe_payment_intent_id}</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {hasActiveSubscription && (
        <View style={styles.subscriptionSection}>
          <View style={styles.subscriptionHeader}>
            <Text style={styles.subscriptionTitle}>Active Subscription</Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelSubscription}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color={COLORS.error} />
              ) : (
                <Text style={styles.cancelButtonText}>Cancel</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.subscriptionText}>
            Your premium subscription is currently active
          </Text>
        </View>
      )}

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Payment History</Text>

        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No Transactions Yet</Text>
            <Text style={styles.emptyText}>
              Your payment history will appear here once you make a purchase
            </Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
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
  subscriptionSection: {
    backgroundColor: COLORS.white,
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  subscriptionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text,
  },
  cancelButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.error,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold as any,
  },
  subscriptionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  historySection: {
    flex: 1,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  listContent: {
    gap: SPACING.md,
  },
  transactionCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  transactionIcon: {
    fontSize: FONT_SIZES.xl,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text,
  },
  transactionDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusCompleted: {
    backgroundColor: '#E8F5E9',
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
  },
  statusFailed: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold as any,
  },
  statusTextCompleted: {
    color: '#2E7D32',
  },
  statusTextPending: {
    color: '#F57C00',
  },
  statusTextFailed: {
    color: '#C62828',
  },
  transactionId: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
