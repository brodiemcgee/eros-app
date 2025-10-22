import { supabase } from './supabase';
import { Profile, ProfileWithPhotos, ProfileWithDistance, Tap, TapType, ReportReason } from '../types/database';

// Get nearby profiles with distance filtering
export const getNearbyProfiles = async (
  latitude: number,
  longitude: number,
  maxDistanceKm: number = 50,
  limit: number = 100
): Promise<ProfileWithDistance[]> => {
  const { data, error } = await supabase.rpc('get_nearby_profiles', {
    user_lat: latitude,
    user_lng: longitude,
    max_distance_km: maxDistanceKm,
    limit_count: limit,
  });

  if (error) {
    console.error('Error fetching nearby profiles:', error);
    return [];
  }

  // Fetch photos for each profile
  const profileIds = data.map((p: any) => p.profile_id);

  const { data: photos } = await supabase
    .from('profile_photos')
    .select('*')
    .in('profile_id', profileIds);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', profileIds);

  // Combine data
  return data.map((p: any) => {
    const profile = profiles?.find((prof) => prof.id === p.profile_id);
    const profilePhotos = photos?.filter((photo) => photo.profile_id === p.profile_id) || [];

    return {
      ...profile,
      photos: profilePhotos,
      distance_km: p.distance_km,
    } as ProfileWithDistance;
  });
};

// Get profile by ID
export const getProfileById = async (profileId: string): Promise<ProfileWithPhotos | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, photos:profile_photos(*)')
    .eq('id', profileId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data as ProfileWithPhotos;
};

// Update profile
export const updateProfile = async (
  profileId: string,
  updates: Partial<Profile>
): Promise<boolean> => {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', profileId);

  if (error) {
    console.error('Error updating profile:', error);
    return false;
  }

  return true;
};

// Update online status
export const updateOnlineStatus = async (
  profileId: string,
  isOnline: boolean
): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_online: isOnline,
      last_active_at: new Date().toISOString(),
    })
    .eq('id', profileId);

  if (error) {
    console.error('Error updating online status:', error);
  }
};

// Add profile photo
export const addProfilePhoto = async (
  profileId: string,
  photoUrl: string,
  displayOrder: number,
  isPrimary: boolean = false
): Promise<boolean> => {
  const { error } = await supabase
    .from('profile_photos')
    .insert({
      profile_id: profileId,
      photo_url: photoUrl,
      display_order: displayOrder,
      is_primary: isPrimary,
    });

  if (error) {
    console.error('Error adding profile photo:', error);
    return false;
  }

  return true;
};

// Delete profile photo
export const deleteProfilePhoto = async (photoId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('profile_photos')
    .delete()
    .eq('id', photoId);

  if (error) {
    console.error('Error deleting profile photo:', error);
    return false;
  }

  return true;
};

// Record profile view
export const recordProfileView = async (
  viewerId: string,
  viewedProfileId: string
): Promise<void> => {
  const { error } = await supabase
    .from('profile_views')
    .insert({
      viewer_id: viewerId,
      viewed_profile_id: viewedProfileId,
    });

  if (error && !error.message.includes('duplicate')) {
    console.error('Error recording profile view:', error);
  }
};

// Get who viewed my profile (premium feature)
export const getProfileViewers = async (profileId: string): Promise<ProfileWithPhotos[]> => {
  const { data, error } = await supabase
    .from('profile_views')
    .select(`
      viewer_id,
      created_at,
      viewer:profiles!profile_views_viewer_id_fkey(*, photos:profile_photos(*))
    `)
    .eq('viewed_profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching profile viewers:', error);
    return [];
  }

  return data.map((v: any) => v.viewer as ProfileWithPhotos);
};

// Get favorites
export const getFavorites = async (userId: string): Promise<ProfileWithPhotos[]> => {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      favorited_user_id,
      created_at,
      favorited_user:profiles!favorites_favorited_user_id_fkey(*, photos:profile_photos(*))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }

  return data.map((f: any) => f.favorited_user as ProfileWithPhotos);
};

// Add to favorites
export const addFavorite = async (userId: string, favoritedUserId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('favorites')
    .insert({
      user_id: userId,
      favorited_user_id: favoritedUserId,
    });

  if (error) {
    console.error('Error adding favorite:', error);
    return false;
  }

  return true;
};

// Remove from favorites
export const removeFavorite = async (userId: string, favoritedUserId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('favorited_user_id', favoritedUserId);

  if (error) {
    console.error('Error removing favorite:', error);
    return false;
  }

  return true;
};

// Check if user is favorited
export const isFavorited = async (userId: string, profileId: string): Promise<boolean> => {
  const { count } = await supabase
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('favorited_user_id', profileId);

  return (count || 0) > 0;
};

// Block user
export const blockUser = async (blockerId: string, blockedId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('blocks')
    .insert({
      blocker_id: blockerId,
      blocked_id: blockedId,
    });

  if (error) {
    console.error('Error blocking user:', error);
    return false;
  }

  return true;
};

// Unblock user
export const unblockUser = async (blockerId: string, blockedId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);

  if (error) {
    console.error('Error unblocking user:', error);
    return false;
  }

  return true;
};

// Get blocked users
export const getBlockedUsers = async (userId: string): Promise<ProfileWithPhotos[]> => {
  const { data, error } = await supabase
    .from('blocks')
    .select(`
      blocked_id,
      created_at,
      blocked_user:profiles!blocks_blocked_id_fkey(*, photos:profile_photos(*))
    `)
    .eq('blocker_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching blocked users:', error);
    return [];
  }

  return data.map((b: any) => b.blocked_user as ProfileWithPhotos);
};

// Check if user is blocked
export const isBlocked = async (userId: string, profileId: string): Promise<boolean> => {
  const { count } = await supabase
    .from('blocks')
    .select('*', { count: 'exact', head: true })
    .or(`and(blocker_id.eq.${userId},blocked_id.eq.${profileId}),and(blocker_id.eq.${profileId},blocked_id.eq.${userId})`);

  return (count || 0) > 0;
};

// Send tap
export const sendTap = async (
  senderId: string,
  receiverId: string,
  tapType: TapType
): Promise<boolean> => {
  const { error } = await supabase
    .from('taps')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      tap_type: tapType,
    });

  if (error) {
    console.error('Error sending tap:', error);
    return false;
  }

  return true;
};

// Get received taps
export const getReceivedTaps = async (userId: string): Promise<Tap[]> => {
  const { data, error } = await supabase
    .from('taps')
    .select('*')
    .eq('receiver_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching taps:', error);
    return [];
  }

  return data;
};

// Mark tap as read
export const markTapAsRead = async (tapId: string): Promise<void> => {
  const { error } = await supabase
    .from('taps')
    .update({ is_read: true })
    .eq('id', tapId);

  if (error) {
    console.error('Error marking tap as read:', error);
  }
};

// Report user
export const reportUser = async (
  reporterId: string,
  reportedUserId: string,
  reason: ReportReason,
  description?: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      reason,
      description: description || null,
    });

  if (error) {
    console.error('Error reporting user:', error);
    return false;
  }

  return true;
};

// Get all tribes
export const getAllTribes = async () => {
  const { data, error } = await supabase
    .from('tribes')
    .select('*')
    .order('display_order');

  if (error) {
    console.error('Error fetching tribes:', error);
    return [];
  }

  return data;
};

// Get user's tribes
export const getUserTribes = async (userId: string) => {
  const { data, error } = await supabase
    .from('profile_tribes')
    .select('tribe_id, tribes(*)')
    .eq('profile_id', userId);

  if (error) {
    console.error('Error fetching user tribes:', error);
    return [];
  }

  return data.map((pt: any) => pt.tribes);
};

// Add tribe to user profile
export const addTribeToProfile = async (userId: string, tribeId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('profile_tribes')
    .insert({
      profile_id: userId,
      tribe_id: tribeId,
    });

  if (error) {
    console.error('Error adding tribe:', error);
    return false;
  }

  return true;
};

// Remove tribe from user profile
export const removeTribeFromProfile = async (userId: string, tribeId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('profile_tribes')
    .delete()
    .eq('profile_id', userId)
    .eq('tribe_id', tribeId);

  if (error) {
    console.error('Error removing tribe:', error);
    return false;
  }

  return true;
};

// Set user tribes (replace all)
export const setUserTribes = async (userId: string, tribeIds: string[]): Promise<boolean> => {
  // First, delete all existing tribes
  await supabase
    .from('profile_tribes')
    .delete()
    .eq('profile_id', userId);

  // Then insert new ones
  if (tribeIds.length > 0) {
    const { error } = await supabase
      .from('profile_tribes')
      .insert(
        tribeIds.map(tribeId => ({
          profile_id: userId,
          tribe_id: tribeId,
        }))
      );

    if (error) {
      console.error('Error setting tribes:', error);
      return false;
    }
  }

  return true;
};
