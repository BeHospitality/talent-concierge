
DELETE FROM public.pin_attempts WHERE target_code = 'gczu7q82';

UPDATE public.dossiers 
SET pin_code = '527463', 
    status = 'sent', 
    sent_at = now(), 
    expires_at = now() + interval '30 days',
    view_count = 0,
    first_viewed_at = NULL,
    last_viewed_at = NULL
WHERE unique_code = 'gczu7q82';
