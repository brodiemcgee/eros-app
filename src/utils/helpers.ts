// Helper utility functions

import { LookingFor, BodyType, RelationshipStatus } from '../types/database';

// Calculate age from date of birth
export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

// Format timestamp to relative time (e.g., "5m ago", "2h ago")
export const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  return time.toLocaleDateString();
};

// Format height in cm to feet/inches or cm
export const formatHeight = (cm: number | null, unit: 'metric' | 'imperial' = 'metric'): string => {
  if (!cm) return 'Not specified';

  if (unit === 'imperial') {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  }

  return `${cm}cm`;
};

// Format weight
export const formatWeight = (kg: number | null, unit: 'metric' | 'imperial' = 'metric'): string => {
  if (!kg) return 'Not specified';

  if (unit === 'imperial') {
    const lbs = Math.round(kg * 2.20462);
    return `${lbs}lbs`;
  }

  return `${kg}kg`;
};

// Format looking for tags
export const formatLookingFor = (lookingFor: LookingFor[] | null): string => {
  if (!lookingFor || lookingFor.length === 0) return 'Not specified';

  const formatted = lookingFor.map((item) => {
    switch (item) {
      case 'right_now':
        return 'Right Now';
      default:
        return item.charAt(0).toUpperCase() + item.slice(1);
    }
  });

  return formatted.join(', ');
};

// Format body type
export const formatBodyType = (bodyType: BodyType | null): string => {
  if (!bodyType) return 'Not specified';
  return bodyType.charAt(0).toUpperCase() + bodyType.slice(1);
};

// Format relationship status
export const formatRelationshipStatus = (status: RelationshipStatus | null): string => {
  if (!status) return 'Not specified';

  switch (status) {
    case 'open_relationship':
      return 'Open Relationship';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password (minimum 8 characters)
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

// Get initials from name
export const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
