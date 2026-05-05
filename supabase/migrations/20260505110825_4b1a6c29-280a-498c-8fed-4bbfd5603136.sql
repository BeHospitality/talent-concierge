
-- =========================================================================
-- v4 FINAL Foundation Migration: extensions + candidates schema + name split
-- =========================================================================

-- 1. Enable scheduled job + HTTP infrastructure (Fix 1.4.2/1.4.3/1.4.5)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Candidates: add ~13 sequencing/state fields per v4 spec
ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS candidate_state text,
  ADD COLUMN IF NOT EXISTS profile_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_complete_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_post_profile_check_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS post_profile_check_in_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_1_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_2_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_3_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_4_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_5_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_nudge_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS stall_touch_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_url_broken_at timestamptz;

-- 3. Backfill first_name / last_name from existing full_name (best-effort split)
UPDATE public.candidates
SET first_name = split_part(full_name, ' ', 1),
    last_name  = NULLIF(regexp_replace(full_name, '^\S+\s*', ''), '')
WHERE first_name IS NULL;

-- 4. Index for cron queries (find candidates due for next email/nudge)
CREATE INDEX IF NOT EXISTS idx_candidates_state_org
  ON public.candidates (candidate_state, organization_id)
  WHERE candidate_state IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_candidates_video_broken
  ON public.candidates (video_url_broken_at)
  WHERE video_url_broken_at IS NOT NULL;
