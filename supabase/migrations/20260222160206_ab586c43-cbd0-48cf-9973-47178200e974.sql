
-- Fix security definer view: set the view owner to a non-superuser approach
-- by explicitly setting security_invoker = true so RLS of the querying user applies
ALTER VIEW public.public_insight_reports SET (security_invoker = true);
