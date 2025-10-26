import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../utils/theme';

interface VerifiedBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  style?: ViewStyle;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'medium',
  showLabel = false,
  style
}) => {
  const sizeStyles = {
    small: styles.smallBadge,
    medium: styles.mediumBadge,
    large: styles.largeBadge,
  };

  const iconSizes = {
    small: FONT_SIZES.sm,
    medium: FONT_SIZES.md,
    large: FONT_SIZES.lg,
  };

  return (
    <View style={[styles.container, sizeStyles[size], style]}>
      <Text style={[styles.checkmark, { fontSize: iconSizes[size] }]}>✓</Text>
      {showLabel && <Text style={styles.label}>Verified</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.verified, // Blue verification color
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.xs,
  },
  smallBadge: {
    width: 18,
    height: 18,
  },
  mediumBadge: {
    width: 22,
    height: 22,
  },
  largeBadge: {
    width: 28,
    height: 28,
    paddingHorizontal: SPACING.sm,
  },
  checkmark: {
    color: COLORS.background, // White checkmark
    fontWeight: FONT_WEIGHTS.bold as any,
    textAlign: 'center',
  },
  label: {
    color: COLORS.background,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold as any,
    marginLeft: SPACING.xs,
  },
});
