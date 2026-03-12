
-- Add hiring manager contact fields and sender tracking to dossiers
ALTER TABLE public.dossiers
ADD COLUMN IF NOT EXISTS hiring_manager_name TEXT,
ADD COLUMN IF NOT EXISTS hiring_manager_email TEXT,
ADD COLUMN IF NOT EXISTS hiring_manager_phone TEXT,
ADD COLUMN IF NOT EXISTS sent_by_user_id UUID,
ADD COLUMN IF NOT EXISTS personal_message TEXT;

-- Update public_dossiers view to include new fields (only non-sensitive ones)
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
