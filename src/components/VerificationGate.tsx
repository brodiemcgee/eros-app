import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../utils/theme';

interface VerificationGateProps {
  visible: boolean;
  onClose: () => void;
  featureName?: string;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * VerificationGate Component
 *
 * Shows a modal prompting users to get verified to access certain features
 */
export const VerificationGate: React.FC<VerificationGateProps> = ({
  visible,
  onClose,
  featureName = 'this feature'
}) => {
  const navigation = useNavigation<NavigationProp>();

  const handleGetVerified = () => {
    onClose();
    navigation.navigate('AgeVerification');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🛡️</Text>
          </View>

          <Text style={styles.title}>Verification Required</Text>

          <Text style={styles.message}>
            To access {featureName}, you need to verify your age. This helps keep our community safe and authentic.
          </Text>

          <View style={styles.benefits}>
            <View style={styles.benefit}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>Quick verification process</Text>
            </View>
            <View style={styles.benefit}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>Stand out with verified badge</Text>
            </View>
            <View style={styles.benefit}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>Access exclusive features</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleGetVerified}>
            <Text style={styles.primaryButtonText}>Get Verified</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modal: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.large,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  message: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  benefits: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  benefitIcon: {
    fontSize: FONT_SIZES.md,
    color: COLORS.success,
    marginRight: SPACING.sm,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  benefitText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.pill,
    padding: SPACING.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  primaryButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.background,
  },
  secondaryButton: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.pill,
    padding: SPACING.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium as any,
    color: COLORS.textSecondary,
  },
});
