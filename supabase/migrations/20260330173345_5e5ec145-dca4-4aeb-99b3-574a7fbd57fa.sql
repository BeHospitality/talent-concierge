ALTER TABLE public.prescreening_data
  ADD COLUMN IF NOT EXISTS archetype_type text,
  ADD COLUMN IF NOT EXISTS dna_session_id text,
  ADD COLUMN IF NOT EXISTS candidate_tier text,
  ADD COLUMN IF NOT EXISTS dna_source text,
  ADD COLUMN IF NOT EXISTS dna_path text,
  ADD COLUMN IF NOT EXISTS matching_results jsonb;