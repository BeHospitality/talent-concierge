
-- FIX 2: Prevent organization_id reassignment on profiles, candidates, and key tables
CREATE OR REPLACE FUNCTION public.prevent_org_reassignment()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.organization_id IS NOT NULL AND NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    RAISE EXCEPTION 'Organization reassignment not permitted';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER check_org_reassignment_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_org_reassignment();

CREATE TRIGGER check_org_reassignment_candidates
BEFORE UPDATE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.prevent_org_reassignment();

CREATE TRIGGER check_org_reassignment_team_members
BEFORE UPDATE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.prevent_org_reassignment();

CREATE TRIGGER check_org_reassignment_offers
BEFORE UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.prevent_org_reassignment();

CREATE TRIGGER check_org_reassignment_hiring_managers
BEFORE UPDATE ON public.hiring_managers
FOR EACH ROW EXECUTE FUNCTION public.prevent_org_reassignment();

-- FIX 3: Remove the anon SELECT policy on insight_reports that exposes PIN
DROP POLICY IF EXISTS "public_read_insight_reports" ON public.insight_reports;

-- NOTE: Anonymous users should use the public_insight_reports VIEW (which excludes pin).
-- PIN verification remains via the verify_insight_pin RPC function.
