
-- =============================================================
-- SECURITY FIX 1: Add NOT NULL constraints to organization_id
-- =============================================================

-- Backfill any NULL organization_id values
UPDATE candidates SET organization_id = (SELECT id FROM organizations LIMIT 1) WHERE organization_id IS NULL;
UPDATE hiring_managers SET organization_id = (SELECT id FROM organizations LIMIT 1) WHERE organization_id IS NULL;
UPDATE offers SET organization_id = (SELECT id FROM organizations LIMIT 1) WHERE organization_id IS NULL;
UPDATE team_members SET organization_id = (SELECT id FROM organizations LIMIT 1) WHERE organization_id IS NULL;
UPDATE assessment_links SET organization_id = (SELECT id FROM organizations LIMIT 1) WHERE organization_id IS NULL;
UPDATE prescreening_data SET organization_id = (SELECT id FROM organizations LIMIT 1) WHERE organization_id IS NULL;
UPDATE engagement_checkins SET organization_id = (SELECT id FROM organizations LIMIT 1) WHERE organization_id IS NULL;
UPDATE interventions SET organization_id = (SELECT id FROM organizations LIMIT 1) WHERE organization_id IS NULL;
UPDATE checkin_responses SET organization_id = (SELECT id FROM organizations LIMIT 1) WHERE organization_id IS NULL;

-- Add NOT NULL constraints
ALTER TABLE candidates ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE hiring_managers ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE offers ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE team_members ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE assessment_links ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE prescreening_data ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE engagement_checkins ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE interventions ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE checkin_responses ALTER COLUMN organization_id SET NOT NULL;

-- =============================================================
-- SECURITY FIX 2: Restrict audit_log SELECT to admins only
-- =============================================================

DROP POLICY IF EXISTS "Authenticated users can view audit_log" ON audit_log;

CREATE POLICY "admin_read_audit_log"
  ON audit_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================================
-- SECURITY FIX 3: Hide PIN codes from anonymous dossier access
-- =============================================================

-- Create a public view that excludes the pin column
CREATE OR REPLACE VIEW public.public_insight_reports AS
SELECT id, access_code, property_name, manager_name, manager_email, status,
       report_data, published_at, first_viewed_at, view_count, created_at, organization_id, updated_at
FROM insight_reports
WHERE status = 'published';

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.public_insight_reports TO anon;
GRANT SELECT ON public.public_insight_reports TO authenticated;

-- Create RPC function to verify PIN securely server-side
CREATE OR REPLACE FUNCTION public.verify_insight_pin(p_access_code TEXT, p_pin TEXT)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'valid', EXISTS (
      SELECT 1 FROM insight_reports
      WHERE access_code = p_access_code AND pin = p_pin AND status = 'published'
    ),
    'id', (
      SELECT id FROM insight_reports
      WHERE access_code = p_access_code AND pin = p_pin AND status = 'published'
      LIMIT 1
    )
  );
$$;

-- =============================================================
-- SECURITY FIX 4: Leaked password protection
-- NOTE: Enable 'Leaked password protection' in Supabase Auth
-- settings (Dashboard > Authentication > Settings). This is a
-- dashboard-only setting and cannot be configured via SQL.
-- =============================================================
