-- Create magic_links table matching the DNA app's expected schema
CREATE TABLE public.magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  org_code TEXT NOT NULL,
  candidate_name TEXT,
  candidate_email TEXT,
  assessment_id UUID,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expire_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

-- Validation trigger for expiry
CREATE OR REPLACE FUNCTION public.validate_magic_link_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expire_at IS NOT NULL AND NEW.expire_at < now() THEN
    RAISE EXCEPTION 'expire_at must be in the future';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_magic_link_expiry_trigger
BEFORE INSERT OR UPDATE ON public.magic_links
FOR EACH ROW EXECUTE FUNCTION public.validate_magic_link_expiry();

ALTER TABLE public.magic_links ENABLE ROW LEVEL SECURITY;

-- DNA app reads tokens anonymously to validate
CREATE POLICY "Anyone can validate magic link by token" ON public.magic_links FOR SELECT TO anon USING (true);

-- DNA app marks links as used after completion
CREATE POLICY "Anon can mark magic link used" ON public.magic_links FOR UPDATE TO anon USING (true);

-- Authenticated Hub users can insert magic links
CREATE POLICY "Auth users can insert magic links" ON public.magic_links FOR INSERT TO authenticated 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'concierge'::app_role)
);

-- Admins can manage all
CREATE POLICY "Admins can manage magic links" ON public.magic_links FOR ALL TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));