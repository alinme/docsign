-- Add optional details JSONB to audit_logs for richer logging (e.g. to whom email was sent, event metadata).
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS details JSONB;

COMMENT ON COLUMN audit_logs.details IS 'Optional metadata: e.g. {"to": ["a@x.com"], "signer_name": "X"} for EMAIL_SENT, SIGNER_SIGNED, etc.';
