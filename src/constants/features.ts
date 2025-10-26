/**
 * Feature Constants for Thirsty App
 *
 * These feature keys must match the feature_key values in the database.
 * Used for type-safe feature gating throughout the app.
 */

// Feature Categories
export const FEATURE_CATEGORIES = {
  MESSAGING: 'messaging',
  DISCOVERY: 'discovery',
  PROFILE: 'profile',
  PRIVACY: 'privacy',
  INTERACTIONS: 'interactions',
  GENERAL: 'general',
} as const;

// Messaging Features
export const MESSAGING_FEATURES = {
  UNLIMITED_MESSAGES: 'unlimited_messages',
  READ_RECEIPTS: 'read_receipts',
  TYPING_INDICATORS: 'typing_indicators',
  SAVED_PHRASES: 'saved_phrases',
  MEDIA_MESSAGES: 'media_messages',
  MESSAGE_DELETION: 'message_deletion',
} as const;

// Discovery Features
export const DISCOVERY_FEATURES = {
  ADVANCED_FILTERS: 'advanced_filters',
  FRESH_FACES_FILTER: 'fresh_faces_filter',
  ONLINE_ONLY_FILTER: 'online_only_filter',
  VERIFIED_ONLY_FILTER: 'verified_only_filter',
  TRIBE_FILTERS: 'tribe_filters',
  EXTENDED_DISTANCE: 'extended_distance',
  UNLIMITED_DISTANCE: 'unlimited_distance',
  CASCADE_VIEW: 'cascade_view',
} as const;

// Profile Features
export const PROFILE_FEATURES = {
  VERIFIED_BADGE: 'verified_badge',
  INCOGNITO_MODE: 'incognito_mode',
  UNLIMITED_PHOTOS: 'unlimited_photos',
  WHO_VIEWED_ME: 'who_viewed_me',
  UNLIMITED_FAVORITES: 'unlimited_favorites',
  PROFILE_ALBUMS: 'profile_albums',
} as const;

// Privacy Features
export const PRIVACY_FEATURES = {
  HIDE_DISTANCE: 'hide_distance',
  HIDE_AGE: 'hide_age',
  HIDE_ONLINE_STATUS: 'hide_online_status',
  STEALTH_MODE: 'stealth_mode',
} as const;

// Interaction Features
export const INTERACTION_FEATURES = {
  UNLIMITED_TAPS: 'unlimited_taps',
  PRIORITY_TAPS: 'priority_taps',
  TAP_NOTIFICATIONS: 'tap_notifications',
} as const;

// General Features
export const GENERAL_FEATURES = {
  AD_FREE: 'ad_free',
  PRIORITY_SUPPORT: 'priority_support',
} as const;

// All features combined
export const FEATURES = {
  ...MESSAGING_FEATURES,
  ...DISCOVERY_FEATURES,
  ...PROFILE_FEATURES,
  ...PRIVACY_FEATURES,
  ...INTERACTION_FEATURES,
  ...GENERAL_FEATURES,
} as const;

// TypeScript type for all feature keys
export type FeatureKey = typeof FEATURES[keyof typeof FEATURES];
export type FeatureCategory = typeof FEATURE_CATEGORIES[keyof typeof FEATURE_CATEGORIES];

// Free tier limits (when feature is NOT enabled)
export const FREE_LIMITS = {
  MAX_MESSAGES_PER_DAY: 50,
  MAX_FAVORITES: 25,
  MAX_PHOTOS: 6,
  MAX_TAPS_PER_DAY: 10,
  MAX_SEARCH_DISTANCE_KM: 50,
} as const;

// Feature descriptions for UI display
export const FEATURE_DESCRIPTIONS: Record<FeatureKey, { name: string; description: string }> = {
  // Messaging
  unlimited_messages: {
    name: 'Unlimited Messages',
    description: 'Send unlimited messages per day',
  },
  read_receipts: {
    name: 'Read Receipts',
    description: 'See when messages are read',
  },
  typing_indicators: {
    name: 'Typing Indicators',
    description: 'See when matches are typing',
  },
  saved_phrases: {
    name: 'Saved Phrases',
    description: 'Quick access to saved message templates',
  },
  media_messages: {
    name: 'Media Messages',
    description: 'Send photos and videos in chat',
  },
  message_deletion: {
    name: 'Unsend Messages',
    description: 'Delete sent messages for both users',
  },

  // Discovery
  advanced_filters: {
    name: 'Advanced Filters',
    description: 'Filter by body type, position, tribes, and more',
  },
  fresh_faces_filter: {
    name: 'Fresh Faces',
    description: 'See new users who joined in the last 7 days',
  },
  online_only_filter: {
    name: 'Online Now Filter',
    description: 'Filter to show only users currently online',
  },
  verified_only_filter: {
    name: 'Verified Only',
    description: 'Filter to show only verified accounts',
  },
  tribe_filters: {
    name: 'Tribe Filters',
    description: 'Filter by community tribes and interests',
  },
  extended_distance: {
    name: 'Extended Distance',
    description: 'Search beyond 50km radius (up to 100km)',
  },
  unlimited_distance: {
    name: 'Unlimited Distance',
    description: 'Remove distance limits and browse globally',
  },
  cascade_view: {
    name: 'Cascade View',
    description: 'Enhanced list view with more details',
  },

  // Profile
  verified_badge: {
    name: 'Verified Badge',
    description: 'Blue verified checkmark on your profile',
  },
  incognito_mode: {
    name: 'Incognito Mode',
    description: 'Browse without appearing in search results',
  },
  unlimited_photos: {
    name: 'Unlimited Photos',
    description: 'Upload more than 6 photos to your profile',
  },
  who_viewed_me: {
    name: 'See Who Viewed You',
    description: 'See everyone who viewed your profile',
  },
  unlimited_favorites: {
    name: 'Unlimited Favorites',
    description: 'Save unlimited favorite profiles',
  },
  profile_albums: {
    name: 'Private Albums',
    description: 'Create private photo albums with access control',
  },

  // Privacy
  hide_distance: {
    name: 'Hide Distance',
    description: 'Hide your distance from other users',
  },
  hide_age: {
    name: 'Hide Age',
    description: 'Hide your age from your profile',
  },
  hide_online_status: {
    name: 'Hide Online Status',
    description: 'Browse without showing online status',
  },
  stealth_mode: {
    name: 'Stealth Mode',
    description: 'View profiles without leaving a view record',
  },

  // Interactions
  unlimited_taps: {
    name: 'Unlimited Taps',
    description: 'Send unlimited taps (flame, woof, looking, etc.)',
  },
  priority_taps: {
    name: 'Priority Taps',
    description: 'Your taps appear first in their notifications',
  },
  tap_notifications: {
    name: 'Tap Notifications',
    description: 'Get notified when someone taps you',
  },

  // General
  ad_free: {
    name: 'Ad-Free Experience',
    description: 'Browse without advertisements',
  },
  priority_support: {
    name: 'Priority Support',
    description: 'Get faster response from customer support',
  },
};

// Group features by category for display
export const FEATURES_BY_CATEGORY: Record<FeatureCategory, FeatureKey[]> = {
  messaging: Object.values(MESSAGING_FEATURES),
  discovery: Object.values(DISCOVERY_FEATURES),
  profile: Object.values(PROFILE_FEATURES),
  privacy: Object.values(PRIVACY_FEATURES),
  interactions: Object.values(INTERACTION_FEATURES),
  general: Object.values(GENERAL_FEATURES),
};
