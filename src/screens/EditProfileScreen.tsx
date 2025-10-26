import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, Switch, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, FONT_FAMILIES, SHADOWS } from '../utils/theme';
import { updateProfile, getUserTribes, setUserTribes, addProfilePhoto } from '../services/profiles';
import { TribeSelector } from '../components/TribeSelector';
import { BodyHair, HIVStatus, Position, Smoking, Drinking } from '../types/database';
import { useFeature } from '../hooks/useFeature';
import { FEATURES, FREE_LIMITS } from '../constants/features';
import { pickImage, uploadProfilePhoto } from '../services/imageUpload';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { profile, refreshProfile } = useAuth();

  // Feature gate
  const hasUnlimitedPhotos = useFeature(FEATURES.UNLIMITED_PHOTOS);

  // Basic info
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');

  // Physical attributes
  const [heightCm, setHeightCm] = useState(profile?.height_cm?.toString() || '');
  const [weightKg, setWeightKg] = useState(profile?.weight_kg?.toString() || '');
  const [bodyType, setBodyType] = useState(profile?.body_type || '');
  const [ethnicity, setEthnicity] = useState(profile?.ethnicity || '');

  // Identity
  const [pronouns, setPronouns] = useState(profile?.pronouns || '');

  // Preferences
  const [position, setPosition] = useState<Position | null>(profile?.position || null);
  const [bodyHair, setBodyHair] = useState<BodyHair | null>(profile?.body_hair || null);
  const [smoking, setSmoking] = useState<Smoking | null>(profile?.smoking || null);
  const [drinking, setDrinking] = useState<Drinking | null>(profile?.drinking || null);

  // Sexual health
  const [hivStatus, setHivStatus] = useState<HIVStatus | null>(profile?.hiv_status || null);
  const [onPrep, setOnPrep] = useState(profile?.on_prep || false);

  // Meeting preferences
  const [canHost, setCanHost] = useState(profile?.can_host || false);
  const [canTravel, setCanTravel] = useState(profile?.can_travel || false);
  const [availableNow, setAvailableNow] = useState(profile?.available_now || false);

  // Tribes
  const [selectedTribeIds, setSelectedTribeIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserTribes();
  }, []);

  const loadUserTribes = async () => {
    if (!profile) return;
    const tribes = await getUserTribes(profile.id);
    setSelectedTribeIds(tribes.map(t => t.id));
  };

  const handleSave = async () => {
    if (!profile) return;

    setLoading(true);

    const updates: any = {
      display_name: displayName,
      bio: bio || null,
      height_cm: heightCm ? parseInt(heightCm) : null,
      weight_kg: weightKg ? parseInt(weightKg) : null,
      body_type: bodyType || null,
      ethnicity: ethnicity || null,
      pronouns: pronouns || null,
      position: position,
      body_hair: bodyHair,
      smoking: smoking,
      drinking: drinking,
      hiv_status: hivStatus,
      on_prep: onPrep,
      can_host: canHost,
      can_travel: canTravel,
      available_now: availableNow,
    };

    const success = await updateProfile(profile.id, updates);

    // Update tribes
    if (success) {
      await setUserTribes(profile.id, selectedTribeIds);
    }

    setLoading(false);

    if (success) {
      await refreshProfile();
      Alert.alert('Success', 'Profile updated');
      navigation.goBack();
    } else {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleAddPhoto = async () => {
    if (!profile) return;

    // Check photo limit for free users
    if (!hasUnlimitedPhotos) {
      const photoCount = profile.photos?.length || 0;

      if (photoCount >= FREE_LIMITS.MAX_PHOTOS) {
        Alert.alert(
          'Photo Limit Reached',
          `Free users can upload up to ${FREE_LIMITS.MAX_PHOTOS} photos. You currently have ${photoCount}. Upgrade to Premium for unlimited photos.`,
          [{ text: 'OK' }]
        );
        return;
      }
    }

    try {
      const imageUri = await pickImage();
      if (!imageUri) return;

      setLoading(true);

      const photoCount = profile.photos?.length || 0;
      const { url } = await uploadProfilePhoto(profile.id, imageUri, photoCount);
      await addProfilePhoto(profile.id, url, photoCount, photoCount === 0);

      await refreshProfile();
      Alert.alert('Success', 'Photo added');
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  const renderPicker = (
    label: string,
    value: string | null,
    options: { label: string; value: string }[],
    onChange: (value: any) => void
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pickerOption,
              value === option.value && styles.pickerOptionSelected,
            ]}
            onPress={() => onChange(option.value)}
          >
            <Text
              style={[
                styles.pickerOptionText,
                value === option.value && styles.pickerOptionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.form}>
        {/* Basic Info */}
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          editable={!loading}
          placeholder="Your display name"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          editable={!loading}
          placeholder="Tell us about yourself..."
          placeholderTextColor={COLORS.textMuted}
        />

        {/* Photos */}
        <View style={styles.photosHeader}>
          <Text style={styles.sectionTitle}>Photos</Text>
          {!hasUnlimitedPhotos && (
            <Text style={styles.photoLimit}>
              {profile?.photos?.length || 0}/{FREE_LIMITS.MAX_PHOTOS}
            </Text>
          )}
        </View>

        <View style={styles.photosGrid}>
          {profile?.photos?.map((photo, index) => (
            <View key={photo.id} style={styles.photoThumbnail}>
              <Image source={{ uri: photo.photo_url }} style={styles.photoImage} />
              {photo.is_primary && <Text style={styles.primaryBadge}>Primary</Text>}
            </View>
          ))}
          <TouchableOpacity
            style={styles.addPhotoButton}
            onPress={handleAddPhoto}
            disabled={loading || (!hasUnlimitedPhotos && (profile?.photos?.length || 0) >= FREE_LIMITS.MAX_PHOTOS)}
          >
            <Text style={styles.addPhotoIcon}>+</Text>
            <Text style={styles.addPhotoText}>
              {!hasUnlimitedPhotos && (profile?.photos?.length || 0) >= FREE_LIMITS.MAX_PHOTOS
                ? '👑 Premium'
                : 'Add Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Physical Attributes */}
        <Text style={styles.sectionTitle}>Physical Attributes</Text>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="numeric"
              placeholder="175"
              placeholderTextColor={COLORS.textMuted}
              editable={!loading}
            />
          </View>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="numeric"
              placeholder="70"
              placeholderTextColor={COLORS.textMuted}
              editable={!loading}
            />
          </View>
        </View>

        <Text style={styles.label}>Body Type</Text>
        <TextInput
          style={styles.input}
          value={bodyType}
          onChangeText={setBodyType}
          placeholder="e.g., Athletic, Average, Slim"
          placeholderTextColor={COLORS.textMuted}
          editable={!loading}
        />

        <Text style={styles.label}>Ethnicity</Text>
        <TextInput
          style={styles.input}
          value={ethnicity}
          onChangeText={setEthnicity}
          placeholder="Your ethnicity"
          placeholderTextColor={COLORS.textMuted}
          editable={!loading}
        />

        {/* Identity */}
        <Text style={styles.sectionTitle}>Identity</Text>

        <Text style={styles.label}>Pronouns</Text>
        <TextInput
          style={styles.input}
          value={pronouns}
          onChangeText={setPronouns}
          placeholder="e.g., he/him, they/them"
          placeholderTextColor={COLORS.textMuted}
          editable={!loading}
        />

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>

        {renderPicker('Position', position, [
          { label: 'Top', value: 'top' },
          { label: 'Bottom', value: 'bottom' },
          { label: 'Versatile', value: 'versatile' },
          { label: 'Side', value: 'side' },
        ], setPosition)}

        {renderPicker('Body Hair', bodyHair, [
          { label: 'None', value: 'none' },
          { label: 'Light', value: 'light' },
          { label: 'Moderate', value: 'moderate' },
          { label: 'Heavy', value: 'heavy' },
          { label: 'Natural', value: 'natural' },
        ], setBodyHair)}

        {renderPicker('Smoking', smoking, [
          { label: 'No', value: 'no' },
          { label: 'Occasionally', value: 'occasionally' },
          { label: 'Regularly', value: 'regularly' },
        ], setSmoking)}

        {renderPicker('Drinking', drinking, [
          { label: 'No', value: 'no' },
          { label: 'Occasionally', value: 'occasionally' },
          { label: 'Socially', value: 'socially' },
          { label: 'Regularly', value: 'regularly' },
        ], setDrinking)}

        {/* Sexual Health */}
        <Text style={styles.sectionTitle}>Sexual Health</Text>

        {renderPicker('HIV Status', hivStatus, [
          { label: 'Negative', value: 'negative' },
          { label: 'Positive', value: 'positive' },
          { label: 'Unknown', value: 'unknown' },
        ], setHivStatus)}

        <View style={styles.switchRow}>
          <Text style={styles.label}>On PrEP</Text>
          <Switch
            value={onPrep}
            onValueChange={setOnPrep}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.text}
          />
        </View>

        {/* Meeting Preferences */}
        <Text style={styles.sectionTitle}>Meeting Preferences</Text>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Can Host</Text>
          <Switch
            value={canHost}
            onValueChange={setCanHost}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.text}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Can Travel</Text>
          <Switch
            value={canTravel}
            onValueChange={setCanTravel}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.text}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Available Now</Text>
          <Switch
            value={availableNow}
            onValueChange={setAvailableNow}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.text}
          />
        </View>

        {/* Tribes */}
        <Text style={styles.sectionTitle}>Tribes</Text>
        {profile && (
          <TribeSelector
            selectedTribeIds={selectedTribeIds}
            onSelectionChange={setSelectedTribeIds}
            maxSelection={5}
          />
        )}

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
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
  form: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: FONT_WEIGHTS.medium as any,
  },
  input: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  fieldContainer: {
    marginBottom: SPACING.md,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.xs,
  },
  pickerOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.round,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  pickerOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pickerOptionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  pickerOptionTextSelected: {
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  saveButton: {
    backgroundColor: COLORS.secondary, // Teal for primary CTA
    borderRadius: BORDER_RADIUS.pill, // Pill-shaped like other CTAs
    padding: SPACING.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
    ...SHADOWS.small,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.background,
  },
  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  photoLimit: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold as any,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: COLORS.primary,
    color: COLORS.background,
    fontSize: FONT_SIZES.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
  },
  addPhotoIcon: {
    fontSize: FONT_SIZES.xxxl,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  addPhotoText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
