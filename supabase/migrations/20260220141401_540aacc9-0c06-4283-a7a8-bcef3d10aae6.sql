
-- ============================================================
-- RLS SECURITY HARDENING
-- Replace all USING(true) policies with organization-scoped access
-- ============================================================

-- ─── PART 1: Schema Changes ────────────────────────────────────

-- Add organization_id to profiles for user-org linking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Add organization_id to candidate-linked tables
ALTER TABLE public.buddy_assignments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.assessment_links ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.dossiers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.logistics_checklist ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.engagement_activities ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.checkin_responses ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.hiring_managers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.prescreening_data ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- ─── PART 2: Helper Function ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- ─── PART 3: Drop ALL Existing Permissive Policies ─────────────

-- Org-scoped tables
DROP POLICY IF EXISTS "Authenticated users can CRUD candidates" ON public.candidates;
DROP POLICY IF EXISTS "Authenticated users can CRUD team_members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated users can CRUD buddy_assignments" ON public.buddy_assignments;
DROP POLICY IF EXISTS "Authenticated users can CRUD journey_blueprints" ON public.journey_blueprints;
DROP POLICY IF EXISTS "Authenticated users can CRUD journey_events" ON public.journey_events;
DROP POLICY IF EXISTS "Authenticated users can CRUD engagement_checkins" ON public.engagement_checkins;
DROP POLICY IF EXISTS "Authenticated users can CRUD placement_risks" ON public.placement_risks;
DROP POLICY IF EXISTS "Authenticated users can CRUD assessment_links" ON public.assessment_links;
DROP POLICY IF EXISTS "Authenticated users can CRUD interventions" ON public.interventions;
DROP POLICY IF EXISTS "Authenticated users can CRUD organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can CRUD notes" ON public.notes;
DROP POLICY IF EXISTS "Authenticated users can CRUD offers" ON public.offers;
DROP POLICY IF EXISTS "Authenticated users can CRUD interviews" ON public.interviews;
DROP POLICY IF EXISTS "Authenticated users can CRUD dossiers" ON public.dossiers;
DROP POLICY IF EXISTS "Authenticated users can CRUD logistics" ON public.logistics_checklist;
DROP POLICY IF EXISTS "Authenticated users can CRUD engagement" ON public.engagement_activities;
DROP POLICY IF EXISTS "Authenticated users can CRUD checkins" ON public.checkin_responses;
DROP POLICY IF EXISTS "Authenticated users can CRUD hiring_managers" ON public.hiring_managers;
DROP POLICY IF EXISTS "Authenticated users can CRUD prescreening" ON public.prescreening_data;
DROP POLICY IF EXISTS "Authenticated users can CRUD templates" ON public.checklist_templates;
DROP POLICY IF EXISTS "Authenticated users can CRUD health_scores" ON public.org_health_scores;
DROP POLICY IF EXISTS "Authenticated users can CRUD pulse" ON public.pulse_responses;

-- Notifications (separate policies)
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can view notifications" ON public.notifications;

-- Dossier views/actions (keep anon insert, drop authenticated view)
DROP POLICY IF EXISTS "Authenticated users can view dossier_actions" ON public.dossier_actions;
DROP POLICY IF EXISTS "Authenticated users can view dossier_views" ON public.dossier_views;

-- Profiles (recreate with admin access)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- ─── PART 4: Org-Scoped Policies ──────────────────────────────
-- Pattern: SELECT = admin or same org (all roles)
--          INSERT/UPDATE = admin or concierge+same org
--          DELETE = admin only

-- ── candidates ──
CREATE POLICY "org_select" ON public.candidates FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = organization_id);
CREATE POLICY "org_insert" ON public.candidates FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_update" ON public.candidates FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_delete" ON public.candidates FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── team_members ──
CREATE POLICY "org_select" ON public.team_members FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = organization_id);
CREATE POLICY "org_insert" ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_update" ON public.team_members FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_delete" ON public.team_members FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── buddy_assignments ──
CREATE POLICY "org_select" ON public.buddy_assignments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = organization_id);
CREATE POLICY "org_insert" ON public.buddy_assignments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_update" ON public.buddy_assignments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_delete" ON public.buddy_assignments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── journey_blueprints ──
CREATE POLICY "org_select" ON public.journey_blueprints FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = organization_id);
CREATE POLICY "org_insert" ON public.journey_blueprints FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_update" ON public.journey_blueprints FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_delete" ON public.journey_blueprints FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── journey_events ──
CREATE POLICY "org_select" ON public.journey_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = organization_id);
CREATE POLICY "org_insert" ON public.journey_events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_update" ON public.journey_events FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_delete" ON public.journey_events FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── engagement_checkins ──
CREATE POLICY "org_select" ON public.engagement_checkins FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = organization_id);
CREATE POLICY "org_insert" ON public.engagement_checkins FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_update" ON public.engagement_checkins FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_delete" ON public.engagement_checkins FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── interventions ──
CREATE POLICY "org_select" ON public.interventions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = organization_id);
CREATE POLICY "org_insert" ON public.interventions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_update" ON public.interventions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_delete" ON public.interventions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── org_health_scores ──
CREATE POLICY "org_select" ON public.org_health_scores FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = organization_id);
CREATE POLICY "org_insert" ON public.org_health_scores FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_update" ON public.org_health_scores FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_delete" ON public.org_health_scores FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── assessment_links ──
CREATE POLICY "org_select" ON public.assessment_links FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = organization_id);
CREATE POLICY "org_insert" ON public.assessment_links FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_update" ON public.assessment_links FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_delete" ON public.assessment_links FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── notes ──
CREATE POLICY "org_select" ON public.notes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = organization_id);
CREATE POLICY "org_insert" ON public.notes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_update" ON public.notes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_delete" ON public.notes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── offers ──
CREATE POLICY "org_select" ON public.offers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = organization_id);
CREATE POLICY "org_insert" ON public.offers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_update" ON public.offers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_delete" ON public.offers FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── interviews ──
CREATE POLICY "org_select" ON public.interviews FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = organization_id);
CREATE POLICY "org_insert" ON public.interviews FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_update" ON public.interviews FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_delete" ON public.interviews FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── dossiers (+ anon SELECT for PIN-protected flow) ──
CREATE POLICY "org_select" ON public.dossiers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = organization_id);
CREATE POLICY "anon_select" ON public.dossiers FOR SELECT TO anon
  USING (true);
CREATE POLICY "org_insert" ON public.dossiers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_update" ON public.dossiers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_delete" ON public.dossiers FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── logistics_checklist ──
CREATE POLICY "org_select" ON public.logistics_checklist FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = organization_id);
CREATE POLICY "org_insert" ON public.logistics_checklist FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_update" ON public.logistics_checklist FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_delete" ON public.logistics_checklist FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── engagement_activities ──
CREATE POLICY "org_select" ON public.engagement_activities FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = organization_id);
CREATE POLICY "org_insert" ON public.engagement_activities FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_update" ON public.engagement_activities FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_delete" ON public.engagement_activities FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── checkin_responses ──
CREATE POLICY "org_select" ON public.checkin_responses FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = organization_id);
CREATE POLICY "org_insert" ON public.checkin_responses FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_update" ON public.checkin_responses FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_delete" ON public.checkin_responses FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── hiring_managers ──
CREATE POLICY "org_select" ON public.hiring_managers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = organization_id);
CREATE POLICY "org_insert" ON public.hiring_managers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_update" ON public.hiring_managers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_delete" ON public.hiring_managers FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── notifications ──
CREATE POLICY "org_select" ON public.notifications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = organization_id);
CREATE POLICY "org_insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_update" ON public.notifications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_delete" ON public.notifications FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── prescreening_data ──
CREATE POLICY "org_select" ON public.prescreening_data FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = organization_id);
CREATE POLICY "org_insert" ON public.prescreening_data FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_update" ON public.prescreening_data FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = organization_id));
CREATE POLICY "org_delete" ON public.prescreening_data FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ─── PART 5: Special Table Policies ───────────────────────────

-- ── placement_risks (uses target_organization_id) ──
CREATE POLICY "org_select" ON public.placement_risks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = target_organization_id);
CREATE POLICY "org_insert" ON public.placement_risks FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = target_organization_id));
CREATE POLICY "org_update" ON public.placement_risks FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'concierge') AND public.get_user_org_id() = target_organization_id));
CREATE POLICY "org_delete" ON public.placement_risks FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── organizations (use id, not organization_id) ──
CREATE POLICY "org_select" ON public.organizations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_user_org_id() = id);
CREATE POLICY "admin_insert" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update" ON public.organizations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete" ON public.organizations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── profiles (user-scoped + admin access) ──
CREATE POLICY "own_or_admin_select" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own_insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_or_admin_update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ── checklist_templates (admin + concierge, global) ──
CREATE POLICY "auth_select" ON public.checklist_templates FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'concierge'));
CREATE POLICY "admin_insert" ON public.checklist_templates FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update" ON public.checklist_templates FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete" ON public.checklist_templates FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── pulse_responses (anon insert stays, admin read) ──
CREATE POLICY "admin_select" ON public.pulse_responses FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update" ON public.pulse_responses FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete" ON public.pulse_responses FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── dossier_actions (anon insert stays, admin read) ──
CREATE POLICY "admin_select" ON public.dossier_actions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'concierge'));

-- ── dossier_views (anon insert stays, admin read) ──
CREATE POLICY "admin_select" ON public.dossier_views FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'concierge'));
