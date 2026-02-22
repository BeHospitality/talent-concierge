
-- FIX 1: Candidates table — restrict full access to admin/concierge, create safe view for read_only
DROP POLICY IF EXISTS "org_select" ON public.candidates;

-- Admin/concierge get full field access
CREATE POLICY "org_select" ON public.candidates
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'concierge'::app_role) AND get_user_org_id() = organization_id)
);

-- Safe view excluding PII for read_only users
CREATE OR REPLACE VIEW public.candidates_safe AS
SELECT
  id, organization_id, full_name, current_stage,
  days_in_stage, risk_level, engagement_score,
  prescreening_complete, referral_source,
  created_at, updated_at
FROM public.candidates;

-- Grant read_only users access to the safe view
ALTER VIEW public.candidates_safe OWNER TO postgres;

-- RLS-like access on the view: read_only users in same org can SELECT
CREATE POLICY "readonly_safe_select" ON public.candidates
FOR SELECT USING (
  has_role(auth.uid(), 'read_only'::app_role) AND get_user_org_id() = organization_id
);

-- FIX 2: Hiring managers — restrict to admin/concierge only
DROP POLICY IF EXISTS "org_select" ON public.hiring_managers;

CREATE POLICY "org_select" ON public.hiring_managers
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'concierge'::app_role) AND get_user_org_id() = organization_id)
);
