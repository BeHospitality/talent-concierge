DELETE FROM public.prescreening_data WHERE candidate_email LIKE 'john+stage7d-test%';
DELETE FROM public.candidates WHERE email LIKE 'john+stage7d-test%';
DELETE FROM public.audit_log WHERE event_type = 'dna_candidate_received' AND payload->>'email' LIKE 'john+stage7d-test%';