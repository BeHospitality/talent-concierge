
CREATE TABLE public.brevo_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  brevo_template_id integer NOT NULL,
  template_name text NOT NULL,
  subject text NOT NULL,
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  reply_to_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.brevo_templates ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_brevo_templates_key ON public.brevo_templates (template_key);

CREATE TRIGGER trg_brevo_templates_updated_at
BEFORE UPDATE ON public.brevo_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
