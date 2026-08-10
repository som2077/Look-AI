-- Migration to fix ALL owner-RLS policies for Clerk authentication.
--
-- Root cause (verified live 2026-08-10): every owner policy is
--   ((auth.jwt() ->> 'sub'::text) = user_id) OR ((auth.uid())::text = user_id)
-- The auth.uid() branch casts the JWT `sub` claim to uuid. Clerk's `sub` is a
-- TEXT user id (e.g. 'user_3HSQGjztQFH1j35WLdzqB7mvYjP'), so auth.uid() throws:
--   ERROR 22P02: invalid input syntax for type uuid
-- on EVERY Clerk-authenticated request that evaluates an owner policy
-- (observed as PostgREST 400/406 from the app).
--
-- Fix: drop the auth.uid() branch from every policy. Clerk provides the user
-- id via auth.jwt() ->> 'sub', which is already the FIRST (correct) branch.
-- The legacy auth.uid() branch only applies to a Supabase auth.users JWT, which
-- this project does not use (Clerk-only auth). Applies to USING and WITH CHECK,
-- including the parent-EXISTS policies (ai_recommendation_items, outfit_items).
--
-- This migration is idempotent: on a fresh schema there are no auth.uid()
-- policies left, so the loop body never runs.

DO $$
DECLARE
  r RECORD;
  q text;
  c text;
  cmd_sql text;
  n_fixed int := 0;
BEGIN
  FOR r IN
    SELECT c2.relname AS tbl, pol.polname AS pname, pol.polcmd::text AS cmd,
           pg_get_expr(pol.polqual, pol.polrelid) AS using_expr,
           pg_get_expr(pol.polwithcheck, pol.polrelid) AS check_expr
    FROM pg_policy pol
    JOIN pg_class c2 ON c2.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c2.relnamespace
    WHERE n.nspname = 'public'
      AND (pg_get_expr(pol.polqual, pol.polrelid) ILIKE '%auth.uid()%'
           OR pg_get_expr(pol.polwithcheck, pol.polrelid) ILIKE '%auth.uid()%')
  LOOP
    -- Remove " OR ((auth.uid())::text = <owner_col>)" (handles both `user_id`
    -- and qualified `logged_outfits.user_id` forms)
    q := NULLIF(regexp_replace(r.using_expr, '\s*OR\s*\(\(\s*auth\.uid\(\)\s*\)::text\s*=\s*[a-zA-Z0-9_.]+\)', '', 'g'), '');
    c := NULLIF(regexp_replace(r.check_expr, '\s*OR\s*\(\(\s*auth\.uid\(\)\s*\)::text\s*=\s*[a-zA-Z0-9_.]+\)', '', 'g'), '');

    EXECUTE format('DROP POLICY %I ON public.%I', r.pname, r.tbl);

    cmd_sql := CASE r.cmd
      WHEN 'r' THEN 'FOR SELECT'
      WHEN 'a' THEN 'FOR INSERT'
      WHEN 'w' THEN 'FOR UPDATE'
      WHEN 'd' THEN 'FOR DELETE'
      ELSE '' END;

    IF q IS NOT NULL AND c IS NOT NULL THEN
      EXECUTE format('CREATE POLICY %I ON public.%I %s USING (%s) WITH CHECK (%s)', r.pname, r.tbl, cmd_sql, q, c);
    ELSIF q IS NOT NULL THEN
      EXECUTE format('CREATE POLICY %I ON public.%I %s USING (%s)', r.pname, r.tbl, cmd_sql, q);
    ELSIF c IS NOT NULL THEN
      EXECUTE format('CREATE POLICY %I ON public.%I %s WITH CHECK (%s)', r.pname, r.tbl, cmd_sql, c);
    END IF;

    n_fixed := n_fixed + 1;
  END LOOP;
END $$;
