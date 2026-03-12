-- Allow anonymous SELECT on dossiers for public_dossiers view (security_invoker = on)
CREATE POLICY "anon_select_sent_dossiers"
ON public.dossiers
FOR SELECT
TO anon
USING (status IN ('sent', 'viewed'));

-- Allow anonymous SELECT on candidates for candidates_safe view (security_invoker = on)
CREATE POLICY "anon_select_candidates_for_safe_view"
ON public.candidates
FOR SELECT
TO anon
USING (true);

-- Allow anonymous SELECT on prescreening_data (needed after PIN verification for dossier content)
CREATE POLICY "anon_select_prescreening_for_dossier"
ON public.prescreening_data
FOR SELECT
TO anon
USING (true);