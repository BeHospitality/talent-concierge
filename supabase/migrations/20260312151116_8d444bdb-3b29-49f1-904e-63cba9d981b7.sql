
-- Fix candidates: change org_select and readonly_safe_select from {public} to {authenticated}
DROP POLICY IF EXISTS "org_select" ON candidates;
CREATE POLICY "org_select" ON candidates
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (has_role(auth.uid(), 'concierge'::app_role) AND (get_user_org_id() = organization_id))
  );

DROP POLICY IF EXISTS "readonly_safe_select" ON candidates;
CREATE POLICY "readonly_safe_select" ON candidates
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'read_only'::app_role) AND (get_user_org_id() = organization_id)
  );

-- Fix hiring_managers: change org_select from {public} to {authenticated}
DROP POLICY IF EXISTS "org_select" ON hiring_managers;
CREATE POLICY "org_select" ON hiring_managers
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (has_role(auth.uid(), 'concierge'::app_role) AND (get_user_org_id() = organization_id))
  );
