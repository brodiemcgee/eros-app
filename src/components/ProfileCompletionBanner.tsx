import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../utils/theme';
import { Profile } from '../types/database';

interface ProfileCompletionBannerProps {
  profile: Profile;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileCompletionBanner: React.FC<ProfileCompletionBannerProps> = ({ profile }) => {
  const navigation = useNavigation<NavigationProp>();

  const calculateCompletion = (): number => {
    const fields = [
      profile.display_name,
      profile.bio,
      profile.date_of_birth,
      profile.height_cm,
      profile.weight_kg,
      profile.body_type,
      profile.ethnicity,
      profile.pronouns,
      profile.position,
      profile.body_hair,
      profile.smoking,
      profile.drinking,
      profile.languages && profile.languages.length > 0,
      profile.hiv_status,
      profile.looking_for && profile.looking_for.length > 0,
      // Check if user has at least one photo
      true, // Placeholder - would check profile_photos count
    ];

    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const completion = calculateCompletion();

  if (completion >= 90) {
    return null; // Don't show banner if profile is mostly complete
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('EditProfile')}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            {completion}% complete • Get more views by finishing your profile
          </Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressBar, { width: `${completion}%` }]} />
          </View>
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  textContainer: {
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  progressContainer: {
    width: '100%',
  },
  progressBackground: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  arrow: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
    marginLeft: SPACING.md,
  },
});
