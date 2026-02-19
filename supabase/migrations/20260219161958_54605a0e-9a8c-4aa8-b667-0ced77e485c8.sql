
-- Journey Blueprints: tracks candidate lifecycle from DNA arrival to Day 90
CREATE TABLE IF NOT EXISTS public.journey_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  current_phase TEXT NOT NULL DEFAULT 'screening',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  offer_date TIMESTAMP WITH TIME ZONE,
  start_work_date TIMESTAMP WITH TIME ZONE,
  day_90_date TIMESTAMP WITH TIME ZONE,
  assigned_buddy_id UUID REFERENCES public.team_members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_journey_org ON public.journey_blueprints(organization_id);
CREATE INDEX idx_journey_candidate ON public.journey_blueprints(candidate_id);
CREATE INDEX idx_journey_status ON public.journey_blueprints(status);

-- Enable RLS
ALTER TABLE public.journey_blueprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can CRUD journey_blueprints"
  ON public.journey_blueprints FOR ALL
  USING (true) WITH CHECK (true);

-- Journey Events: individual milestones, tasks, check-ins within a journey
CREATE TABLE IF NOT EXISTS public.journey_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID REFERENCES public.journey_blueprints(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  day_offset INTEGER,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to TEXT,
  priority TEXT DEFAULT 'normal',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_journey ON public.journey_events(journey_id);
CREATE INDEX idx_events_status ON public.journey_events(status);
CREATE INDEX idx_events_phase ON public.journey_events(phase);
CREATE INDEX idx_events_scheduled ON public.journey_events(scheduled_for);

-- Enable RLS
ALTER TABLE public.journey_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can CRUD journey_events"
  ON public.journey_events FOR ALL
  USING (true) WITH CHECK (true);

-- Updated_at trigger for journey_blueprints
CREATE TRIGGER update_journey_blueprints_updated_at
  BEFORE UPDATE ON public.journey_blueprints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
