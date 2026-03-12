
-- 1. verify_dossier_pin: add input validation
CREATE OR REPLACE FUNCTION public.verify_dossier_pin(p_unique_code text, p_pin text)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
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

-- 2. verify_insight_pin: add input validation
CREATE OR REPLACE FUNCTION public.verify_insight_pin(p_access_code text, p_pin text)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
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

-- 3. track_dossier_view: add NULL check
CREATE OR REPLACE FUNCTION public.track_dossier_view(p_dossier_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF p_dossier_id IS NULL THEN
    RAISE EXCEPTION 'dossier_id is required';
  END IF;

  UPDATE dossiers 
  SET view_count = view_count + 1,
      last_viewed_at = now(),
      first_viewed_at = COALESCE(first_viewed_at, now())
  WHERE id = p_dossier_id;
END;
$$;

-- 4. track_insight_view: add NULL check
CREATE OR REPLACE FUNCTION public.track_insight_view(p_report_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF p_report_id IS NULL THEN
    RAISE EXCEPTION 'report_id is required';
  END IF;

  UPDATE insight_reports 
  SET view_count = COALESCE(view_count, 0) + 1,
      first_viewed_at = COALESCE(first_viewed_at, now())
  WHERE id = p_report_id AND status = 'published';
END;
$$;

-- 5. validate_magic_link: add input validation
CREATE OR REPLACE FUNCTION public.validate_magic_link(p_token text)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) = 0 THEN
    RAISE EXCEPTION 'token is required';
  END IF;
  IF length(p_token) > 255 THEN
    RAISE EXCEPTION 'token too long';
  END IF;
  IF p_token !~ '^[a-zA-Z0-9_-]+$' THEN
    RAISE EXCEPTION 'invalid token format';
  END IF;

  RETURN (
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
    )
  );
END;
$$;

-- 6. use_magic_link: add input validation
CREATE OR REPLACE FUNCTION public.use_magic_link(p_token text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) = 0 THEN
    RAISE EXCEPTION 'token is required';
  END IF;
  IF length(p_token) > 255 THEN
    RAISE EXCEPTION 'token too long';
  END IF;
  IF p_token !~ '^[a-zA-Z0-9_-]+$' THEN
    RAISE EXCEPTION 'invalid token format';
  END IF;

  UPDATE magic_links 
  SET used = true, used_at = now()
  WHERE token = p_token 
    AND used = false
    AND (expire_at IS NULL OR expire_at > now());
  RETURN FOUND;
END;
$$;

-- 7. validate_assessment_link: add input validation
CREATE OR REPLACE FUNCTION public.validate_assessment_link(p_token text)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) = 0 THEN
    RAISE EXCEPTION 'token is required';
  END IF;
  IF length(p_token) > 255 THEN
    RAISE EXCEPTION 'token too long';
  END IF;
  IF p_token !~ '^[a-zA-Z0-9_-]+$' THEN
    RAISE EXCEPTION 'invalid token format';
  END IF;

  RETURN (
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
    )
  );
END;
$$;

-- 8. has_role: add NULL check
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
END;
$$;
