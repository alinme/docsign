-- schema.sql
-- Run this script in the Supabase SQL Editor to initialize the database

-- Enable the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: documents
CREATE TABLE documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    initiator_email TEXT NOT NULL,
    initiator_name TEXT,
    initiator_company TEXT,
    initiator_company_info TEXT,
    signer_email TEXT NOT NULL,
    signer_name TEXT NOT NULL,
    signer_company TEXT,
    signer_company_info TEXT,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Voided')),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '7 days') NOT NULL,
    sign_coordinates JSONB -- Stores { x, y, pageNum, width, height }
);
-- Table: templates
CREATE TABLE templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    creator_email TEXT NOT NULL,
    template_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    sign_coordinates JSONB NOT NULL
);

-- Table: audit_logs
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    action TEXT NOT NULL, -- e.g., 'DOCUMENT_CREATED', 'DOCUMENT_VIEWED', 'DOCUMENT_SIGNED'
    actor_email TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT
);

-- Create Storage Bucket for PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Row Level Security (RLS)
-- For this prototype, we will allow anonymous access, but in production, you would restrict this using Supabase Auth
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Allow read/insert access natively for the MVP
CREATE POLICY "Allow public read documents" ON documents FOR SELECT USING (true);
CREATE POLICY "Allow public insert documents" ON documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update documents" ON documents FOR UPDATE USING (true);

CREATE POLICY "Allow public read audit_logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert audit_logs" ON audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow user read templates" ON templates FOR SELECT USING (true);
CREATE POLICY "Allow user insert templates" ON templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow user update templates" ON templates FOR UPDATE USING (true);
CREATE POLICY "Allow user delete templates" ON templates FOR DELETE USING (true);

-- Storage Policies
CREATE POLICY "Allow public uploads to documents bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Allow public read from documents bucket" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Allow public update to documents bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'documents');
