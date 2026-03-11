
-- ============================================================
-- CRITICAL FIX 1: DOSSIERS — Replace USING(true) anon SELECT
-- ============================================================

DROP POLICY IF EXISTS "anon_select" ON public.dossiers;

CREATE OR REPLACE VIEW public.public_dossiers AS
SELECT id, candidate_id, hiring_manager_id, status, sent_at,
       first_viewed_at, last_viewed_at, view_count, expires_at,
       created_at, organization_id, unique_code, department, role,
       manager_notes, dossier_url
FROM public.dossiers
WHERE status != 'not_sent';

CREATE OR REPLACE FUNCTION public.verify_dossier_pin(p_unique_code text, p_pin text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
  );
$$;

GRANT SELECT ON public.public_dossiers TO anon;

CREATE OR REPLACE FUNCTION public.track_dossier_view(p_dossier_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE dossiers 
  SET view_count = view_count + 1,
      last_viewed_at = now(),
      first_viewed_at = COALESCE(first_viewed_at, now())
  WHERE id = p_dossier_id;
END;
$$;

-- ============================================================
-- CRITICAL FIX 2: MAGIC_LINKS — Restrict anon access
-- ============================================================

DROP POLICY IF EXISTS "Anyone can validate magic link by token" ON public.magic_links;
DROP POLICY IF EXISTS "Anon can mark magic link used" ON public.magic_links;

CREATE OR REPLACE FUNCTION public.validate_magic_link(p_token text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'valid', EXISTS (
      SELECT 1 FROM magic_links
      WHERE token = p_token 
        AND used = false 
        AND (expire_at IS NULL OR expire_at > now())
    ),
    'org_code', (
      SELECT org_code FROM magic_links
      WHERE token = p_token 
        AND used = false 
        AND (expire_at IS NULL OR expire_at > now())
      LIMIT 1
    ),
    'candidate_name', (
      SELECT candidate_name FROM magic_links
      WHERE token = p_token 
        AND used = false 
        AND (expire_at IS NULL OR expire_at > now())
      LIMIT 1
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.use_magic_link(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE magic_links 
  SET used = true, used_at = now()
  WHERE token = p_token 
    AND used = false
    AND (expire_at IS NULL OR expire_at > now());
  RETURN FOUND;
END;
$$;

-- ============================================================
-- CRITICAL FIX 3: ASSESSMENT_LINKS — Remove anon SELECT USING(true)
-- ============================================================

DROP POLICY IF EXISTS "anon_select_by_token" ON public.assessment_links;

CREATE OR REPLACE FUNCTION public.validate_assessment_link(p_token text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'valid', EXISTS (
      SELECT 1 FROM assessment_links
      WHERE token = p_token
        AND completed_at IS NULL
        AND expires_at > now()
    ),
    'candidate_id', (
      SELECT candidate_id FROM assessment_links
      WHERE token = p_token
        AND completed_at IS NULL
        AND expires_at > now()
      LIMIT 1
    )
  );
$$;

-- ============================================================
-- CRITICAL FIX 4: INSIGHT_REPORTS — Restrict anon UPDATE
-- ============================================================

DROP POLICY IF EXISTS "anon_update_view_tracking" ON public.insight_reports;

CREATE OR REPLACE FUNCTION public.track_insight_view(p_report_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE insight_reports 
  SET view_count = COALESCE(view_count, 0) + 1,
      first_viewed_at = COALESCE(first_viewed_at, now())
  WHERE id = p_report_id AND status = 'published';
END;
$$;

-- ============================================================
-- FIX 8: ADD MISSING INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_candidates_organization_id ON candidates(organization_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_notes_candidate_id ON notes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_dossier_views_dossier_id ON dossier_views(dossier_id);
CREATE INDEX IF NOT EXISTS idx_dossier_actions_dossier_id ON dossier_actions(dossier_id);
CREATE INDEX IF NOT EXISTS idx_checkin_responses_candidate_id ON checkin_responses(candidate_id);
CREATE INDEX IF NOT EXISTS idx_assessment_links_token ON assessment_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
