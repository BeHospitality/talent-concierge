
-- Create enums
CREATE TYPE public.candidate_stage AS ENUM ('pre_screening', 'submitted', 'in_review', 'interview', 'offer_pending', 'offer_accepted', 'pre_arrival', 'active');
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.archetype AS ENUM ('lion', 'whale', 'falcon');
CREATE TYPE public.org_status AS ENUM ('prospect', 'client', 'churned');
CREATE TYPE public.dossier_status AS ENUM ('not_sent', 'sent', 'viewed', 'interested', 'passed', 'need_more_info');
CREATE TYPE public.interview_type AS ENUM ('phone', 'video', 'in_person');
CREATE TYPE public.interview_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE public.interview_outcome AS ENUM ('pass', 'conditional', 'no_hire', 'pending');
CREATE TYPE public.contract_type AS ENUM ('full_time', 'part_time', 'contract', 'seasonal');
CREATE TYPE public.offer_status AS ENUM ('pending', 'signed', 'declined', 'expired');
CREATE TYPE public.checklist_status AS ENUM ('pending', 'in_progress', 'complete');
CREATE TYPE public.buddy_status AS ENUM ('suggested', 'approved', 'notified', 'acknowledged', 'active');
CREATE TYPE public.activity_type AS ENUM ('email_sent', 'email_opened', 'form_submitted', 'call_scheduled', 'checkin_completed', 'checkin_missed', 'interview_attended', 'interview_missed', 'offer_viewed', 'offer_signed');
CREATE TYPE public.note_category AS ENUM ('follow_up', 'concern', 'celebration', 'general', 'legal', 'hr');
CREATE TYPE public.dossier_action_type AS ENUM ('interested', 'passed', 'need_more_info');
CREATE TYPE public.app_role AS ENUM ('admin', 'concierge', 'read_only');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  org_code TEXT UNIQUE NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  status org_status NOT NULL DEFAULT 'prospect',
  annual_contract_value DECIMAL,
  contract_start_date DATE,
  contract_end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD organizations" ON public.organizations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Candidates table
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  resume_url TEXT,
  current_location TEXT,
  desired_location TEXT,
  referral_source TEXT,
  current_stage candidate_stage NOT NULL DEFAULT 'pre_screening',
  days_in_stage INTEGER NOT NULL DEFAULT 0,
  risk_level risk_level NOT NULL DEFAULT 'low',
  engagement_score INTEGER NOT NULL DEFAULT 100,
  last_contact_date DATE DEFAULT CURRENT_DATE,
  next_checkin_date DATE,
  prescreening_complete BOOLEAN NOT NULL DEFAULT false,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD candidates" ON public.candidates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Prescreening data
CREATE TABLE public.prescreening_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tribe_viral_archetype archetype,
  tribe_viral_scores JSONB,
  tribe_viral_url TEXT,
  career_compass_milestones JSONB,
  career_compass_url TEXT,
  career_compass_motivators JSONB,
  six_month_checkin_date DATE,
  retention_risk_windows JSONB,
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.prescreening_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD prescreening" ON public.prescreening_data FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Hiring managers
CREATE TABLE public.hiring_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  phone TEXT,
  default_pin_preference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hiring_managers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD hiring_managers" ON public.hiring_managers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Dossiers
CREATE TABLE public.dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  unique_code TEXT UNIQUE NOT NULL,
  pin_code TEXT NOT NULL,
  hiring_manager_id UUID REFERENCES public.hiring_managers(id),
  department TEXT,
  role TEXT,
  manager_notes TEXT,
  status dossier_status NOT NULL DEFAULT 'not_sent',
  dossier_url TEXT,
  sent_at TIMESTAMPTZ,
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dossiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD dossiers" ON public.dossiers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Dossier views
CREATE TABLE public.dossier_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID REFERENCES public.dossiers(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);
ALTER TABLE public.dossier_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view dossier_views" ON public.dossier_views FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert dossier views" ON public.dossier_views FOR INSERT TO anon WITH CHECK (true);

-- Dossier actions
CREATE TABLE public.dossier_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID REFERENCES public.dossiers(id) ON DELETE CASCADE NOT NULL,
  action_type dossier_action_type NOT NULL,
  feedback_text TEXT,
  action_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dossier_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view dossier_actions" ON public.dossier_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert dossier actions" ON public.dossier_actions FOR INSERT TO anon WITH CHECK (true);

-- Interviews
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  round_number INTEGER NOT NULL DEFAULT 1,
  scheduled_date TIMESTAMPTZ NOT NULL,
  interviewer_name TEXT NOT NULL,
  interview_type interview_type NOT NULL DEFAULT 'video',
  location_or_link TEXT,
  status interview_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  outcome interview_outcome DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD interviews" ON public.interviews FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Offers
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL UNIQUE,
  job_title TEXT NOT NULL,
  department TEXT,
  salary DECIMAL,
  start_date DATE,
  contract_type contract_type NOT NULL DEFAULT 'full_time',
  benefits_summary TEXT,
  special_terms TEXT,
  offer_letter_url TEXT,
  signature_data TEXT,
  signature_date TIMESTAMPTZ,
  status offer_status NOT NULL DEFAULT 'pending',
  negotiation_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD offers" ON public.offers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Logistics checklist
CREATE TABLE public.logistics_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  status checklist_status NOT NULL DEFAULT 'pending',
  due_date DATE,
  assigned_to TEXT,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  order_position INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.logistics_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD logistics" ON public.logistics_checklist FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Team members
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  photo_url TEXT,
  department TEXT NOT NULL,
  role TEXT NOT NULL,
  tribe_viral_archetype archetype,
  is_available_as_buddy BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD team_members" ON public.team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Buddy assignments
CREATE TABLE public.buddy_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL UNIQUE,
  buddy_id UUID REFERENCES public.team_members(id) NOT NULL,
  match_score INTEGER DEFAULT 0,
  match_reason TEXT,
  status buddy_status NOT NULL DEFAULT 'suggested',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified_at TIMESTAMPTZ
);
ALTER TABLE public.buddy_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD buddy_assignments" ON public.buddy_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Engagement activities
CREATE TABLE public.engagement_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  activity_type activity_type NOT NULL,
  activity_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  details JSONB
);
ALTER TABLE public.engagement_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD engagement" ON public.engagement_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Checkin responses
CREATE TABLE public.checkin_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  checkin_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  still_excited BOOLEAN,
  concerns TEXT,
  needs_help TEXT,
  response_received BOOLEAN NOT NULL DEFAULT false,
  responded_at TIMESTAMPTZ
);
ALTER TABLE public.checkin_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD checkins" ON public.checkin_responses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Notes
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  note_text TEXT NOT NULL,
  category note_category NOT NULL DEFAULT 'general',
  author TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD notes" ON public.notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Pulse responses
CREATE TABLE public.pulse_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  respondent_name TEXT,
  department TEXT,
  question_id INTEGER NOT NULL,
  answer JSONB NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pulse_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD pulse" ON public.pulse_responses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon can insert pulse" ON public.pulse_responses FOR INSERT TO anon WITH CHECK (true);

-- Org health scores
CREATE TABLE public.org_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  health_score INTEGER DEFAULT 0,
  autonomy_score INTEGER DEFAULT 0,
  collaboration_score INTEGER DEFAULT 0,
  communication_score INTEGER DEFAULT 0,
  pace_score INTEGER DEFAULT 0,
  leadership_score INTEGER DEFAULT 0,
  key_friction_points JSONB DEFAULT '[]'::jsonb,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.org_health_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD health_scores" ON public.org_health_scores FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Checklist templates
CREATE TABLE public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD templates" ON public.checklist_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON public.candidates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON public.interviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
