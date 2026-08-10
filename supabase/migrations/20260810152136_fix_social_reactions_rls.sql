-- Migration to fix 3 confirmed production issues (verified against live DB 2026-08-10)
--
-- NOTE: the policies recreated in section 2 below include an `OR ((auth.uid())::text = user_id)`
-- branch. That branch was later removed from ALL owner policies by 20260810160812
-- (fix_rls_clerk_predicates.sql) because auth.uid() throws ERROR 22P02 on Clerk's non-UUID
-- `sub` claim. Treat 20260810160812 as the authoritative final state for these predicates.
--
-- 1. handle_new_reaction(): join type mismatch (TEXT vs UUID) breaks every reaction insert
--    community_posts.user_id is TEXT (Clerk sub); the join key is user_profiles.user_id, NOT user_profiles.id
-- 2. notifications + post_likes lost their RLS policies in 20260808010000
--    (policies were dropped, never recreated) -> default deny-all -> likes & notifications broken
-- 3. analytics_logs table referenced by src/features/wardrobe/api/ErrorHandler.ts:82 but never created

-- ============================================================
-- 1) Fix notification trigger join bug (DATABASE.md §11 gap #6)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_reaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  post_owner_user_id TEXT;
BEGIN
  -- Get the post owner's clerk user_id (join on the TEXT business key, not the UUID surrogate)
  SELECT up.user_id INTO post_owner_user_id
  FROM community_posts cp
  JOIN user_profiles up ON up.user_id = cp.user_id
  WHERE cp.id = NEW.post_id;

  -- Only create notification if someone else reacted
  IF post_owner_user_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, post_id, reaction_type)
    VALUES (post_owner_user_id, NEW.user_id, 'reaction', NEW.post_id, NEW.reaction_type);
  END IF;

  RETURN NEW;
END;
$function$;

-- ============================================================
-- 2) Recreate RLS policies dropped by 20260808010000 (gap #8)
--    Owner predicate matches the existing social-table policies.
-- ============================================================

-- post_likes: app reads own likes + inserts/deletes on toggle (useCommunityPosts.ts)
CREATE POLICY "post_likes_select" ON public.post_likes
  FOR SELECT USING (((auth.jwt() ->> 'sub'::text) = user_id) OR ((auth.uid())::text = user_id));

CREATE POLICY "post_likes_insert" ON public.post_likes
  FOR INSERT WITH CHECK (((auth.jwt() ->> 'sub'::text) = user_id) OR ((auth.uid())::text = user_id));

CREATE POLICY "post_likes_delete" ON public.post_likes
  FOR DELETE USING (((auth.jwt() ->> 'sub'::text) = user_id) OR ((auth.uid())::text = user_id));

-- notifications: app reads own + marks read (useNotifications.ts); trigger (SECURITY DEFINER) writes
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (((auth.jwt() ->> 'sub'::text) = user_id) OR ((auth.uid())::text = user_id));

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (((auth.jwt() ->> 'sub'::text) = user_id) OR ((auth.uid())::text = user_id))
  WITH CHECK (((auth.jwt() ->> 'sub'::text) = user_id) OR ((auth.uid())::text = user_id));

-- ============================================================
-- 3) Create analytics_logs (gap #2) — referenced by ErrorHandler.ts:82
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analytics_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  context text,
  error_message text,
  attempt integer,
  retryable boolean,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.analytics_logs ENABLE ROW LEVEL SECURITY;

-- insert-only for any client (fire-and-forget error logging); no select/delete -> service-role only
CREATE POLICY "analytics_logs_insert" ON public.analytics_logs
  FOR INSERT WITH CHECK (true);
