import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../utils/theme';
import { calculateAge, formatHeight, formatWeight, formatLookingFor } from '../utils/helpers';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { profile, signOut } = useAuth();

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  const age = calculateAge(profile.date_of_birth);
  const primaryPhoto = profile.photos?.find((p) => p.is_primary) || profile.photos?.[0];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {primaryPhoto && (
        <Image source={{ uri: primaryPhoto.photo_url }} style={styles.profilePhoto} />
      )}

      <View style={styles.profileInfo}>
        <Text style={styles.name}>{profile.display_name}</Text>
        <Text style={styles.age}>{age} years old</Text>

        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        <View style={styles.statsContainer}>
          {profile.height_cm && (
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Height</Text>
              <Text style={styles.statValue}>{formatHeight(profile.height_cm)}</Text>
            </View>
          )}
          {profile.weight_kg && (
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Weight</Text>
              <Text style={styles.statValue}>{formatWeight(profile.weight_kg)}</Text>
            </View>
          )}
          {profile.body_type && (
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Body Type</Text>
              <Text style={styles.statValue}>
                {profile.body_type.charAt(0).toUpperCase() + profile.body_type.slice(1)}
              </Text>
            </View>
          )}
        </View>

        {profile.looking_for && profile.looking_for.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Looking For</Text>
            <Text style={styles.sectionContent}>{formatLookingFor(profile.looking_for)}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.primary,
  },
  settingsButton: {
    padding: SPACING.sm,
  },
  settingsButtonText: {
    fontSize: FONT_SIZES.xl,
  },
  profilePhoto: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.backgroundTertiary,
  },
  profileInfo: {
    padding: SPACING.lg,
  },
  name: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  age: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  bio: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
  },
  stat: {
    width: '33%',
    marginBottom: SPACING.md,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium as any,
    color: COLORS.text,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  sectionContent: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  editButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  editButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.background,
  },
  signOutButton: {
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});
