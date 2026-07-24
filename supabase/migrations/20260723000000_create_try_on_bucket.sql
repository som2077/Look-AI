-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('try-on-uploads', 'try-on-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the bucket
-- Allow public access to read
CREATE POLICY "Public Access Try On" ON storage.objects
  FOR SELECT USING (bucket_id = 'try-on-uploads');

-- Allow anyone to insert
CREATE POLICY "Public Insert Try On" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'try-on-uploads');
