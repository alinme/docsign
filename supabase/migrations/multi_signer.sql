-- Migration: Multi-Signer Support
-- Add the new JSONB array column to support multiple signers for a single document
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS signers JSONB DEFAULT '[]'::jsonb;

-- (Optional but recommended) Backfill existing data if there's any pending/completed documents
-- Assuming the JSONB structure: [{ "id": uuid, "name": string, "email": string, "status": string, "signedAt": string|null }]
UPDATE documents
SET signers = json_build_array(
    json_build_object(
        'id', gen_random_uuid(),
        'name', signer_name,
        'email', signer_email,
        'status', status,
        'signedAt', CASE WHEN status = 'Completed' THEN timezone('utc'::text, now()) ELSE null END
    )
)
WHERE signer_email IS NOT NULL AND (signers IS NULL OR jsonb_array_length(signers) = 0);
