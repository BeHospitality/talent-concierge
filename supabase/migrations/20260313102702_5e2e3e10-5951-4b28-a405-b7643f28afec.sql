CREATE OR REPLACE FUNCTION public.verify_dossier_pin(p_unique_code text, p_pin text)
RETURNS json
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attempt_count integer;
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

  SELECT count(*) INTO attempt_count
  FROM public.pin_attempts
  WHERE target_code = p_unique_code
    AND attempted_at > now() - interval '15 minutes';

  IF attempt_count >= 5 THEN
    RAISE EXCEPTION 'Too many attempts. Please try again later.';
  END IF;

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
$function$;