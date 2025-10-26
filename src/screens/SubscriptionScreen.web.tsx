import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../utils/theme';

// Web version of SubscriptionScreen - Premium features require mobile app
export const SubscriptionScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Text style={styles.icon}>📱</Text>
        <Text style={styles.title}>Premium on Mobile</Text>
        <Text style={styles.message}>
          Premium subscriptions are available exclusively through our mobile app.
        </Text>
        <Text style={[styles.message, { marginTop: SPACING.md }]}>
          Download Thirsty from the App Store or Google Play to:
        </Text>
        <View style={styles.featuresList}>
          <Text style={styles.feature}>⭐ Upgrade to Premium</Text>
          <Text style={styles.feature}>👁️ See who viewed your profile</Text>
          <Text style={styles.feature}>🔍 Access advanced filters</Text>
          <Text style={styles.feature}>💬 Unlimited messaging</Text>
          <Text style={styles.feature}>🚫 Ad-free experience</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  messageContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    maxWidth: 500,
    width: '100%',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  icon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  message: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresList: {
    marginTop: SPACING.lg,
    alignSelf: 'stretch',
    gap: SPACING.sm,
  },
  feature: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    paddingVertical: SPACING.xs,
  },
});
