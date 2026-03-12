-- Tighten anon access on candidates: only allow via candidates_safe view
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "anon_select_candidates_for_safe_view" ON public.candidates;

-- Recreate with restriction: anon can only see candidates that have a sent dossier
-- This limits exposure while allowing the dossier flow to work
CREATE POLICY "anon_select_candidates_for_dossier"
ON public.candidates
FOR SELECT
TO anon
USING (
  id IN (SELECT candidate_id FROM dossiers WHERE status IN ('sent', 'viewed'))
);

-- Similarly tighten prescreening_data
DROP POLICY IF EXISTS "anon_select_prescreening_for_dossier" ON public.prescreening_data;

CREATE POLICY "anon_select_prescreening_for_dossier"
ON public.prescreening_data
FOR SELECT
TO anon
USING (
  candidate_id IN (SELECT candidate_id FROM dossiers WHERE status IN ('sent', 'viewed'))
);