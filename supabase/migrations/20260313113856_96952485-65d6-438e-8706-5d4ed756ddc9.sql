
-- Reset PIN attempts for the dossier code
DELETE FROM public.pin_attempts WHERE target_code = 'gczu7q82';

-- Reset the existing dossier with a new PIN and fresh expiration
UPDATE public.dossiers 
SET pin_code = '341826', 
    status = 'sent', 
    sent_at = now(), 
    expires_at = now() + interval '30 days',
    view_count = 0,
    first_viewed_at = NULL,
    last_viewed_at = NULL
WHERE unique_code = 'gczu7q82';
