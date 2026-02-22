-- Add signers to templates so each template can define at least one signer (name, email)
-- and fields can be assigned to signers by signerId.
ALTER TABLE templates
ADD COLUMN IF NOT EXISTS signers JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN templates.signers IS 'Array of { id, name, email, isBusiness?, company?, companyInfo? } - at least one when creating template; used when loading template on new document.';
