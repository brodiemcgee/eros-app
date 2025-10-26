import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, FONT_FAMILIES, SHADOWS } from '../utils/theme';
import {
  getProfileById,
  addFavorite,
  removeFavorite,
  isFavorited,
  blockUser,
  sendTap,
  recordProfileView,
  getUserTribes,
} from '../services/profiles';
import { getOrCreateConversation } from '../services/messaging';
import { ProfileWithPhotos } from '../types/database';
import {
  calculateAge,
  formatHeight,
  formatWeight,
  formatLookingFor,
  formatRelativeTime,
  formatPosition,
  formatBodyHair,
  formatHIVStatus,
  formatSmoking,
  formatDrinking,
  formatLanguages,
  formatMeetingPreferences,
} from '../utils/helpers';
import { PhotoGallery } from '../components/PhotoGallery';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { useFeature } from '../hooks/useFeature';
import { FEATURES, FREE_LIMITS } from '../constants/features';
import { supabase } from '../services/supabase';

type ProfileDetailRouteProp = RouteProp<RootStackParamList, 'ProfileDetail'>;
type ProfileDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProfileDetail'>;

export const ProfileDetailScreen: React.FC = () => {
  const route = useRoute<ProfileDetailRouteProp>();
  const navigation = useNavigation<ProfileDetailNavigationProp>();
  const { user } = useAuth();

  // Feature gates
  const hasUnlimitedTaps = useFeature(FEATURES.UNLIMITED_TAPS);
  const hasUnlimitedFavorites = useFeature(FEATURES.UNLIMITED_FAVORITES);

  const [profile, setProfile] = useState<ProfileWithPhotos | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [tribes, setTribes] = useState<any[]>([]);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    loadProfile();
  }, [route.params.profileId]);

  const loadProfile = async () => {
    const profileData = await getProfileById(route.params.profileId);
    setProfile(profileData);

    if (profileData) {
      const userTribes = await getUserTribes(profileData.id);
      setTribes(userTribes);
    }

    setLoading(false);

    if (user && profileData) {
      const favStatus = await isFavorited(user.id, profileData.id);
      setIsFav(favStatus);

      // Record view
      await recordProfileView(user.id, profileData.id);
    }
  };

  const handleFavorite = async () => {
    if (!user || !profile) return;

    if (isFav) {
      await removeFavorite(user.id, profile.id);
      setIsFav(false);
    } else {
      // Check favorites limit for free users
      if (!hasUnlimitedFavorites) {
        const { data: favorites } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id);

        const favoriteCount = favorites?.length || 0;

        if (favoriteCount >= FREE_LIMITS.MAX_FAVORITES) {
          Alert.alert(
            'Premium Feature',
            `Free users can save up to ${FREE_LIMITS.MAX_FAVORITES} favorites. You currently have ${favoriteCount}. Upgrade to Premium for unlimited favorites.`,
            [{ text: 'OK' }]
          );
          return;
        }
      }

      await addFavorite(user.id, profile.id);
      setIsFav(true);
    }
  };

  const handleMessage = async () => {
    if (!user || !profile) return;

    const conversation = await getOrCreateConversation(user.id, profile.id);
    if (conversation) {
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        otherUserId: profile.id,
      });
    }
  };

  const handleTap = async (tapType: 'flame' | 'woof' | 'looking' | 'friendly' | 'hot') => {
    if (!user || !profile) return;

    // Check taps limit for free users
    if (!hasUnlimitedTaps) {
      // Get start of today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: taps } = await supabase
        .from('taps')
        .select('id')
        .eq('sender_id', user.id)
        .gte('created_at', today.toISOString());

      const tapCount = taps?.length || 0;

      if (tapCount >= FREE_LIMITS.MAX_TAPS_PER_DAY) {
        Alert.alert(
          'Daily Limit Reached',
          `Free users can send up to ${FREE_LIMITS.MAX_TAPS_PER_DAY} taps per day. You've sent ${tapCount} today. Upgrade to Premium for unlimited taps.`,
          [{ text: 'OK' }]
        );
        return;
      }
    }

    const success = await sendTap(user.id, profile.id, tapType);
    if (success) {
      Alert.alert('Success', 'Tap sent!');
    }
  };

  const handleBlock = () => {
    if (!user || !profile) return;

    Alert.alert(
      'Block User',
      `Are you sure you want to block ${profile.display_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            await blockUser(user.id, profile.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleReport = () => {
    if (!profile) return;
    navigation.navigate('ReportUser', { userId: profile.id });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  const age = calculateAge(profile.date_of_birth);
  const primaryPhoto = profile.photos?.find((p) => p.is_primary) || profile.photos?.[0];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      <ScrollView>
        {primaryPhoto && (
          <TouchableOpacity onPress={() => {
            setSelectedPhotoIndex(0);
            setShowPhotoGallery(true);
          }}>
            <Image source={{ uri: primaryPhoto.photo_url }} style={styles.profilePhoto} />
          </TouchableOpacity>
        )}

        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{profile.display_name}</Text>
              {profile.is_verified && <VerifiedBadge size="medium" />}
              {profile.is_online && <View style={styles.onlineDot} />}
            </View>
            <TouchableOpacity onPress={handleFavorite}>
              <Text style={styles.favoriteIcon}>{isFav ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.age}>{age} years old</Text>
          {profile.pronouns && (
            <Text style={styles.pronouns}>{profile.display_name} uses {profile.pronouns} pronouns</Text>
          )}
          {profile.last_active_at && !profile.is_online && (
            <Text style={styles.lastActive}>
              Active {formatRelativeTime(profile.last_active_at)}
            </Text>
          )}

          {/* Bio Card - Hinge style */}
          {profile.bio && (
            <View style={styles.card}>
              <Text style={styles.cardPrompt}>About me</Text>
              <Text style={styles.cardAnswer}>{profile.bio}</Text>
            </View>
          )}

          {/* Looking For Card */}
          {profile.looking_for && profile.looking_for.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardPrompt}>I'm looking for</Text>
              <Text style={styles.cardAnswer}>{formatLookingFor(profile.looking_for)}</Text>
            </View>
          )}

          {/* Stats Card */}
          {(profile.height_cm || profile.weight_kg || profile.body_type) && (
            <View style={styles.card}>
              <Text style={styles.cardPrompt}>The basics</Text>
              <View style={styles.statsGrid}>
                {profile.height_cm && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Height</Text>
                    <Text style={styles.statValue}>{formatHeight(profile.height_cm)}</Text>
                  </View>
                )}
                {profile.weight_kg && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Weight</Text>
                    <Text style={styles.statValue}>{formatWeight(profile.weight_kg)}</Text>
                  </View>
                )}
                {profile.body_type && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Body Type</Text>
                    <Text style={styles.statValue}>
                      {profile.body_type.charAt(0).toUpperCase() + profile.body_type.slice(1)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Tribes Card */}
          {tribes.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardPrompt}>My tribes</Text>
              <View style={styles.tribesContainer}>
                {tribes.map((tribe: any) => (
                  <View key={tribe.id} style={styles.tribeTag}>
                    <Text style={styles.tribeText}>
                      {tribe.icon} {tribe.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* More Details Card */}
          {(profile.position || profile.body_hair || profile.ethnicity) && (
            <View style={styles.card}>
              <Text style={styles.cardPrompt}>More about me</Text>
              <View style={styles.statsGrid}>
                {profile.position && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Position</Text>
                    <Text style={styles.statValue}>{formatPosition(profile.position)}</Text>
                  </View>
                )}
                {profile.body_hair && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Body Hair</Text>
                    <Text style={styles.statValue}>{formatBodyHair(profile.body_hair)}</Text>
                  </View>
                )}
                {profile.ethnicity && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Ethnicity</Text>
                    <Text style={styles.statValue}>{profile.ethnicity}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Sexual Health Card */}
          {profile.hiv_status && (
            <View style={styles.card}>
              <Text style={styles.cardPrompt}>Sexual health</Text>
              <Text style={styles.cardAnswer}>
                HIV Status: {formatHIVStatus(profile.hiv_status)}
                {profile.hiv_last_tested && ` • Last tested: ${new Date(profile.hiv_last_tested).toLocaleDateString()}`}
                {profile.on_prep && ' • On PrEP'}
              </Text>
            </View>
          )}

          {/* Lifestyle Card */}
          {(profile.smoking || profile.drinking) && (
            <View style={styles.card}>
              <Text style={styles.cardPrompt}>Lifestyle</Text>
              <View style={styles.statsGrid}>
                {profile.smoking && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Smoking</Text>
                    <Text style={styles.statValue}>{formatSmoking(profile.smoking)}</Text>
                  </View>
                )}
                {profile.drinking && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Drinking</Text>
                    <Text style={styles.statValue}>{formatDrinking(profile.drinking)}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Languages Card */}
          {profile.languages && profile.languages.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardPrompt}>Languages</Text>
              <Text style={styles.cardAnswer}>{formatLanguages(profile.languages)}</Text>
            </View>
          )}

          {/* Meeting Preferences Card */}
          {(profile.can_host || profile.can_travel || profile.available_now) && (
            <View style={styles.card}>
              <Text style={styles.cardPrompt}>Meeting preferences</Text>
              <Text style={styles.cardAnswer}>
                {formatMeetingPreferences(profile.can_host, profile.can_travel, profile.available_now).join(' • ')}
              </Text>
            </View>
          )}

          <View style={styles.tapsContainer}>
            <Text style={styles.tapsTitle}>Send a Tap</Text>
            <View style={styles.tapsRow}>
              <TouchableOpacity style={styles.tapButton} onPress={() => handleTap('flame')}>
                <Text style={styles.tapIcon}>🔥</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tapButton} onPress={() => handleTap('woof')}>
                <Text style={styles.tapIcon}>🐾</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tapButton} onPress={() => handleTap('looking')}>
                <Text style={styles.tapIcon}>👀</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tapButton} onPress={() => handleTap('friendly')}>
                <Text style={styles.tapIcon}>👋</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tapButton} onPress={() => handleTap('hot')}>
                <Text style={styles.tapIcon}>🌶️</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
            <Text style={styles.messageButtonText}>💬 Send Message</Text>
          </TouchableOpacity>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleBlock}>
              <Text style={styles.actionButtonText}>Block</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleReport}>
              <Text style={styles.actionButtonText}>Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {profile && profile.photos && profile.photos.length > 0 && (
        <PhotoGallery
          photos={profile.photos}
          initialIndex={selectedPhotoIndex}
          visible={showPhotoGallery}
          onClose={() => setShowPhotoGallery(false)}
        />
      )}
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
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.round,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  closeButtonText: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  profilePhoto: {
    width: '100%',
    aspectRatio: 0.9, // Slightly taller
    backgroundColor: COLORS.backgroundTertiary,
  },
  profileInfo: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZES.xxxl, // 28px like Hinge
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.online,
    marginLeft: SPACING.sm,
  },
  favoriteIcon: {
    fontSize: FONT_SIZES.xxxl,
  },
  age: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  pronouns: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  lastActive: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
  },
  // Hinge-style cards
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg, // 16px
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cardPrompt: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: FONT_WEIGHTS.medium as any,
  },
  cardAnswer: {
    fontSize: FONT_SIZES.lg, // 18px
    color: COLORS.text,
    lineHeight: 26,
    fontFamily: FONT_FAMILIES.serif, // Serif font for answers like Hinge
  },
  // Stats grid within cards
  statsGrid: {
    gap: SPACING.md,
  },
  statItem: {
    marginBottom: SPACING.sm,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text,
  },
  tapsContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  tapsTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium as any,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  tapsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tapButton: {
    padding: SPACING.sm,
    alignItems: 'center',
  },
  tapIcon: {
    fontSize: 36,
  },
  messageButton: {
    backgroundColor: COLORS.secondary, // Teal for primary CTA
    borderRadius: BORDER_RADIUS.pill,
    padding: SPACING.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
    ...SHADOWS.small,
  },
  messageButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.background, // White text
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium as any,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
  },
  tribesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  tribeTag: {
    backgroundColor: COLORS.backgroundTertiary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tribeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.medium as any,
  },
});
