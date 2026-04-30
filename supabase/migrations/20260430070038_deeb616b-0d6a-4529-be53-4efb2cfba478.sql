ALTER TABLE public.prescreening_data
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS assessment_id uuid,
  ADD COLUMN IF NOT EXISTS video_storage_path text;

CREATE INDEX IF NOT EXISTS idx_prescreening_data_assessment_id
  ON public.prescreening_data (assessment_id)
  WHERE assessment_id IS NOT NULL;