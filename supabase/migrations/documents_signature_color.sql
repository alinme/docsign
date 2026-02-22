-- Store document owner's signature color (from their profile) so all signers use it when signing.
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS signature_color TEXT;

COMMENT ON COLUMN documents.signature_color IS 'Hex color from initiator profile (Settings). Used as pen color for all signers on the signing page.';
