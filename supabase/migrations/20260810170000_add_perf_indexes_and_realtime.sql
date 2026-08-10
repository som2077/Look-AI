-- Scalability hardening: hot-path indexes + realtime publication fixes.
--
-- 1. Missing indexes on hot query paths (verified via pg_stat_statements / pg_indexes):
--    - notifications   : the app queries own notifications ordered by created_at DESC
--    - post_comments   : feed detail loads comments for a post ordered by created_at
--    - post_saves      : "my saved posts" queries by user_id
--    - post_likes      : useCommunityPosts reads own likes by user_id
--    - analytics_logs  : error-log lookups by created_at (cleanup / dashboards)
-- 2. Duplicate indexes on community_posts (verified identical definitions) create
--    write amplification on every post insert. Keep one (created_at DESC + user_id),
--    drop the redundant copies.
-- 3. Realtime: the supabase_realtime publication contains only user_profiles, so the
--    client's postgres_changes subscriptions on notifications + wardrobe_items never
--    deliver events (dead polling load). Add those two personal tables. community_posts
--    is intentionally NOT added (public feed -> fan-out amplification; feed uses
--    pull-to-refresh + optimistic updates instead).
--
-- Idempotent: index CREATE/DROP use IF NOT EXISTS / IF EXISTS; publication adds are
-- guarded by existence checks.

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_created
  ON public.post_comments (post_id, created_at);

CREATE INDEX IF NOT EXISTS idx_post_saves_user
  ON public.post_saves (user_id);

CREATE INDEX IF NOT EXISTS idx_post_likes_user
  ON public.post_likes (user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_logs_created
  ON public.analytics_logs (created_at);

-- Drop duplicate community_posts indexes (identical definitions, keep one of each)
DROP INDEX IF EXISTS public.community_posts_created_at_idx;
DROP INDEX IF EXISTS public.idx_community_posts_created_at;
DROP INDEX IF EXISTS public.idx_community_posts_user_id;

-- Realtime publication: make personal channels functional
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'wardrobe_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wardrobe_items;
  END IF;
END $$;
