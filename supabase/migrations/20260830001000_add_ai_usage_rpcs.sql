-- Aggregation RPCs powering the "AI Usage" section in the user profile
-- and the per-feature history detail screen.
-- Pattern mirrors get_dashboard_stats (20260808030000) and
-- check_username_available (20260810170000): SECURITY DEFINER, pinned
-- search_path, authenticated-only.

-- 1) Per-feature summary for the profile section.
--    Returns one row per distinct (feature_key, feature_label) the user
--    has used, ordered by most recently used first. Includes month-over-
--    month counts for the trend chip.
CREATE OR REPLACE FUNCTION public.get_ai_usage_summary()
RETURNS TABLE (
  feature_key      TEXT,
  feature_label    TEXT,
  total_count      BIGINT,
  this_month_count BIGINT,
  last_month_count BIGINT,
  last_used_at     TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.feature_key,
    e.feature_label,
    COUNT(*)::BIGINT                                                            AS total_count,
    COUNT(*) FILTER (
      WHERE e.created_at >= date_trunc('month', now())
    )::BIGINT                                                                   AS this_month_count,
    COUNT(*) FILTER (
      WHERE e.created_at >= date_trunc('month', now() - INTERVAL '1 month')
        AND e.created_at <  date_trunc('month', now())
    )::BIGINT                                                                   AS last_month_count,
    MAX(e.created_at)                                                           AS last_used_at
  FROM public.ai_usage_events e
  WHERE (auth.jwt() ->> 'sub') = e.user_id
  GROUP BY e.feature_key, e.feature_label
  ORDER BY MAX(e.created_at) DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ai_usage_summary() TO authenticated;

-- 2) Paginated history for a single feature (or all features when
--    p_feature_key is NULL). Most recent first.
CREATE OR REPLACE FUNCTION public.get_ai_usage_history(
  p_feature_key TEXT DEFAULT NULL,
  p_limit       INT  DEFAULT 50,
  p_offset      INT  DEFAULT 0
)
RETURNS TABLE (
  id            UUID,
  feature_key   TEXT,
  feature_label TEXT,
  created_at    TIMESTAMPTZ,
  metadata      JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.feature_key,
    e.feature_label,
    e.created_at,
    e.metadata
  FROM public.ai_usage_events e
  WHERE (auth.jwt() ->> 'sub') = e.user_id
    AND (p_feature_key IS NULL OR e.feature_key = p_feature_key)
  ORDER BY e.created_at DESC
  LIMIT  GREATEST(p_limit,  1)
  OFFSET GREATEST(p_offset, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ai_usage_history(TEXT, INT, INT) TO authenticated;
