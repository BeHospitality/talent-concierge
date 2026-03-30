-- Add candidate_email column for B2C candidates without a candidate record
ALTER TABLE public.prescreening_data
  ADD COLUMN IF NOT EXISTS candidate_email text;

-- Make candidate_id and organization_id nullable for B2C candidates
ALTER TABLE public.prescreening_data
  ALTER COLUMN candidate_id DROP NOT NULL,
  ALTER COLUMN organization_id DROP NOT NULL;

-- Add unique constraint on candidate_email for upsert support
CREATE UNIQUE INDEX IF NOT EXISTS prescreening_data_candidate_email_unique
  ON public.prescreening_data (candidate_email)
  WHERE candidate_email IS NOT NULL;