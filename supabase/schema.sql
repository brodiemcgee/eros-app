-- Eros App Database Schema
-- Complete Grindr-like functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Basic Info
  display_name TEXT NOT NULL,
  bio TEXT,
  date_of_birth DATE NOT NULL,

  -- Physical Stats
  height_cm INTEGER,
  weight_kg INTEGER,
  body_type TEXT, -- slim, average, athletic, muscular, stocky, large
  ethnicity TEXT,

  -- Preferences
  looking_for TEXT[], -- chat, dates, friends, networking, relationship, right now
  relationship_status TEXT, -- single, partnered, open relationship, married

  -- Location
  location GEOGRAPHY(POINT),
  location_updated_at TIMESTAMP WITH TIME ZONE,
  city TEXT,
  country TEXT,

  -- Privacy & Settings
  show_distance BOOLEAN DEFAULT TRUE,
  show_age BOOLEAN DEFAULT TRUE,
  online_status_visible BOOLEAN DEFAULT TRUE,
  incognito_mode BOOLEAN DEFAULT FALSE,
  distance_unit TEXT DEFAULT 'km', -- km or mi

  -- Premium
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMP WITH TIME ZONE,

  -- Status
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,

  -- Constraints
  CONSTRAINT valid_body_type CHECK (body_type IN ('slim', 'average', 'athletic', 'muscular', 'stocky', 'large')),
  CONSTRAINT valid_relationship_status CHECK (relationship_status IN ('single', 'partnered', 'open_relationship', 'married')),
  CONSTRAINT valid_distance_unit CHECK (distance_unit IN ('km', 'mi')),
  CONSTRAINT valid_age CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '18 years')
);

-- Profile photos
CREATE TABLE profile_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  photo_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,

  UNIQUE(profile_id, display_order)
);

-- Albums (public and private photo collections)
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  name TEXT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,

  UNIQUE(profile_id, name)
);

-- Album photos
CREATE TABLE album_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  photo_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  participant1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_preview TEXT,

  UNIQUE(participant1_id, participant2_id),
  CONSTRAINT different_participants CHECK (participant1_id != participant2_id)
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  content TEXT,
  media_url TEXT,
  media_type TEXT, -- image, video

  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT FALSE,

  CONSTRAINT has_content CHECK (content IS NOT NULL OR media_url IS NOT NULL)
);

-- Favorites
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  favorited_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  UNIQUE(user_id, favorited_user_id),
  CONSTRAINT cannot_favorite_self CHECK (user_id != favorited_user_id)
);

-- Blocks
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  UNIQUE(blocker_id, blocked_id),
  CONSTRAINT cannot_block_self CHECK (blocker_id != blocked_id)
);

-- Taps (quick reactions)
CREATE TABLE taps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  tap_type TEXT NOT NULL, -- flame, woof, looking, friendly, hot
  is_read BOOLEAN DEFAULT FALSE,

  CONSTRAINT valid_tap_type CHECK (tap_type IN ('flame', 'woof', 'looking', 'friendly', 'hot')),
  CONSTRAINT cannot_tap_self CHECK (sender_id != receiver_id)
);

-- Profile views
CREATE TABLE profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  CONSTRAINT cannot_view_self CHECK (viewer_id != viewed_profile_id)
);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  reason TEXT NOT NULL, -- spam, inappropriate_content, harassment, fake_profile, underage, other
  description TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,

  CONSTRAINT valid_reason CHECK (reason IN ('spam', 'inappropriate_content', 'harassment', 'fake_profile', 'underage', 'other'))
);

-- Indexes for performance
CREATE INDEX idx_profiles_location ON profiles USING GIST(location);
CREATE INDEX idx_profiles_last_active ON profiles(last_active_at DESC);
CREATE INDEX idx_profiles_is_online ON profiles(is_online) WHERE is_online = TRUE;

CREATE INDEX idx_profile_photos_profile_id ON profile_photos(profile_id);
CREATE INDEX idx_album_photos_album_id ON album_photos(album_id);

CREATE INDEX idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = FALSE;

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_favorited ON favorites(favorited_user_id);

CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);

CREATE INDEX idx_taps_receiver ON taps(receiver_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_taps_sender ON taps(sender_id);

CREATE INDEX idx_profile_views_viewed ON profile_views(viewed_profile_id, created_at DESC);

-- Function to calculate distance between users
CREATE OR REPLACE FUNCTION get_nearby_profiles(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  max_distance_km INTEGER DEFAULT 50,
  limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
  profile_id UUID,
  display_name TEXT,
  distance_km DOUBLE PRECISION,
  last_active_at TIMESTAMP WITH TIME ZONE,
  is_online BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    ST_Distance(
      p.location::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) / 1000 as distance_km,
    p.last_active_at,
    p.is_online
  FROM profiles p
  WHERE
    p.location IS NOT NULL
    AND p.is_banned = FALSE
    AND ST_DWithin(
      p.location::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      max_distance_km * 1000
    )
  ORDER BY distance_km
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update conversation's last message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = COALESCE(
      LEFT(NEW.content, 100),
      CASE
        WHEN NEW.media_type = 'image' THEN 'Sent a photo'
        WHEN NEW.media_type = 'video' THEN 'Sent a video'
        ELSE 'Sent a message'
      END
    ),
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- Function to update profile updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Row Level Security Policies

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (is_banned = FALSE);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Profile Photos
ALTER TABLE profile_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profile photos are viewable by everyone"
  ON profile_photos FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can manage own photos"
  ON profile_photos FOR ALL
  USING (auth.uid() = profile_id);

-- Albums
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public albums viewable by everyone"
  ON albums FOR SELECT
  USING (is_private = FALSE OR auth.uid() = profile_id);

CREATE POLICY "Users can manage own albums"
  ON albums FOR ALL
  USING (auth.uid() = profile_id);

-- Album Photos
ALTER TABLE album_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Album photos viewable based on album privacy"
  ON album_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM albums a
      WHERE a.id = album_id
      AND (a.is_private = FALSE OR a.profile_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own album photos"
  ON album_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM albums a
      WHERE a.id = album_id AND a.profile_id = auth.uid()
    )
  );

-- Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() IN (participant1_id, participant2_id));

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IN (participant1_id, participant2_id));

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (auth.uid() IN (sender_id, receiver_id));

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  USING (auth.uid() = user_id);

-- Blocks
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocks"
  ON blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can manage own blocks"
  ON blocks FOR ALL
  USING (auth.uid() = blocker_id);

-- Taps
ALTER TABLE taps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view taps they sent or received"
  ON taps FOR SELECT
  USING (auth.uid() IN (sender_id, receiver_id));

CREATE POLICY "Users can send taps"
  ON taps FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received taps"
  ON taps FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Profile Views
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Premium users can view who viewed them"
  ON profile_views FOR SELECT
  USING (
    auth.uid() = viewed_profile_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_premium = TRUE
    )
  );

CREATE POLICY "Users can create profile views"
  ON profile_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

-- Reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);
