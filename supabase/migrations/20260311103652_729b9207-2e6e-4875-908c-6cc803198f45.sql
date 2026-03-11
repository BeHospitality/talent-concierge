
-- Fix security definer views by setting security_invoker
ALTER VIEW public.public_dossiers SET (security_invoker = on);
ALTER VIEW public.public_insight_reports SET (security_invoker = on);
