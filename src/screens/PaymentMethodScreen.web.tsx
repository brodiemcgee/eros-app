import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../utils/theme';

// Web version of PaymentMethodScreen - Payment management requires mobile app
export const PaymentMethodScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Text style={styles.icon}>💳</Text>
        <Text style={styles.title}>Payment Methods on Mobile</Text>
        <Text style={styles.message}>
          Payment method management is available exclusively through our mobile app for security reasons.
        </Text>
        <Text style={[styles.message, { marginTop: SPACING.md }]}>
          Download the Thirsty mobile app to:
        </Text>
        <View style={styles.featuresList}>
          <Text style={styles.feature}>💳 Add payment methods</Text>
          <Text style={styles.feature}>🔒 Securely manage cards</Text>
          <Text style={styles.feature}>⭐ Subscribe to Premium</Text>
          <Text style={styles.feature}>📊 View billing history</Text>
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
