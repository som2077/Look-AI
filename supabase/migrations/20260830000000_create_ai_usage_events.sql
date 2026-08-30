-- AI usage events: one row per successful AI feature invocation.
-- Used to power the "AI Usage" section in the user profile.
-- All writes are client-driven (via trackAiUsage helper) and fire-and-forget.

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  feature_key   TEXT NOT NULL,
  feature_label TEXT NOT NULL,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hot read path: profile screen lists per-feature aggregates scoped to a user.
CREATE INDEX IF NOT EXISTS ai_usage_events_user_created_idx
  ON public.ai_usage_events (user_id, created_at DESC);

-- Hot read path: detail screen paginates a single feature for a user.
CREATE INDEX IF NOT EXISTS ai_usage_events_user_feature_created_idx
  ON public.ai_usage_events (user_id, feature_key, created_at DESC);

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

-- Use the canonical Clerk-compatible predicate. Do NOT use auth.uid() —
-- it casts sub to UUID and throws 22P02 on Clerk text subs
-- (see 20260810160812_fix_rls_clerk_predicates.sql).
CREATE POLICY "ai_usage_events_select_own" ON public.ai_usage_events
  FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "ai_usage_events_insert_own" ON public.ai_usage_events
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- Service role retains full access (for analytics export, manual fixes).
-- No public table, no UPDATE/DELETE policies — rows are append-only.
