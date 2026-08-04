-- Fix RLS policies: restrict insert/update to service_role only
-- Previously these used WITH CHECK (true) which allowed any authenticated user to write

-- entitlements
DROP POLICY IF EXISTS "entitlement_service_insert" ON entitlements;
DROP POLICY IF EXISTS "entitlement_service_update" ON entitlements;

CREATE POLICY "entitlement_service_insert" ON entitlements FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "entitlement_service_update" ON entitlements FOR UPDATE
USING (auth.role() = 'service_role');

-- purchase_tokens
DROP POLICY IF EXISTS "tokens_service_insert" ON purchase_tokens;

CREATE POLICY "tokens_service_insert" ON purchase_tokens FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- billing_events
DROP POLICY IF EXISTS "billing_events_service_insert" ON billing_events;

CREATE POLICY "billing_events_service_insert" ON billing_events FOR INSERT
WITH CHECK (auth.role() = 'service_role');
