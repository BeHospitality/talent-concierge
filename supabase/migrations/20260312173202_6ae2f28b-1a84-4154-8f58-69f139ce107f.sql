-- Grant anonymous SELECT on public views needed for unauthenticated access flows
-- public_dossiers: hiring managers view dossiers without login
GRANT SELECT ON public_dossiers TO anon;

-- candidates_safe: used after PIN verification to get candidate name  
GRANT SELECT ON candidates_safe TO anon;

-- public_insight_reports: used for unauthenticated insight report access
GRANT SELECT ON public_insight_reports TO anon;