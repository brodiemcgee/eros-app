// Database types matching the Supabase schema

export type BodyType = 'slim' | 'average' | 'athletic' | 'muscular' | 'stocky' | 'large';

export type BodyHair = 'none' | 'light' | 'moderate' | 'heavy' | 'natural';

export type HIVStatus = 'negative' | 'positive' | 'unknown';

export type Position = 'top' | 'bottom' | 'versatile' | 'side';

export type Smoking = 'no' | 'occasionally' | 'regularly';

export type Drinking = 'no' | 'occasionally' | 'regularly' | 'socially';

export type RelationshipStatus = 'single' | 'partnered' | 'open_relationship' | 'married';

export type LookingFor = 'chat' | 'dates' | 'friends' | 'networking' | 'relationship' | 'right_now';

export type DistanceUnit = 'km' | 'mi';

export type TapType = 'flame' | 'woof' | 'looking' | 'friendly' | 'hot';

export type MediaType = 'image' | 'video';

export type ReportReason = 'spam' | 'inappropriate_content' | 'harassment' | 'fake_profile' | 'underage' | 'other';

export interface Profile {
  id: string;
  created_at: string;
  updated_at: string;

  // Basic Info
  display_name: string;
  bio: string | null;
  date_of_birth: string;

  // Physical Stats
  height_cm: number | null;
  weight_kg: number | null;
  body_type: BodyType | null;
  ethnicity: string | null;
  body_hair: BodyHair | null;

  // Identity & Pronouns
  pronouns: string | null;

  // Sexual Health
  hiv_status: HIVStatus | null;
  hiv_last_tested: string | null;
  on_prep: boolean;

  // Position & Preferences
  position: Position | null;
  smoking: Smoking | null;
  drinking: Drinking | null;
  languages: string[] | null;

  // Preferences
  looking_for: LookingFor[] | null;
  relationship_status: RelationshipStatus | null;

  // Meeting Preferences
  can_host: boolean;
  can_travel: boolean;
  available_now: boolean;

  // Location
  location: { lat: number; lng: number } | null;
  location_updated_at: string | null;
  city: string | null;
  country: string | null;

  // Privacy & Settings
  show_distance: boolean;
  show_age: boolean;
  online_status_visible: boolean;
  incognito_mode: boolean;
  distance_unit: DistanceUnit;

  // Premium
  is_premium: boolean;
  premium_expires_at: string | null;

  // Status
  last_active_at: string;
  is_online: boolean;
  is_verified: boolean;
  is_banned: boolean;
}

export interface ProfilePhoto {
  id: string;
  profile_id: string;
  created_at: string;
  photo_url: string;
  display_order: number;
  is_primary: boolean;
}

export interface Album {
  id: string;
  profile_id: string;
  created_at: string;
  name: string;
  is_private: boolean;
}

export interface AlbumPhoto {
  id: string;
  album_id: string;
  created_at: string;
  photo_url: string;
  display_order: number;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  participant1_id: string;
  participant2_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  content: string | null;
  media_url: string | null;
  media_type: MediaType | null;
  is_read: boolean;
  read_at: string | null;
  is_deleted: boolean;
}

export interface Favorite {
  id: string;
  created_at: string;
  user_id: string;
  favorited_user_id: string;
}

export interface Block {
  id: string;
  created_at: string;
  blocker_id: string;
  blocked_id: string;
}

export interface Tap {
  id: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  tap_type: TapType;
  is_read: boolean;
}

export interface ProfileView {
  id: string;
  created_at: string;
  viewer_id: string;
  viewed_profile_id: string;
}

export interface Report {
  id: string;
  created_at: string;
  reporter_id: string;
  reported_user_id: string;
  reason: ReportReason;
  description: string | null;
  is_resolved: boolean;
}

export interface SavedPhrase {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  phrase_text: string;
  display_order: number;
}

export interface Tribe {
  id: string;
  created_at: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number;
}

export interface ProfileTribe {
  id: string;
  created_at: string;
  profile_id: string;
  tribe_id: string;
}

// Extended types with joined data
export interface ProfileWithPhotos extends Profile {
  photos: ProfilePhoto[];
}

export interface ProfileWithTribes extends ProfileWithPhotos {
  tribes: Tribe[];
}

export interface ProfileWithDistance extends ProfileWithTribes {
  distance_km: number;
}

export interface ConversationWithProfile extends Conversation {
  other_profile: ProfileWithPhotos;
  unread_count: number;
}

export interface MessageWithProfiles extends Message {
  sender_profile: Profile;
  receiver_profile: Profile;
}

export interface TapWithProfile extends Tap {
  sender_profile: ProfileWithPhotos;
}

// Supabase Database type
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'last_active_at' | 'is_online'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      profile_photos: {
        Row: ProfilePhoto;
        Insert: Omit<ProfilePhoto, 'id' | 'created_at'>;
        Update: Partial<Omit<ProfilePhoto, 'id' | 'created_at' | 'profile_id'>>;
      };
      albums: {
        Row: Album;
        Insert: Omit<Album, 'id' | 'created_at'>;
        Update: Partial<Omit<Album, 'id' | 'created_at' | 'profile_id'>>;
      };
      album_photos: {
        Row: AlbumPhoto;
        Insert: Omit<AlbumPhoto, 'id' | 'created_at'>;
        Update: Partial<Omit<AlbumPhoto, 'id' | 'created_at' | 'album_id'>>;
      };
      conversations: {
        Row: Conversation;
        Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at' | 'last_message_at' | 'last_message_preview'>;
        Update: Partial<Omit<Conversation, 'id' | 'created_at'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at' | 'is_read' | 'read_at' | 'is_deleted'>;
        Update: Partial<Omit<Message, 'id' | 'created_at' | 'conversation_id' | 'sender_id' | 'receiver_id'>>;
      };
      favorites: {
        Row: Favorite;
        Insert: Omit<Favorite, 'id' | 'created_at'>;
        Update: never;
      };
      blocks: {
        Row: Block;
        Insert: Omit<Block, 'id' | 'created_at'>;
        Update: never;
      };
      taps: {
        Row: Tap;
        Insert: Omit<Tap, 'id' | 'created_at' | 'is_read'>;
        Update: Partial<Pick<Tap, 'is_read'>>;
      };
      profile_views: {
        Row: ProfileView;
        Insert: Omit<ProfileView, 'id' | 'created_at'>;
        Update: never;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, 'id' | 'created_at' | 'is_resolved'>;
        Update: Partial<Pick<Report, 'is_resolved'>>;
      };
      tribes: {
        Row: Tribe;
        Insert: Omit<Tribe, 'id' | 'created_at'>;
        Update: Partial<Omit<Tribe, 'id' | 'created_at'>>;
      };
      profile_tribes: {
        Row: ProfileTribe;
        Insert: Omit<ProfileTribe, 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
}
