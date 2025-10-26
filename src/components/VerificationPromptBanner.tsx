import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../utils/theme';

interface VerificationPromptBannerProps {
  variant?: 'compact' | 'full';
  onDismiss?: () => void;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * VerificationPromptBanner Component
 *
 * Displays a banner prompting users to get verified
 * Can be shown on ProfileScreen, ExploreScreen, etc.
 */
export const VerificationPromptBanner: React.FC<VerificationPromptBannerProps> = ({
  variant = 'full',
  onDismiss
}) => {
  const navigation = useNavigation<NavigationProp>();

  const handleGetVerified = () => {
    navigation.navigate('AgeVerification');
  };

  if (variant === 'compact') {
    return (
      <View style={styles.compactBanner}>
        <View style={styles.compactContent}>
          <Text style={styles.compactIcon}>🛡️</Text>
          <View style={styles.compactText}>
            <Text style={styles.compactTitle}>Get Verified</Text>
            <Text style={styles.compactSubtitle}>Stand out with a verified badge</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.compactButton} onPress={handleGetVerified}>
          <Text style={styles.compactButtonText}>Verify →</Text>
        </TouchableOpacity>
        {onDismiss && (
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.fullBanner}>
      {onDismiss && (
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <Text style={styles.dismissButtonText}>✕</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.fullIcon}>🛡️</Text>
      <Text style={styles.fullTitle}>Get Your Verified Badge</Text>
      <Text style={styles.fullMessage}>
        Stand out from the crowd with age verification. Get a blue checkmark on your profile and unlock exclusive features.
      </Text>

      <View style={styles.benefits}>
        <View style={styles.benefit}>
          <Text style={styles.benefitIcon}>✓</Text>
          <Text style={styles.benefitText}>Verified badge</Text>
        </View>
        <View style={styles.benefit}>
          <Text style={styles.benefitIcon}>✓</Text>
          <Text style={styles.benefitText}>Build trust</Text>
        </View>
        <View style={styles.benefit}>
          <Text style={styles.benefitIcon}>✓</Text>
          <Text style={styles.benefitText}>Unlock features</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.fullButton} onPress={handleGetVerified}>
        <Text style={styles.fullButtonText}>Get Verified Now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Compact banner styles
  compactBanner: {
    backgroundColor: COLORS.verified + '10', // 10% opacity
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.verified + '30', // 30% opacity
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.small,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactIcon: {
    fontSize: FONT_SIZES.xxl,
    marginRight: SPACING.sm,
  },
  compactText: {
    flex: 1,
  },
  compactTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  compactSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  compactButton: {
    backgroundColor: COLORS.verified,
    borderRadius: BORDER_RADIUS.pill,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  compactButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.background,
  },

  // Full banner styles
  fullBanner: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.verified,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.card,
    position: 'relative',
  },
  fullIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  fullTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  fullMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  benefits: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.verified,
    marginRight: SPACING.xs,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  benefitText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.medium as any,
  },
  fullButton: {
    backgroundColor: COLORS.verified,
    borderRadius: BORDER_RADIUS.pill,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    width: '100%',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  fullButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.background,
  },
  dismissButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    padding: SPACING.xs,
    zIndex: 1,
  },
  dismissButtonText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
});
