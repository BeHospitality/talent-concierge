
-- Fix: restrict concierge magic link creation to their own org's org_code
DROP POLICY IF EXISTS "Auth users can insert magic links" ON magic_links;
CREATE POLICY "Auth users can insert magic links" ON magic_links
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      has_role(auth.uid(), 'concierge'::app_role)
      AND org_code = (
        SELECT o.org_code FROM organizations o
        WHERE o.id = get_user_org_id()
        LIMIT 1
      )
    )
  );
