-- Storage initialization for DocSpective
-- Creates the uploads bucket and sets up RLS policies for file uploads

-- Create uploads bucket
INSERT INTO storage.buckets (id, name)
VALUES ('uploads', 'uploads')
ON CONFLICT (name) DO NOTHING;

-- Create conversions bucket
INSERT INTO storage.buckets (id, name)
VALUES ('conversions', 'conversions')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on storage.objects (should already be enabled, but ensuring it)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow anyone to insert files into the uploads bucket
-- This is for development purposes - in production you'd want more restrictive policies
CREATE POLICY "Allow uploads to uploads bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Allow uploads to conversions bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'conversions');

-- Create RLS policy to allow anyone to select files from the uploads bucket  
-- Needed for the upsert functionality (upsert = select + insert/update)
CREATE POLICY "Allow select from uploads bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'uploads');

CREATE POLICY "Allow select from conversions bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'conversions');

-- Create RLS policy to allow anyone to update files in the uploads bucket
-- Also needed for the upsert functionality
CREATE POLICY "Allow update in uploads bucket"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'uploads')
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Allow update in conversions bucket"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'conversions')
WITH CHECK (bucket_id = 'conversions');

-- TODO: In production, replace these permissive policies with more restrictive ones
-- For example, restrict to authenticated users only:
-- CREATE POLICY "Allow authenticated uploads" ON storage.objects 
-- FOR INSERT TO authenticated 
-- WITH CHECK (bucket_id = 'uploads');