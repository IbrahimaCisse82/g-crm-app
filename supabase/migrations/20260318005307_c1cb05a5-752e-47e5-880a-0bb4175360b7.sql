-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- Allow authenticated users to upload logos
CREATE POLICY "Users can upload logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to view logos (public bucket)
CREATE POLICY "Public logo access" ON storage.objects FOR SELECT USING (bucket_id = 'logos');

-- Allow users to update their own logos
CREATE POLICY "Users can update own logos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own logos
CREATE POLICY "Users can delete own logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);