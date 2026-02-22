-- Allow document and storage deletion so the app can delete documents
CREATE POLICY "Allow public delete documents" ON public.documents FOR DELETE USING (true);

-- Allow deleting files from documents bucket (so we can remove PDFs when document is deleted)
CREATE POLICY "Allow public delete from documents bucket" ON storage.objects FOR DELETE USING (bucket_id = 'documents');
