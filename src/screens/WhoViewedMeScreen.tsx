import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, FONT_FAMILIES, SHADOWS } from '../utils/theme';
import { ProfileWithPhotos } from '../types/database';
import { getProfileViewers } from '../services/profiles';
import { calculateAge, formatRelativeTime } from '../utils/helpers';

type WhoViewedMeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const WhoViewedMeScreen: React.FC = () => {
  const navigation = useNavigation<WhoViewedMeNavigationProp>();
  const { user, profile } = useAuth();

  const [viewers, setViewers] = useState<ProfileWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadViewers();
  }, []);

  const loadViewers = async () => {
    if (!user) return;

    // Check if user has premium
    if (!profile?.is_premium) {
      setLoading(false);
      return;
    }

    const viewersList = await getProfileViewers(user.id);
    setViewers(viewersList);
    setLoading(false);
  };

  const renderViewer = ({ item }: { item: ProfileWithPhotos }) => {
    const age = calculateAge(item.date_of_birth);
    const primaryPhoto = item.photos?.find((p) => p.is_primary) || item.photos?.[0];

    return (
      <TouchableOpacity
        style={styles.viewerItem}
        onPress={() => navigation.navigate('ProfileDetail', { profileId: item.id })}
      >
        {primaryPhoto ? (
          <Image source={{ uri: primaryPhoto.photo_url }} style={styles.viewerPhoto} />
        ) : (
          <View style={[styles.viewerPhoto, styles.placeholderPhoto]}>
            <Text style={styles.placeholderText}>No Photo</Text>
          </View>
        )}
        <View style={styles.viewerInfo}>
          <View style={styles.viewerHeader}>
            <Text style={styles.viewerName}>{item.display_name}</Text>
            {item.is_online && <View style={styles.onlineDot} />}
          </View>
          <Text style={styles.viewerAge}>{age} years</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!profile?.is_premium) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Who Viewed Me</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.premiumContainer}>
          <Text style={styles.premiumIcon}>👑</Text>
          <Text style={styles.premiumTitle}>Premium Feature</Text>
          <Text style={styles.premiumText}>
            See who's checking out your profile! Upgrade to premium to view your profile visitors.
          </Text>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Who Viewed Me</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={viewers}
        renderItem={renderViewer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No views yet</Text>
            <Text style={styles.emptySubtext}>
              When someone views your profile, they'll appear here
            </Text>
          </View>
        }
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
  },
  premiumContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  premiumIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  premiumTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  premiumText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  upgradeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  upgradeButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.background,
  },
  listContainer: {
    padding: SPACING.md,
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  viewerPhoto: {
    width: 70,
    height: 70,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundTertiary,
  },
  placeholderPhoto: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  viewerInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  viewerName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.online,
    marginLeft: SPACING.sm,
  },
  viewerAge: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    marginTop: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
