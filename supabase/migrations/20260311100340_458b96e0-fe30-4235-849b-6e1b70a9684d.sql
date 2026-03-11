DELETE FROM org_health_scores WHERE organization_id = 'dea539ae-1a8f-4f2d-b4c9-2757407d8bd5';
DELETE FROM pulse_responses WHERE organization_id = 'dea539ae-1a8f-4f2d-b4c9-2757407d8bd5';
DELETE FROM audit_log WHERE event_type = 'client_onboarded_from_staff_audit' AND payload->>'org_code' = 'test-automated-hotel-2';
DELETE FROM organizations WHERE org_code = 'test-automated-hotel-2';