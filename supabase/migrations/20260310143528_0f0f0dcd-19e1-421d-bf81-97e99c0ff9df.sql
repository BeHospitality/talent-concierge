CREATE POLICY "anon_select_by_token"
ON public.assessment_links
FOR SELECT
TO anon
USING (true);