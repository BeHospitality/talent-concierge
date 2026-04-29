-- Build #1C — Stage 3 fix cleanup
-- Remove synthetic Stage 3 test candidate so it does not pollute future
-- end-to-end testing. The candidate row was preserved per AC11 originally
-- but with the helper fix we can recreate cleanly if needed.

DELETE FROM public.candidate_step_log
  WHERE candidate_id = 'd224ac3f-7451-4c86-9804-50875dd6a1ec';

DELETE FROM public.candidates
  WHERE id = 'd224ac3f-7451-4c86-9804-50875dd6a1ec';