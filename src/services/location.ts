import * as Location from 'expo-location';
import { supabase } from './supabase';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Request location permissions
export const requestLocationPermission = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

// Get current location
export const getCurrentLocation = async (): Promise<Coordinates | null> => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

// Update user's location in database
export const updateUserLocation = async (coords: Coordinates): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('profiles')
    .update({
      location: `POINT(${coords.longitude} ${coords.latitude})`,
      location_updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating location:', error);
  }
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (
  coords1: Coordinates,
  coords2: Coordinates,
  unit: 'km' | 'mi' = 'km'
): number => {
  const R = unit === 'km' ? 6371 : 3959; // Earth's radius in km or miles
  const dLat = toRadians(coords2.latitude - coords1.latitude);
  const dLon = toRadians(coords2.longitude - coords1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coords1.latitude)) *
      Math.cos(toRadians(coords2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Format distance for display
export const formatDistance = (km: number, unit: 'km' | 'mi' = 'km'): string => {
  const distance = unit === 'mi' ? km * 0.621371 : km;

  if (distance < 1) {
    return unit === 'km' ? `${Math.round(distance * 1000)}m` : `${Math.round(distance * 5280)}ft`;
  }

  return `${Math.round(distance)}${unit}`;
};

// Get reverse geocoding (city/country from coordinates)
export const reverseGeocode = async (coords: Coordinates): Promise<{ city: string | null; country: string | null }> => {
  try {
    const result = await Location.reverseGeocodeAsync({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    if (result.length > 0) {
      const { city, country } = result[0];
      return { city: city || null, country: country || null };
    }
  } catch (error) {
    console.error('Error reverse geocoding:', error);
  }

  return { city: null, country: null };
};
