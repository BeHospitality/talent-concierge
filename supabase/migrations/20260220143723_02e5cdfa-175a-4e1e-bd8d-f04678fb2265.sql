
-- Create insight_reports table for property dossier system
CREATE TABLE IF NOT EXISTS public.insight_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Access
  access_code TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  manager_email TEXT,
  property_name TEXT NOT NULL,
  
  -- Content (flexible JSONB)
  report_data JSONB NOT NULL DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  first_viewed_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_insight_reports_code ON public.insight_reports(access_code);
CREATE INDEX idx_insight_reports_org ON public.insight_reports(organization_id);
CREATE INDEX idx_insight_reports_status ON public.insight_reports(status);

-- Enable RLS
ALTER TABLE public.insight_reports ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "admin_manage_insight_reports" ON public.insight_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Concierge can manage within their org
CREATE POLICY "concierge_manage_insight_reports" ON public.insight_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'concierge')
    AND organization_id = public.get_user_org_id()
  );

-- Public SELECT for PIN verification (app validates PIN in code)
CREATE POLICY "public_read_insight_reports" ON public.insight_reports
  FOR SELECT TO anon USING (status = 'published');

-- Allow anon to update view tracking fields
CREATE POLICY "anon_update_view_tracking" ON public.insight_reports
  FOR UPDATE TO anon
  USING (status = 'published')
  WITH CHECK (status = 'published');
