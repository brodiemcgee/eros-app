-- Thirsty App Storage Buckets Configuration

-- Create storage buckets for different media types
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('profile-photos', 'profile-photos', true),
  ('album-photos', 'album-photos', true),
  ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile-photos bucket
CREATE POLICY "Profile photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload own profile photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own profile photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own profile photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policies for album-photos bucket
CREATE POLICY "Album photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'album-photos');

CREATE POLICY "Users can upload own album photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'album-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own album photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'album-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own album photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'album-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policies for chat-media bucket
CREATE POLICY "Chat media accessible to conversation participants"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-media'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM messages m
      WHERE m.media_url LIKE '%' || name
      AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can upload chat media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own chat media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
