CREATE OR REPLACE FUNCTION get_dashboard_stats(time_filter text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
  -- Get the current user ID
  v_user_id := auth.uid()::text;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Determine user's wardrobe item limit (100 for free, 500 for paid)
  -- Checking the entitlements table if it exists, otherwise default to checking if they have an active subscription
  -- Assuming there is a way to check premium status, for now we will check the user's gamification or profiles
  -- In this schema, we check if they have a premium flag or use a mock check for now.
  -- You can update this logic based on your actual subscription table.
  v_is_premium := false; 
  IF v_is_premium THEN 
    v_limit := 500; 
  ELSE 
    v_limit := 100; 
  END IF;
  
  -- Determine the start date based on the filter
  IF time_filter = 'days' THEN
    v_start_date := CURRENT_DATE - INTERVAL '7 days';
  ELSIF time_filter = 'weeks' THEN
    v_start_date := CURRENT_DATE - INTERVAL '28 days';
  ELSIF time_filter = 'months' THEN
    v_start_date := CURRENT_DATE - INTERVAL '6 months';
  ELSE
    v_start_date := '1970-01-01'::date; -- 'all' time
  END IF;

  -- 1. Get Total Items in Wardrobe
  SELECT COUNT(*) INTO v_total_items 
  FROM public.wardrobe_items 
  WHERE user_id = v_user_id;

  -- 2. Get Distinct Items Worn & Total Wears in the period
  SELECT 
    COUNT(DISTINCT item_id), 
    COUNT(*) 
  INTO 
    v_distinct_worn, 
    v_total_wears
  FROM public.wear_logs 
  WHERE user_id = v_user_id 
    AND worn_at >= v_start_date;

  -- 3. Get Current Streak
  SELECT current_streak INTO v_streak
  FROM public.user_gamification
  WHERE user_id = v_user_id;
  
  -- Handle null streak if user has no gamification record yet
  v_streak := COALESCE(v_streak, 0);

  -- 4. Calculate Usage % and Avg Wears safely (avoid division by zero)
  IF v_total_items > 0 THEN
    v_usage_percentage := (v_distinct_worn::numeric / v_total_items::numeric) * 100;
    v_avg_wears := (v_total_wears::numeric / v_total_items::numeric);
  ELSE
    v_usage_percentage := 0;
    v_avg_wears := 0;
  END IF;

  -- Return as a JSON object
  RETURN json_build_object(
    'usagePercentage', ROUND(v_usage_percentage, 0),
    'avgWears', ROUND(v_avg_wears, 1),
    'streak', v_streak,
    'totalItems', v_total_items,
    'itemLimit', v_limit
  );
END;
$$;
