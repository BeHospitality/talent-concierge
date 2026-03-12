-- Re-grant SELECT on public_dossiers to both anon and authenticated
GRANT SELECT ON public.public_dossiers TO anon;
GRANT SELECT ON public.public_dossiers TO authenticated;

-- Also ensure candidates_safe and public_insight_reports are accessible
GRANT SELECT ON public.candidates_safe TO anon;
GRANT SELECT ON public.candidates_safe TO authenticated;
GRANT SELECT ON public.public_insight_reports TO anon;
GRANT SELECT ON public.public_insight_reports TO authenticated;