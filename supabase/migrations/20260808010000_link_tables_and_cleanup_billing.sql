-- ============================================================================
-- Migration: 20260808010000_link_tables_and_cleanup_billing.sql
-- 1. Remove unused billing tables (replaced by RevenueCat SDK)
-- 2. Link all active tables (fit_check_analyses, streak_logs, wardrobe, etc.)
--    to user_profiles(user_id) via explicit FOREIGN KEY constraints
-- ============================================================================

-- 1. DROP UNUSED BILLING TABLES
DROP TABLE IF EXISTS public.billing_events CASCADE;
DROP TABLE IF EXISTS public.purchase_tokens CASCADE;
DROP TABLE IF EXISTS public.entitlements CASCADE;

-- 2. CONVERT SOCIAL TABLES user_id TO TEXT & CLEAN UP OLD POLICIES / CONSTRAINTS
DO $$ 
DECLARE
  pol RECORD;
  cons RECORD;
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['community_posts', 'post_comments', 'post_reactions', 'post_saves', 'post_likes', 'notifications']) LOOP
    -- Drop all foreign keys on this table
    FOR cons IN 
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = tbl AND constraint_type = 'FOREIGN KEY'
    LOOP
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I CASCADE', tbl, cons.constraint_name);
    END LOOP;

    -- Drop all policies on this table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = tbl AND schemaname = 'public' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
    END LOOP;

    -- Convert user_id column to TEXT if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = tbl AND column_name = 'user_id'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id TYPE TEXT USING user_id::text', tbl);
    END IF;
  END LOOP;

  -- Re-add post_id FK on post_comments, post_reactions, post_saves
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_comments') THEN
    ALTER TABLE public.post_comments ADD CONSTRAINT fk_post_comments_post FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_reactions') THEN
    ALTER TABLE public.post_reactions ADD CONSTRAINT fk_post_reactions_post FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_saves') THEN
    ALTER TABLE public.post_saves ADD CONSTRAINT fk_post_saves_post FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE;
  END IF;

  -- Recreate clean RLS policies
  CREATE POLICY "community_posts_select" ON public.community_posts FOR SELECT USING (true);
  CREATE POLICY "community_posts_insert" ON public.community_posts FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  CREATE POLICY "community_posts_update" ON public.community_posts FOR UPDATE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  CREATE POLICY "community_posts_delete" ON public.community_posts FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);

  CREATE POLICY "post_comments_select" ON public.post_comments FOR SELECT USING (true);
  CREATE POLICY "post_comments_insert" ON public.post_comments FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  CREATE POLICY "post_comments_update" ON public.post_comments FOR UPDATE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  CREATE POLICY "post_comments_delete" ON public.post_comments FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);

  CREATE POLICY "post_reactions_select" ON public.post_reactions FOR SELECT USING (true);
  CREATE POLICY "post_reactions_insert" ON public.post_reactions FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  CREATE POLICY "post_reactions_delete" ON public.post_reactions FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);

  CREATE POLICY "post_saves_select" ON public.post_saves FOR SELECT USING (true);
  CREATE POLICY "post_saves_insert" ON public.post_saves FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  CREATE POLICY "post_saves_delete" ON public.post_saves FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
END $$;

-- 3. ENSURE REFERENCED USER PROFILES EXIST FOR ANY ORPHANED ROWS
INSERT INTO public.user_profiles (user_id)
SELECT DISTINCT user_id::text FROM public.wardrobe_items
WHERE user_id IS NOT NULL AND user_id::text NOT IN (SELECT user_id::text FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_profiles (user_id)
SELECT DISTINCT user_id::text FROM public.fit_check_analyses
WHERE user_id IS NOT NULL AND user_id::text NOT IN (SELECT user_id::text FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_profiles (user_id)
SELECT DISTINCT user_id::text FROM public.saved_labels
WHERE user_id IS NOT NULL AND user_id::text NOT IN (SELECT user_id::text FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_profiles (user_id)
SELECT DISTINCT user_id::text FROM public.logged_outfits
WHERE user_id IS NOT NULL AND user_id::text NOT IN (SELECT user_id::text FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_profiles (user_id)
SELECT DISTINCT user_id::text FROM public.community_posts
WHERE user_id IS NOT NULL AND user_id::text NOT IN (SELECT user_id::text FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_profiles (user_id)
SELECT DISTINCT user_id::text FROM public.user_gamification
WHERE user_id IS NOT NULL AND user_id::text NOT IN (SELECT user_id::text FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_profiles (user_id)
SELECT DISTINCT user_id::text FROM public.streak_logs
WHERE user_id IS NOT NULL AND user_id::text NOT IN (SELECT user_id::text FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_profiles (user_id)
SELECT DISTINCT user_id::text FROM public.virtual_try_on_generations
WHERE user_id IS NOT NULL AND user_id::text NOT IN (SELECT user_id::text FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_profiles (user_id)
SELECT DISTINCT user_id::text FROM public.ai_recommendations
WHERE user_id IS NOT NULL AND user_id::text NOT IN (SELECT user_id::text FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_profiles (user_id)
SELECT DISTINCT user_id::text FROM public.planned_events
WHERE user_id IS NOT NULL AND user_id::text NOT IN (SELECT user_id::text FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- 4. ADD EXPLICIT FOREIGN KEY CONSTRAINTS TO ESTABLISH SCHEMA GRAPH CONNECTIONS
DO $$ BEGIN
  -- wardrobe_items -> user_profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_wardrobe_items_user' AND table_name = 'wardrobe_items'
  ) THEN
    ALTER TABLE public.wardrobe_items
    ADD CONSTRAINT fk_wardrobe_items_user
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;
  END IF;
  
  -- wear_logs -> user_profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_wear_logs_user' AND table_name = 'wear_logs'
  ) THEN
    ALTER TABLE public.wear_logs
    ADD CONSTRAINT fk_wear_logs_user
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;
  END IF;

  -- logged_outfits -> user_profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_logged_outfits_user' AND table_name = 'logged_outfits'
  ) THEN
    ALTER TABLE public.logged_outfits
    ADD CONSTRAINT fk_logged_outfits_user
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;
  END IF;

  -- fit_check_analyses -> user_profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_fit_check_user' AND table_name = 'fit_check_analyses'
  ) THEN
    ALTER TABLE public.fit_check_analyses
    ADD CONSTRAINT fk_fit_check_user
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;
  END IF;

  -- virtual_try_on_generations -> user_profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_try_on_user' AND table_name = 'virtual_try_on_generations'
  ) THEN
    ALTER TABLE public.virtual_try_on_generations
    ADD CONSTRAINT fk_try_on_user
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;
  END IF;

  -- saved_labels -> user_profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_saved_labels_user' AND table_name = 'saved_labels'
  ) THEN
    ALTER TABLE public.saved_labels
    ADD CONSTRAINT fk_saved_labels_user
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;
  END IF;

  -- ai_recommendations -> user_profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_ai_recommendations_user' AND table_name = 'ai_recommendations'
  ) THEN
    ALTER TABLE public.ai_recommendations
    ADD CONSTRAINT fk_ai_recommendations_user
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;
  END IF;

  -- user_gamification -> user_profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_user_gamification_user' AND table_name = 'user_gamification'
  ) THEN
    ALTER TABLE public.user_gamification
    ADD CONSTRAINT fk_user_gamification_user
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;
  END IF;

  -- streak_logs -> user_profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_streak_logs_user' AND table_name = 'streak_logs'
  ) THEN
    ALTER TABLE public.streak_logs
    ADD CONSTRAINT fk_streak_logs_user
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;
  END IF;

  -- planned_events -> user_profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_planned_events_user' AND table_name = 'planned_events'
  ) THEN
    ALTER TABLE public.planned_events
    ADD CONSTRAINT fk_planned_events_user
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;
  END IF;

  -- community_posts -> user_profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_community_posts_user' AND table_name = 'community_posts'
  ) THEN
    ALTER TABLE public.community_posts
    ADD CONSTRAINT fk_community_posts_user
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;
  END IF;

  -- post_reactions -> user_profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_post_reactions_user' AND table_name = 'post_reactions'
  ) THEN
    ALTER TABLE public.post_reactions
    ADD CONSTRAINT fk_post_reactions_user
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;
  END IF;

  -- post_saves -> user_profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_post_saves_user' AND table_name = 'post_saves'
  ) THEN
    ALTER TABLE public.post_saves
    ADD CONSTRAINT fk_post_saves_user
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;
  END IF;

  -- post_comments -> user_profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_post_comments_user' AND table_name = 'post_comments'
  ) THEN
    ALTER TABLE public.post_comments
    ADD CONSTRAINT fk_post_comments_user
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;
