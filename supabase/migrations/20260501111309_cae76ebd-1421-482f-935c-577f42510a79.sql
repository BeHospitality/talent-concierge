
-- Delete synthetic prescreening row first (no FK but logically dependent)
DELETE FROM prescreening_data
WHERE candidate_email = 'stage7c-synth-hubrelay@test.invalid';

-- Delete synthetic candidate row
DELETE FROM candidates
WHERE id = '7b1fff30-abc6-43ea-b68e-5ea67b2b6ad4'
  AND email = 'stage7c-synth-hubrelay@test.invalid';

-- Audit the correction (additive — preserves original entry but contextualises it)
INSERT INTO audit_log (event_type, payload)
VALUES (
  'dna_dimension_scores_unrecoverable_corrected',
  jsonb_build_object(
    'candidate_email', 'stage7c-synth-hubrelay@test.invalid',
    'original_audit_id', '694ed531-83ca-4ae1-9537-176f57b88773',
    'correction_reason', 'synthetic_stage7c_verification_artefact_not_real_candidate',
    'action_taken', 'deleted_candidate_and_prescreening_rows',
    'corrected_at', now(),
    'note', 'Original dna_dimension_scores_unrecoverable entry remains in audit_log for chain-of-custody but is superseded by this correction. No real candidate data was lost.'
  )
);
