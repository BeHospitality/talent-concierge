-- ============================================================
-- Build #1C Stage 1: Hub schema foundation (29 April 2026)
-- ============================================================

-- 1a. candidates: lowercase CHECK + new columns
ALTER TABLE candidates
  ADD CONSTRAINT candidates_email_lowercase_check
  CHECK (email = lower(email));

ALTER TABLE candidates
  ADD COLUMN communication_status text NOT NULL DEFAULT 'manual_review'
  CHECK (communication_status IN ('auto_b2c_active', 'manual_review', 'paused', 'complete'));

ALTER TABLE candidates
  ADD COLUMN current_journey_type text NOT NULL DEFAULT 'h2b_phase1_screening'
  CHECK (current_journey_type IN ('h2b_phase1_screening', 'h2b_phase2_onboarding', 'direct_hire_screening', 'executive_placement'));

-- 1b. prescreening_data: lowercase CHECK
ALTER TABLE prescreening_data
  ADD CONSTRAINT prescreening_data_candidate_email_lowercase_check
  CHECK (candidate_email IS NULL OR candidate_email = lower(candidate_email));

-- 1c. New ledger table
CREATE TABLE candidate_step_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_email text NOT NULL,
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  assessment_id uuid,
  journey_type text NOT NULL DEFAULT 'h2b_phase1_screening',
  step_number int NOT NULL,
  step_name text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL,
  payload jsonb,
  CONSTRAINT candidate_step_log_email_lowercase_check
    CHECK (candidate_email = lower(candidate_email)),
  CONSTRAINT candidate_step_log_journey_type_check
    CHECK (journey_type IN ('h2b_phase1_screening', 'h2b_phase2_onboarding', 'direct_hire_screening', 'executive_placement')),
  CONSTRAINT candidate_step_log_step_number_check
    CHECK (step_number > 0),
  CONSTRAINT candidate_step_log_source_check
    CHECK (source IN ('dna-app', 'connect-portal', 'hub-manual', 'hub-backfill')),
  CONSTRAINT candidate_step_log_unique_step_per_journey
    UNIQUE (candidate_email, journey_type, step_number)
);

CREATE INDEX idx_candidate_step_log_email ON candidate_step_log (candidate_email);
CREATE INDEX idx_candidate_step_log_organization ON candidate_step_log (organization_id);
CREATE INDEX idx_candidate_step_log_assessment ON candidate_step_log (assessment_id);
CREATE INDEX idx_candidate_step_log_journey_type ON candidate_step_log (journey_type);

-- 1d. RLS
ALTER TABLE candidate_step_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_select ON candidate_step_log
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (has_role(auth.uid(), 'concierge'::app_role) AND get_user_org_id() = organization_id)
  );

CREATE POLICY org_insert ON candidate_step_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR (has_role(auth.uid(), 'concierge'::app_role) AND get_user_org_id() = organization_id)
  );

CREATE POLICY org_update ON candidate_step_log
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (has_role(auth.uid(), 'concierge'::app_role) AND get_user_org_id() = organization_id)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR (has_role(auth.uid(), 'concierge'::app_role) AND get_user_org_id() = organization_id)
  );

CREATE POLICY org_delete ON candidate_step_log
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY readonly_safe_select ON candidate_step_log
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'read_only'::app_role)
    AND get_user_org_id() = organization_id
  );

-- 1e. Step 1 backfill for existing candidates with prescreening_complete=true
INSERT INTO candidate_step_log (
  candidate_email,
  candidate_id,
  organization_id,
  journey_type,
  step_number,
  step_name,
  completed_at,
  source,
  payload
)
SELECT
  c.email,
  c.id,
  c.organization_id,
  'h2b_phase1_screening',
  1,
  'dna_assessment_complete',
  COALESCE(c.created_at, now()),
  'hub-backfill',
  jsonb_build_object(
    'backfill_reason', 'existing_candidate_at_stage1_launch',
    'backfilled_at', now(),
    'inferred_from', 'prescreening_complete=true'
  )
FROM candidates c
WHERE c.prescreening_complete = true
ON CONFLICT (candidate_email, journey_type, step_number) DO NOTHING;