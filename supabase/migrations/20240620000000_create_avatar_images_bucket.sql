-- Create a new storage bucket for avatar images
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('avatar-images', 'avatar-images', true, false)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the avatar-images bucket
-- Allow public read access to all avatar images
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatar-images');

-- Allow authenticated users to upload avatar images
CREATE POLICY "Users can upload avatar images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatar-images');

-- Allow users to update their own avatar images
CREATE POLICY "Users can update their own avatar images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatar-images');

-- Allow users to delete their own avatar images
CREATE POLICY "Users can delete their own avatar images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatar-images'); 