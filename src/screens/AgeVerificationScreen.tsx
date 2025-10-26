import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { createVerificationSession, checkVerificationStatus, VerificationStatus } from '../services/verification';

type VerificationNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export const AgeVerificationScreen: React.FC = () => {
  const navigation = useNavigation<VerificationNavigationProp>();
  const { user, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState<VerificationStatus | null>(null);

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    if (!user) return;

    try {
      const verificationStatus = await checkVerificationStatus();
      setStatus(verificationStatus);
    } catch (error: any) {
      console.error('Error loading verification status:', error);
      Alert.alert('Error', 'Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const handleStartVerification = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Mobile Only',
        'Age verification is only available on the mobile app. Please download the Thirsty app from the App Store or Google Play to get verified.',
        [{ text: 'OK' }]
      );
      return;
    }

    setVerifying(true);

    try {
      // Create verification session
      const { client_secret } = await createVerificationSession();

      // TODO: Open Stripe Identity native SDK
      // This requires @stripe/stripe-identity-react-native
      // For now, show a message
      Alert.alert(
        'Verification Ready',
        'Stripe Identity verification will open here. (SDK integration pending)',
        [
          {
            text: 'OK',
            onPress: () => {
              // After Stripe verification completes, refresh status
              setTimeout(() => {
                loadVerificationStatus();
                refreshProfile();
              }, 1000);
            },
          },
        ]
      );

      // Example of how it will work with the SDK:
      // const { VerificationSheet } = require('@stripe/stripe-identity-react-native');
      // const result = await VerificationSheet.present({
      //   clientSecret: client_secret,
      // });
      // if (result.status === 'succeeded') {
      //   // Verification complete
      //   await loadVerificationStatus();
      //   await refreshProfile();
      // }
    } catch (error: any) {
      console.error('Error starting verification:', error);
      Alert.alert('Error', error.message || 'Failed to start verification');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Already verified
  if (status?.is_verified && !status.is_expired) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Age Verification</Text>
        </View>

        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>You're Verified!</Text>
          <Text style={styles.successText}>
            Your age has been verified on {new Date(status.verified_at!).toLocaleDateString()}
          </Text>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>Verified badge on your profile</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>Access to verified-only features</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>Higher trust in the community</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>Priority in search results</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Back to Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Pending verification
  if (status?.latest_request_status === 'pending') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Age Verification</Text>
        </View>

        <View style={styles.pendingCard}>
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.pendingIcon} />
          <Text style={styles.pendingTitle}>Verification Pending</Text>
          <Text style={styles.pendingText}>
            Your verification is being processed. This usually takes just a few minutes.
          </Text>
          <Text style={styles.pendingSubtext}>
            You'll receive a notification once verification is complete.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            loadVerificationStatus();
            refreshProfile();
          }}
        >
          <Text style={styles.secondaryButtonText}>Refresh Status</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ghostButton} onPress={() => navigation.goBack()}>
          <Text style={styles.ghostButtonText}>Back to Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Not verified - show verification flow
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Get Verified</Text>
      </View>

      <View style={styles.heroSection}>
        <Text style={styles.heroIcon}>🛡️</Text>
        <Text style={styles.heroTitle}>Stand Out with Verification</Text>
        <Text style={styles.heroSubtitle}>
          Get a verified badge and unlock premium features by confirming your age
        </Text>
      </View>

      <View style={styles.benefitsSection}>
        <Text style={styles.sectionTitle}>What You'll Get</Text>

        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Verified Badge</Text>
              <Text style={styles.benefitDescription}>Blue checkmark on your profile</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🔓</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Unlock Features</Text>
              <Text style={styles.benefitDescription}>Access verified-only content and filters</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⭐</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Higher Trust</Text>
              <Text style={styles.benefitDescription}>Stand out from unverified profiles</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🚀</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Priority Visibility</Text>
              <Text style={styles.benefitDescription}>Appear higher in search results</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.howItWorksSection}>
        <Text style={styles.sectionTitle}>How It Works</Text>

        <View style={styles.stepsList}>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Take a Selfie</Text>
              <Text style={styles.stepDescription}>Quick photo to verify it's you</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Scan Your ID</Text>
              <Text style={styles.stepDescription}>Driver's license, passport, or ID card</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Get Verified</Text>
              <Text style={styles.stepDescription}>Instant approval in most cases</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.privacySection}>
        <Text style={styles.privacyIcon}>🔒</Text>
        <Text style={styles.privacyTitle}>Your Privacy is Protected</Text>
        <Text style={styles.privacyText}>
          Verification is handled by Stripe Identity, a trusted payment processor. Your documents are encrypted and
          never stored on our servers. We only receive verification confirmation.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, verifying && styles.buttonDisabled]}
        onPress={handleStartVerification}
        disabled={verifying}
      >
        {verifying ? (
          <ActivityIndicator color={COLORS.background} />
        ) : (
          <Text style={styles.primaryButtonText}>Start Verification</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.ghostButton} onPress={() => navigation.goBack()}>
        <Text style={styles.ghostButtonText}>Maybe Later</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Takes about 2 minutes • Secure & encrypted • One-time process
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  backButtonText: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.text,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  benefitsList: {
    gap: SPACING.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  benefitIcon: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.sm,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text,
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  benefitText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
  },
  howItWorksSection: {
    marginBottom: SPACING.xl,
  },
  stepsList: {
    gap: SPACING.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stepNumberText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.background,
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text,
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  privacySection: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  privacyIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  privacyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  privacyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  primaryButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.background,
  },
  secondaryButton: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text,
  },
  ghostButton: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  ghostButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  disclaimer: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  successCard: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  successIcon: {
    fontSize: 64,
    color: COLORS.success,
    marginBottom: SPACING.md,
  },
  successTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.success,
    marginBottom: SPACING.sm,
  },
  successText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  pendingCard: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  pendingIcon: {
    marginBottom: SPACING.md,
  },
  pendingTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  pendingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  pendingSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
