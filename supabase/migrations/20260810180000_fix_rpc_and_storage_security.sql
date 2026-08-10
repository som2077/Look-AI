-- Security hardening: SECURITY DEFINER RPCs + storage buckets.
--
-- 1. check_username_available  — was anon-executable SECURITY DEFINER (username-
--    enumeration oracle) with an unpinned search_path (object-hijack risk when
--    called as the definer). Recreate with pinned empty search_path + fully
--    qualified refs, revoke PUBLIC/anon, grant to authenticated only.
-- 2. get_dashboard_stats       — still used auth.uid() which throws 22P02 on
--    Clerk's non-UUID text sub claims. Switch to (auth.jwt() ->> 'sub') and pin
--    search_path. (Unused by the app today, kept for a future dashboard; now safe.)
-- 3. Storage buckets           — try-on-uploads + full-length-pics had no size /
--    mime limits; try-on-uploads INSERT policy was PUBLIC (anon upload). Set a
--    10MB limit + image/* mime types and require an authenticated JWT to upload.

-- ---------- RPC: check_username_available ----------
CREATE OR REPLACE FUNCTION public.check_username_available(check_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE username = check_username
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.check_username_available(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_username_available(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO authenticated;

-- ---------- RPC: get_dashboard_stats ----------
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(time_filter text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id text;
  v_start_date date;
  v_total_items int;
  v_distinct_worn int;
  v_total_wears int;
  v_streak int;
  v_usage_percentage numeric;
  v_avg_wears numeric;
  v_limit int;
  v_is_premium boolean;
BEGIN
  -- Clerk JWT sub is a TEXT user id (e.g. user_3HSQG...), NOT a uuid.
  -- auth.uid() would throw 22P02 here — use the JWT sub directly.
  v_user_id := auth.jwt() ->> 'sub';
  IF v_user_id IS NULL OR v_user_id = '' THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_is_premium := false;
  IF v_is_premium THEN
    v_limit := 500;
  ELSE
    v_limit := 100;
  END IF;

  IF time_filter = 'days' THEN
    v_start_date := CURRENT_DATE - INTERVAL '7 days';
  ELSIF time_filter = 'weeks' THEN
    v_start_date := CURRENT_DATE - INTERVAL '28 days';
  ELSIF time_filter = 'months' THEN
    v_start_date := CURRENT_DATE - INTERVAL '6 months';
  ELSE
    v_start_date := '1970-01-01'::date; -- 'all' time
  END IF;

  SELECT COUNT(*) INTO v_total_items
  FROM public.wardrobe_items
  WHERE user_id = v_user_id;

  SELECT COUNT(DISTINCT item_id), COUNT(*)
  INTO v_distinct_worn, v_total_wears
  FROM public.wear_logs
  WHERE user_id = v_user_id
    AND worn_at >= v_start_date;

  SELECT current_streak INTO v_streak
  FROM public.user_gamification
  WHERE user_id = v_user_id;

  v_streak := COALESCE(v_streak, 0);

  IF v_total_items > 0 THEN
    v_usage_percentage := (v_distinct_worn::numeric / v_total_items::numeric) * 100;
    v_avg_wears := (v_total_wears::numeric / v_total_items::numeric);
  ELSE
    v_usage_percentage := 0;
    v_avg_wears := 0;
  END IF;

  RETURN json_build_object(
    'usagePercentage', ROUND(v_usage_percentage, 0),
    'avgWears', ROUND(v_avg_wears, 1),
    'streak', v_streak,
    'totalItems', v_total_items,
    'itemLimit', v_limit
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_dashboard_stats(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_dashboard_stats(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(text) TO authenticated;

-- ---------- Storage: bucket limits ----------
UPDATE storage.buckets
SET file_size_limit = 10485760,          -- 10 MB
    allowed_mime_types = ARRAY['image/*']
WHERE id IN ('try-on-uploads', 'full-length-pics');

-- ---------- Storage: require auth to upload to try-on-uploads ----------
DROP POLICY IF EXISTS "Public Insert Try On" ON storage.objects;

CREATE POLICY "Authenticated Insert Try On"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'try-on-uploads'::text
    AND auth.jwt() IS NOT NULL
  );
