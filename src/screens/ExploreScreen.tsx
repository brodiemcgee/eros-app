import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../utils/theme';
import { ProfileWithDistance } from '../types/database';
import { getNearbyProfiles, updateOnlineStatus } from '../services/profiles';
import { getCurrentLocation } from '../services/location';
import { calculateAge, formatDistance } from '../utils/helpers';

type ExploreScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ExploreScreen: React.FC = () => {
  const navigation = useNavigation<ExploreScreenNavigationProp>();
  const { user, profile } = useAuth();

  const [profiles, setProfiles] = useState<ProfileWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfiles = useCallback(async () => {
    if (!user || !profile) return;

    try {
      const coords = await getCurrentLocation();
      if (coords) {
        const nearbyProfiles = await getNearbyProfiles(
          coords.latitude,
          coords.longitude,
          50, // 50km radius
          100 // limit
        );

        // Filter out current user
        const filtered = nearbyProfiles.filter((p) => p.id !== user.id);
        setProfiles(filtered);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, profile]);

  useEffect(() => {
    loadProfiles();

    // Update online status
    if (user) {
      updateOnlineStatus(user.id, true);
    }

    // Update online status on unmount
    return () => {
      if (user) {
        updateOnlineStatus(user.id, false);
      }
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfiles();
  };

  const renderProfile = ({ item }: { item: ProfileWithDistance }) => {
    const age = calculateAge(item.date_of_birth);
    const primaryPhoto = item.photos?.find((p) => p.is_primary) || item.photos?.[0];

    return (
      <TouchableOpacity
        style={styles.profileCard}
        onPress={() => navigation.navigate('ProfileDetail', { profileId: item.id })}
      >
        {primaryPhoto ? (
          <Image source={{ uri: primaryPhoto.photo_url }} style={styles.profileImage} />
        ) : (
          <View style={[styles.profileImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>No Photo</Text>
          </View>
        )}

        <View style={styles.profileInfo}>
          <View style={styles.profileHeader}>
            <Text style={styles.profileName} numberOfLines={1}>
              {item.display_name}
            </Text>
            {item.is_online && <View style={styles.onlineDot} />}
          </View>
          <Text style={styles.profileAge}>{age} years</Text>
          {item.show_distance && (
            <Text style={styles.profileDistance}>
              {formatDistance(item.distance_km, profile?.distance_unit)}
            </Text>
          )}
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => navigation.navigate('Filters')}
        >
          <Text style={styles.filterButtonText}>🔧 Filters</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={profiles}
        renderItem={renderProfile}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No profiles nearby</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters or check back later</Text>
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
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
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
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: BORDER_RADIUS.md,
  },
  filterButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
  },
  gridContainer: {
    padding: SPACING.sm,
  },
  profileCard: {
    flex: 1,
    margin: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.backgroundTertiary,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
  },
  profileInfo: {
    padding: SPACING.sm,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  profileName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
    flex: 1,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.online,
    marginLeft: SPACING.xs,
  },
  profileAge: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  profileDistance: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
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
