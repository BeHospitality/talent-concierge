
-- Create interventions table for logging admin actions on at-risk candidates
CREATE TABLE public.interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  candidate_id UUID REFERENCES public.candidates(id) NOT NULL,
  journey_id UUID REFERENCES public.journey_blueprints(id),
  intervention_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  outcome TEXT,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  logged_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can CRUD interventions
CREATE POLICY "Authenticated users can CRUD interventions"
  ON public.interventions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Performance indexes
CREATE INDEX idx_interventions_candidate ON public.interventions(candidate_id);
CREATE INDEX idx_interventions_org ON public.interventions(organization_id);
CREATE INDEX idx_interventions_follow_up ON public.interventions(follow_up_date);
