
-- Add resume tracking columns to dossiers
ALTER TABLE public.dossiers
ADD COLUMN IF NOT EXISTS include_resume BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS resume_filename TEXT;

-- Recreate public_dossiers view to include resume columns
DROP VIEW IF EXISTS public_dossiers CASCADE;

CREATE VIEW public_dossiers
WITH (security_invoker = on)
AS
SELECT
  id,
  unique_code,
  candidate_id,
  hiring_manager_id,
  organization_id,
  status,
  department,
  role,
  manager_notes,
  dossier_url,
  sent_at,
  first_viewed_at,
  last_viewed_at,
  view_count,
  expires_at,
  created_at,
  include_resume,
  resume_url,
  resume_filename
FROM dossiers;

GRANT SELECT ON public.public_dossiers TO anon, authenticated;

-- Allow anon to read candidate-resumes for dossier access via signed URLs
-- (signed URLs already bypass RLS, so no extra policy needed)
