
-- Engagement Check-ins table for structured emoji responses
CREATE TABLE IF NOT EXISTS public.engagement_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES public.journey_blueprints(id) ON DELETE CASCADE,
  journey_event_id UUID REFERENCES public.journey_events(id),
  
  day_number INTEGER NOT NULL,
  phase TEXT NOT NULL,
  
  mood INTEGER NOT NULL,
  confidence INTEGER,
  team_integration INTEGER,
  
  notes TEXT,
  concerns TEXT,
  wins TEXT,
  
  recorded_by TEXT NOT NULL DEFAULT 'manager',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Validation trigger instead of CHECK constraints
CREATE OR REPLACE FUNCTION public.validate_engagement_checkin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.mood < 1 OR NEW.mood > 5 THEN
    RAISE EXCEPTION 'mood must be between 1 and 5';
  END IF;
  IF NEW.confidence IS NOT NULL AND (NEW.confidence < 1 OR NEW.confidence > 5) THEN
    RAISE EXCEPTION 'confidence must be between 1 and 5';
  END IF;
  IF NEW.team_integration IS NOT NULL AND (NEW.team_integration < 1 OR NEW.team_integration > 5) THEN
    RAISE EXCEPTION 'team_integration must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_engagement_checkin_trigger
BEFORE INSERT OR UPDATE ON public.engagement_checkins
FOR EACH ROW EXECUTE FUNCTION public.validate_engagement_checkin();

-- Indexes
CREATE INDEX idx_checkins_candidate ON public.engagement_checkins(candidate_id);
CREATE INDEX idx_checkins_journey ON public.engagement_checkins(journey_id);
CREATE INDEX idx_checkins_day ON public.engagement_checkins(day_number);
CREATE INDEX idx_checkins_org ON public.engagement_checkins(organization_id);

-- RLS
ALTER TABLE public.engagement_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can CRUD engagement_checkins"
ON public.engagement_checkins
FOR ALL
USING (true)
WITH CHECK (true);
