
-- Assessment links table for tracking sent assessment invitations
CREATE TABLE public.assessment_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  assessment_url TEXT NOT NULL,
  sent_via TEXT NOT NULL DEFAULT 'manual', -- email, whatsapp, sms, manual
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assessment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can CRUD assessment_links"
  ON public.assessment_links FOR ALL
  USING (true) WITH CHECK (true);

-- Placement risks table for AI-calculated placement risk scores
CREATE TABLE public.placement_risks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  target_organization_id UUID REFERENCES public.organizations(id),
  target_department TEXT,
  risk_score INTEGER NOT NULL DEFAULT 50,
  risk_level TEXT NOT NULL DEFAULT 'low', -- low, moderate, high
  risk_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  alternative_placements JSONB NOT NULL DEFAULT '[]'::jsonb,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  overridden_by UUID,
  override_reason TEXT
);

ALTER TABLE public.placement_risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can CRUD placement_risks"
  ON public.placement_risks FOR ALL
  USING (true) WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX idx_assessment_links_candidate ON public.assessment_links(candidate_id);
CREATE INDEX idx_assessment_links_token ON public.assessment_links(token);
CREATE INDEX idx_placement_risks_candidate ON public.placement_risks(candidate_id);
