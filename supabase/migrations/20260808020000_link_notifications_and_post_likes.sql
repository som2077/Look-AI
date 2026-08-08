-- ============================================================================
-- Migration: 20260808020000_link_notifications_and_post_likes.sql
-- Link notifications and post_likes to user_profiles and community_posts
-- ============================================================================

-- 1. CLEAN UP ORPHANED ROWS OR MISSING PROFILES
INSERT INTO public.user_profiles (user_id)
SELECT DISTINCT user_id::text FROM public.notifications
WHERE user_id IS NOT NULL AND user_id::text NOT IN (SELECT user_id::text FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_profiles (user_id)
SELECT DISTINCT actor_id::text FROM public.notifications
WHERE actor_id IS NOT NULL AND actor_id::text NOT IN (SELECT user_id::text FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_profiles (user_id)
SELECT DISTINCT user_id::text FROM public.post_likes
WHERE user_id IS NOT NULL AND user_id::text NOT IN (SELECT user_id::text FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Clean up any invalid post_ids pointing to non-existent posts
DELETE FROM public.notifications 
WHERE post_id IS NOT NULL AND post_id NOT IN (SELECT id FROM public.community_posts);

DELETE FROM public.post_likes 
WHERE post_id IS NOT NULL AND post_id NOT IN (SELECT id FROM public.community_posts);

-- 2. ADD FOREIGN KEYS FOR NOTIFICATIONS
DO $$ BEGIN
  -- notifications.user_id -> user_profiles(user_id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_notifications_user' AND table_name = 'notifications'
  ) THEN
    ALTER TABLE public.notifications
    ADD CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;
  END IF;

  -- notifications.actor_id -> user_profiles(user_id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_notifications_actor' AND table_name = 'notifications'
  ) THEN
    ALTER TABLE public.notifications
    ADD CONSTRAINT fk_notifications_actor
    FOREIGN KEY (actor_id) REFERENCES public.user_profiles(user_id) ON DELETE SET NULL;
  END IF;

  -- notifications.post_id -> community_posts(id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_notifications_post' AND table_name = 'notifications'
  ) THEN
    ALTER TABLE public.notifications
    ADD CONSTRAINT fk_notifications_post
    FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE;
  END IF;

  -- post_likes.user_id -> user_profiles(user_id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_post_likes_user' AND table_name = 'post_likes'
  ) THEN
    ALTER TABLE public.post_likes
    ADD CONSTRAINT fk_post_likes_user
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;
  END IF;

  -- post_likes.post_id -> community_posts(id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_post_likes_post' AND table_name = 'post_likes'
  ) THEN
    ALTER TABLE public.post_likes
    ADD CONSTRAINT fk_post_likes_post
    FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE;
  END IF;
END $$;
