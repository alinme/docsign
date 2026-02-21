-- Table: templates
CREATE TABLE IF NOT EXISTS templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    creator_email TEXT NOT NULL,
    template_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    sign_coordinates JSONB NOT NULL
);

-- Enable RLS and public bypass for Templates specifically
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow user read templates" ON templates FOR SELECT USING (true);
CREATE POLICY "Allow user insert templates" ON templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow user update templates" ON templates FOR UPDATE USING (true);
CREATE POLICY "Allow user delete templates" ON templates FOR DELETE USING (true);
