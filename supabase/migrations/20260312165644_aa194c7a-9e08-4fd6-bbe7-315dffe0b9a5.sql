-- =====================================================
-- SECURITY AUDIT FIX 1: CRITICAL - Profile org_id privilege escalation
-- Users can update their profile's organization_id to any org UUID,
-- bypassing ALL org-scoped RLS across the entire application.
-- Fix: Add WITH CHECK that prevents non-admins from changing organization_id.
-- =====================================================

DROP POLICY IF EXISTS "own_or_admin_update" ON public.profiles;

-- Admin can update any profile including organization_id
CREATE POLICY "admin_update_profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can update their own profile but CANNOT change organization_id
CREATE POLICY "own_update_profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    organization_id IS NOT DISTINCT FROM (
      SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  )
);

-- =====================================================
-- SECURITY AUDIT FIX 2: Audit log anonymous injection
-- The "Service role can insert audit_log" policy targets {public} role
-- with WITH CHECK (true), allowing anon users to inject audit entries.
-- Service role bypasses RLS entirely, so this policy is unnecessary.
-- =====================================================

DROP POLICY IF EXISTS "Service role can insert audit_log" ON public.audit_log;

-- =====================================================
-- SECURITY AUDIT FIX 3: Notifications cross-user read
-- org_select on notifications lets any org member read ALL notifications
-- for that org, including those addressed to other users.
-- Fix: Scope to own user_id or admin.
-- =====================================================

DROP POLICY IF EXISTS "org_select" ON public.notifications;

CREATE POLICY "own_or_admin_select"
ON public.notifications FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_id IN (
    SELECT tm.id FROM public.team_members tm
    WHERE tm.organization_id = get_user_org_id()
    AND tm.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- =====================================================
-- SECURITY AUDIT FIX 4: PIN brute-force rate limiting
-- verify_dossier_pin and verify_insight_pin have no rate limiting.
-- A 4-digit PIN has only 10,000 combinations.
-- =====================================================

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.pin_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_code text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_pin_attempts_target_time 
ON public.pin_attempts (target_code, attempted_at);

-- Enable RLS - no direct access needed
ALTER TABLE public.pin_attempts ENABLE ROW LEVEL SECURITY;

-- Auto-cleanup old attempts (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_pin_attempts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.pin_attempts WHERE attempted_at < now() - interval '1 hour';
$$;

-- Updated verify_dossier_pin with rate limiting
CREATE OR REPLACE FUNCTION public.verify_dossier_pin(p_unique_code text, p_pin text)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  attempt_count integer;
BEGIN
  -- Input validation (existing)
  IF p_unique_code IS NULL OR length(trim(p_unique_code)) = 0 THEN
    RAISE EXCEPTION 'unique_code is required';
  END IF;
  IF p_unique_code !~ '^[a-zA-Z0-9_-]+$' THEN
    RAISE EXCEPTION 'invalid unique_code format';
  END IF;
  IF length(p_unique_code) > 50 THEN
    RAISE EXCEPTION 'unique_code too long';
  END IF;
  IF p_pin IS NULL OR length(trim(p_pin)) = 0 THEN
    RAISE EXCEPTION 'pin is required';
  END IF;
  IF p_pin !~ '^\d{4,8}$' THEN
    RAISE EXCEPTION 'pin must be 4-8 digits';
  END IF;

  -- Rate limiting: max 5 attempts per 15 minutes per code
  SELECT count(*) INTO attempt_count
  FROM public.pin_attempts
  WHERE target_code = p_unique_code
    AND attempted_at > now() - interval '15 minutes';

  IF attempt_count >= 5 THEN
    RAISE EXCEPTION 'Too many attempts. Please try again later.';
  END IF;

  -- Log this attempt
  INSERT INTO public.pin_attempts (target_code) VALUES (p_unique_code);

  RETURN (
    SELECT json_build_object(
      'valid', EXISTS (
        SELECT 1 FROM dossiers
        WHERE unique_code = p_unique_code 
          AND pin_code = p_pin 
          AND status != 'not_sent'
          AND (expires_at IS NULL OR expires_at > now())
      ),
      'id', (
        SELECT id FROM dossiers
        WHERE unique_code = p_unique_code 
          AND pin_code = p_pin 
          AND status != 'not_sent'
          AND (expires_at IS NULL OR expires_at > now())
        LIMIT 1
      )
    )
  );
END;
$$;

-- Updated verify_insight_pin with rate limiting
CREATE OR REPLACE FUNCTION public.verify_insight_pin(p_access_code text, p_pin text)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  attempt_count integer;
BEGIN
  -- Input validation (existing)
  IF p_access_code IS NULL OR length(trim(p_access_code)) = 0 THEN
    RAISE EXCEPTION 'access_code is required';
  END IF;
  IF p_access_code !~ '^[a-zA-Z0-9_-]+$' THEN
    RAISE EXCEPTION 'invalid access_code format';
  END IF;
  IF length(p_access_code) > 50 THEN
    RAISE EXCEPTION 'access_code too long';
  END IF;
  IF p_pin IS NULL OR length(trim(p_pin)) = 0 THEN
    RAISE EXCEPTION 'pin is required';
  END IF;
  IF p_pin !~ '^\d{4,8}$' THEN
    RAISE EXCEPTION 'pin must be 4-8 digits';
  END IF;

  -- Rate limiting: max 5 attempts per 15 minutes per code
  SELECT count(*) INTO attempt_count
  FROM public.pin_attempts
  WHERE target_code = p_access_code
    AND attempted_at > now() - interval '15 minutes';

  IF attempt_count >= 5 THEN
    RAISE EXCEPTION 'Too many attempts. Please try again later.';
  END IF;

  -- Log this attempt
  INSERT INTO public.pin_attempts (target_code) VALUES (p_access_code);

  RETURN (
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
    )
  );
END;
$$;