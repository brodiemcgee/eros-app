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
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../utils/theme';
import {
  getProfileById,
  addFavorite,
  removeFavorite,
  isFavorited,
  blockUser,
  sendTap,
  recordProfileView,
} from '../services/profiles';
import { getOrCreateConversation } from '../services/messaging';
import { ProfileWithPhotos } from '../types/database';
import { calculateAge, formatHeight, formatWeight, formatLookingFor, formatRelativeTime } from '../utils/helpers';

type ProfileDetailRouteProp = RouteProp<RootStackParamList, 'ProfileDetail'>;
type ProfileDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProfileDetail'>;

export const ProfileDetailScreen: React.FC = () => {
  const route = useRoute<ProfileDetailRouteProp>();
  const navigation = useNavigation<ProfileDetailNavigationProp>();
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileWithPhotos | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [route.params.profileId]);

  const loadProfile = async () => {
    const profileData = await getProfileById(route.params.profileId);
    setProfile(profileData);
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
          <Image source={{ uri: primaryPhoto.photo_url }} style={styles.profilePhoto} />
        )}

        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{profile.display_name}</Text>
              {profile.is_online && <View style={styles.onlineDot} />}
            </View>
            <TouchableOpacity onPress={handleFavorite}>
              <Text style={styles.favoriteIcon}>{isFav ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.age}>{age} years old</Text>
          {profile.last_active_at && !profile.is_online && (
            <Text style={styles.lastActive}>
              Active {formatRelativeTime(profile.last_active_at)}
            </Text>
          )}

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
            <Text style={styles.messageButtonText}>Send Message</Text>
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
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: COLORS.overlay,
    borderRadius: BORDER_RADIUS.round,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
  },
  profilePhoto: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.backgroundTertiary,
  },
  profileInfo: {
    padding: SPACING.lg,
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
    fontSize: FONT_SIZES.xxl,
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
    fontSize: FONT_SIZES.xxl,
  },
  age: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  lastActive: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  bio: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginTop: SPACING.md,
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
  tapsContainer: {
    marginBottom: SPACING.lg,
  },
  tapsTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  tapsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tapButton: {
    padding: SPACING.sm,
  },
  tapIcon: {
    fontSize: 32,
  },
  messageButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  messageButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.background,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
    padding: SPACING.sm,
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
  },
});
