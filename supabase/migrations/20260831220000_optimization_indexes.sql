-- Look AI optimization: additional composite indexes for hot query paths.
-- Idempotent: all use IF NOT EXISTS.

-- 1. fit_check_analyses: profile screen loads recent fit checks
--    Query: .eq("user_id", uid).order("created_at", { ascending: false }).limit(20)
CREATE INDEX IF NOT EXISTS idx_fit_checks_user_created
  ON public.fit_check_analyses (user_id, created_at DESC);

-- 2. streak_logs: daily upsert + weekly activity query
--    Query: .eq("user_id", uid).gte("activity_date", weekStart)
CREATE INDEX IF NOT EXISTS idx_streak_logs_user_date
  ON public.streak_logs (user_id, activity_date DESC);

-- 3. ai_usage_events: RPC get_ai_usage_summary filters by user + time range
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_user_created
  ON public.ai_usage_events (user_id, created_at DESC);

-- 4. wear_logs: useLogWears bulk insert + potential future wear history queries
CREATE INDEX IF NOT EXISTS idx_wear_logs_user_item
  ON public.wear_logs (user_id, item_id, worn_at DESC);

-- 5. logged_outfits: style-chat context query fetches recent outfits
CREATE INDEX IF NOT EXISTS idx_logged_outfits_user_created
  ON public.logged_outfits (user_id, created_at DESC);
