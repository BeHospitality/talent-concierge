
DROP VIEW IF EXISTS public_insight_reports;

CREATE VIEW public_insight_reports WITH (security_invoker = on) AS
SELECT
  id,
  access_code,
  property_name,
  manager_name,
  status,
  view_count,
  created_at,
  organization_id
FROM insight_reports
WHERE status = 'published';

COMMENT ON VIEW public_insight_reports IS 'Public-safe view excluding PII (manager_email, pin, report_data)';
