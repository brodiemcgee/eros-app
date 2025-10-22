import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { uploadFile, deleteFile } from './supabase';

export interface ImageUploadResult {
  url: string;
  path: string;
}

// Request camera permissions
export const requestCameraPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
};

// Request media library permissions
export const requestMediaLibraryPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
};

// Pick image from gallery
export const pickImage = async (): Promise<string | null> => {
  const hasPermission = await requestMediaLibraryPermission();
  if (!hasPermission) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }

  return null;
};

// Take photo with camera
export const takePhoto = async (): Promise<string | null> => {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }

  return null;
};

// Compress and resize image
export const compressImage = async (
  uri: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}
): Promise<string> => {
  const { width = 1080, height = 1080, quality = 0.8 } = options;

  const manipResult = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width, height } }],
    { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
  );

  return manipResult.uri;
};

// Upload profile photo
export const uploadProfilePhoto = async (
  userId: string,
  imageUri: string,
  displayOrder: number
): Promise<ImageUploadResult> => {
  // Compress image first
  const compressedUri = await compressImage(imageUri);

  // Convert URI to blob
  const response = await fetch(compressedUri);
  const blob = await response.blob();

  // Generate unique filename
  const timestamp = Date.now();
  const filename = `${userId}/profile_${timestamp}_${displayOrder}.jpg`;

  // Upload to Supabase
  const url = await uploadFile('profile-photos', filename, blob);

  return { url, path: filename };
};

// Upload album photo
export const uploadAlbumPhoto = async (
  userId: string,
  albumId: string,
  imageUri: string,
  displayOrder: number
): Promise<ImageUploadResult> => {
  const compressedUri = await compressImage(imageUri);
  const response = await fetch(compressedUri);
  const blob = await response.blob();

  const timestamp = Date.now();
  const filename = `${userId}/albums/${albumId}/${timestamp}_${displayOrder}.jpg`;

  const url = await uploadFile('album-photos', filename, blob);

  return { url, path: filename };
};

// Upload chat media
export const uploadChatMedia = async (
  userId: string,
  imageUri: string
): Promise<ImageUploadResult> => {
  const compressedUri = await compressImage(imageUri, { quality: 0.7 });
  const response = await fetch(compressedUri);
  const blob = await response.blob();

  const timestamp = Date.now();
  const filename = `${userId}/chat/${timestamp}.jpg`;

  const url = await uploadFile('chat-media', filename, blob);

  return { url, path: filename };
};

// Delete photo from storage
export const deletePhoto = async (
  bucket: 'profile-photos' | 'album-photos' | 'chat-media',
  path: string
): Promise<void> => {
  await deleteFile(bucket, path);
};
