-- Enable secure storage for user signatures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signatures', 'signatures', false)
ON CONFLICT (id) DO NOTHING;

-- Restrict signature access to the authenticated owner
CREATE POLICY "Users can read own signature" ON storage.objects
FOR SELECT USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own signature" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own signature" ON storage.objects
FOR UPDATE USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own signature" ON storage.objects
FOR DELETE USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);
