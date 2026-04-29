CREATE TABLE public.candidate_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_email text NOT NULL,
  candidate_id uuid REFERENCES public.candidates(id) ON DELETE SET NULL,
  journey_type text NOT NULL DEFAULT 'h2b_phase1_screening',
  source text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  preferences jsonb NOT NULL,
  extraction_metadata jsonb,
  request_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_preferences_email_lowercase
    CHECK (candidate_email = lower(candidate_email)),
  CONSTRAINT candidate_preferences_journey_type_check
    CHECK (journey_type IN (
      'h2b_phase1_screening',
      'h2b_phase2_placement',
      'h2b_phase3_arrival',
      'direct_hire',
      'internal_transfer'
    )),
  CONSTRAINT candidate_preferences_source_check
    CHECK (source IN (
      'connect-portal-live',
      'connect-portal-backfill',
      'hub-manual'
    )),
  CONSTRAINT candidate_preferences_preferences_is_object
    CHECK (jsonb_typeof(preferences) = 'object')
);

CREATE INDEX idx_candidate_preferences_email_captured
  ON public.candidate_preferences (candidate_email, captured_at DESC);

CREATE INDEX idx_candidate_preferences_candidate_id
  ON public.candidate_preferences (candidate_id);

CREATE INDEX idx_candidate_preferences_captured_at
  ON public.candidate_preferences (captured_at);

CREATE UNIQUE INDEX idx_candidate_preferences_request_id_unique
  ON public.candidate_preferences (request_id)
  WHERE request_id IS NOT NULL;

ALTER TABLE public.candidate_preferences ENABLE ROW LEVEL SECURITY;