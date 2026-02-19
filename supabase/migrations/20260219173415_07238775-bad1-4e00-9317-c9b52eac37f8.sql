
-- Create admin whitelist table
CREATE TABLE IF NOT EXISTS public.admin_whitelist (
  email TEXT PRIMARY KEY,
  name TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view admin_whitelist"
ON public.admin_whitelist
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage admin_whitelist"
ON public.admin_whitelist
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed admin emails
INSERT INTO public.admin_whitelist (email, name) VALUES
('hello@be.ie', 'Admin'),
('info@be.ie', 'Admin')
ON CONFLICT (email) DO NOTHING;

-- Update handle_new_user to check whitelist and default to read_only
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));

  SELECT EXISTS(
    SELECT 1 FROM public.admin_whitelist WHERE email = NEW.email
  ) INTO is_admin_user;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_admin_user THEN 'admin'::app_role ELSE 'read_only'::app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
