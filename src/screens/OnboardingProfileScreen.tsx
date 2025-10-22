import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, FONT_FAMILIES, SHADOWS } from '../utils/theme';
import { pickImage } from '../services/imageUpload';
import { uploadProfilePhoto } from '../services/imageUpload';
import { addProfilePhoto, updateProfile } from '../services/profiles';
import { supabase } from '../services/supabase';
import { getCurrentLocation, updateUserLocation, reverseGeocode } from '../services/location';

type OnboardingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingProfile'>;

export const OnboardingProfileScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const { user, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePickPhoto = async () => {
    const uri = await pickImage();
    if (uri) {
      setPhotoUri(uri);
    }
  };

  const showError = (message: string) => {
    console.error('Validation error:', message);
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('Error', message);
    }
  };

  const handleComplete = async () => {
    console.log('Complete profile clicked', { displayName, dateOfBirth, hasPhoto: !!photoUri });

    if (!displayName.trim()) {
      showError('Please enter your display name');
      return;
    }

    if (!dateOfBirth) {
      showError('Please enter your date of birth');
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      showError('Please enter date in YYYY-MM-DD format (e.g., 1990-01-15)');
      return;
    }

    // Calculate age
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      if (age - 1 < 18) {
        showError('You must be at least 18 years old to use Eros');
        return;
      }
    } else if (age < 18) {
      showError('You must be at least 18 years old to use Eros');
      return;
    }

    // Make photo optional for web (image picker might not work)
    if (!photoUri && Platform.OS !== 'web') {
      showError('Please upload at least one photo');
      return;
    }

    if (!user) return;

    setLoading(true);

    try {
      console.log('Creating profile...');

      // Get location (skip on web if it fails)
      let coords = null;
      let city = null;
      let country = null;

      try {
        coords = await getCurrentLocation();
        if (coords) {
          const location = await reverseGeocode(coords);
          city = location.city;
          country = location.country;
          await updateUserLocation(coords);
        }
      } catch (locError) {
        console.warn('Location fetch failed, continuing without location:', locError);
      }

      // Create profile
      console.log('Inserting profile into database...');
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          date_of_birth: dateOfBirth,
          city,
          country,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      console.log('Profile created successfully');

      // Upload photo if provided
      if (photoUri) {
        try {
          console.log('Uploading photo...');
          const { url } = await uploadProfilePhoto(user.id, photoUri, 0);
          await addProfilePhoto(user.id, url, 0, true);
          console.log('Photo uploaded successfully');
        } catch (photoError) {
          console.warn('Photo upload failed, continuing without photo:', photoError);
        }
      }

      // Refresh profile in context
      console.log('Refreshing profile...');
      await refreshProfile();

      console.log('Profile setup complete, navigating to MainTabs');
      // Navigate to main app
      navigation.replace('MainTabs');
    } catch (error: any) {
      console.error('Error creating profile:', error);
      const msg = error.message || 'Failed to create profile';
      if (Platform.OS === 'web') {
        alert('Error: ' + msg);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>Tell us a bit about yourself</Text>

      <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.form}>
        <Text style={styles.label}>Display Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="How should we call you?"
          placeholderTextColor={COLORS.textMuted}
          value={displayName}
          onChangeText={setDisplayName}
          editable={!loading}
        />

        <Text style={styles.label}>Date of Birth * (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="1990-01-15"
          placeholderTextColor={COLORS.textMuted}
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          keyboardType="numbers-and-punctuation"
          editable={!loading}
        />

        <Text style={styles.label}>Bio (Optional)</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="Tell others about yourself..."
          placeholderTextColor={COLORS.textMuted}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={styles.buttonText}>Complete Setup</Text>
          )}
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
  content: {
    padding: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  photoButton: {
    alignSelf: 'center',
    marginBottom: SPACING.xl,
  },
  photo: {
    width: 150,
    height: 150,
    borderRadius: BORDER_RADIUS.round,
  },
  photoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  form: {
    width: '100%',
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
    paddingTop: SPACING.md,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.background,
  },
});
