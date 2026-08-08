-- ============================================================================
-- Complete Look-AI Database Schema & Architecture
-- Canonical Schema Definition
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. UTILITY TRIGGER FUNCTION FOR UPDATING TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. USER PROFILES
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  nickname VARCHAR(50),
  username VARCHAR(50) UNIQUE,
  age INTEGER CHECK (age >= 10 AND age <= 120),
  height INTEGER CHECK (height >= 50 AND height <= 260),
  gender VARCHAR(20),
  body_type VARCHAR(50),
  style_preferences TEXT[] DEFAULT '{}',
  referral_sources TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  bio TEXT,
  about TEXT,
  full_length_photos TEXT[] DEFAULT '{}',
  notifications_enabled BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_select') THEN
    CREATE POLICY "user_profiles_select" ON public.user_profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_insert') THEN
    CREATE POLICY "user_profiles_insert" ON public.user_profiles FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_update') THEN
    CREATE POLICY "user_profiles_update" ON public.user_profiles FOR UPDATE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_delete') THEN
    CREATE POLICY "user_profiles_delete" ON public.user_profiles FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

DROP TRIGGER IF EXISTS user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. WARDROBE ITEMS (DIGITAL CLOSET)
CREATE TABLE IF NOT EXISTS public.wardrobe_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  custom_name TEXT,
  brand TEXT,
  category TEXT NOT NULL,
  sub_category TEXT,
  primary_color TEXT,
  color_hex VARCHAR(10),
  secondary_colors TEXT[] DEFAULT '{}',
  pattern TEXT,
  fabric_guess TEXT,
  fit TEXT,
  sleeve_type TEXT,
  neck_type TEXT,
  style TEXT[] DEFAULT '{}',
  season TEXT[] DEFAULT '{}',
  occasion TEXT[] DEFAULT '{}',
  formality_score INTEGER,
  versatility_tags TEXT[] DEFAULT '{}',
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  care_instructions TEXT,
  notes TEXT,
  image_url TEXT NOT NULL,
  original_image_url TEXT,
  annotations JSONB DEFAULT '{}',
  confidence NUMERIC(3,2),
  source TEXT DEFAULT 'manual',
  is_favorite BOOLEAN DEFAULT false,
  wear_count INTEGER DEFAULT 0,
  last_worn_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wardrobe_items' AND policyname = 'wardrobe_items_select') THEN
    CREATE POLICY "wardrobe_items_select" ON public.wardrobe_items FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wardrobe_items' AND policyname = 'wardrobe_items_insert') THEN
    CREATE POLICY "wardrobe_items_insert" ON public.wardrobe_items FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wardrobe_items' AND policyname = 'wardrobe_items_update') THEN
    CREATE POLICY "wardrobe_items_update" ON public.wardrobe_items FOR UPDATE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wardrobe_items' AND policyname = 'wardrobe_items_delete') THEN
    CREATE POLICY "wardrobe_items_delete" ON public.wardrobe_items FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

DROP TRIGGER IF EXISTS wardrobe_items_updated_at ON public.wardrobe_items;
CREATE TRIGGER wardrobe_items_updated_at
  BEFORE UPDATE ON public.wardrobe_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. WEAR LOGS (HISTORY & STATS)
CREATE TABLE IF NOT EXISTS public.wear_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  worn_at DATE DEFAULT CURRENT_DATE,
  occasion TEXT,
  rating INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wear_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wear_logs' AND policyname = 'wear_logs_select') THEN
    CREATE POLICY "wear_logs_select" ON public.wear_logs FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wear_logs' AND policyname = 'wear_logs_insert') THEN
    CREATE POLICY "wear_logs_insert" ON public.wear_logs FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wear_logs' AND policyname = 'wear_logs_delete') THEN
    CREATE POLICY "wear_logs_delete" ON public.wear_logs FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

-- 4. LOGGED OUTFITS & OUTFIT ITEMS
CREATE TABLE IF NOT EXISTS public.logged_outfits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  title TEXT,
  occasion TEXT,
  score NUMERIC(3,1),
  weather_temp NUMERIC(4,1),
  weather_condition TEXT,
  image_url TEXT,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.logged_outfits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logged_outfits' AND policyname = 'logged_outfits_select') THEN
    CREATE POLICY "logged_outfits_select" ON public.logged_outfits FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logged_outfits' AND policyname = 'logged_outfits_insert') THEN
    CREATE POLICY "logged_outfits_insert" ON public.logged_outfits FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logged_outfits' AND policyname = 'logged_outfits_update') THEN
    CREATE POLICY "logged_outfits_update" ON public.logged_outfits FOR UPDATE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logged_outfits' AND policyname = 'logged_outfits_delete') THEN
    CREATE POLICY "logged_outfits_delete" ON public.logged_outfits FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.outfit_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  outfit_id UUID NOT NULL REFERENCES public.logged_outfits(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  position_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.outfit_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfit_items' AND policyname = 'outfit_items_select') THEN
    CREATE POLICY "outfit_items_select" ON public.outfit_items FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfit_items' AND policyname = 'outfit_items_insert') THEN
    CREATE POLICY "outfit_items_insert" ON public.outfit_items FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfit_items' AND policyname = 'outfit_items_delete') THEN
    CREATE POLICY "outfit_items_delete" ON public.outfit_items FOR DELETE USING (true);
  END IF;
END $$;

-- 5. FIT CHECK ANALYSES
CREATE TABLE IF NOT EXISTS public.fit_check_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  overall_score NUMERIC(3,1) NOT NULL,
  color_harmony_score INTEGER,
  proportion_score INTEGER,
  formality_tag VARCHAR(50),
  style_tags TEXT[] DEFAULT '{}',
  feedback_notes TEXT,
  strengths TEXT[] DEFAULT '{}',
  improvements TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.fit_check_analyses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fit_check_analyses' AND policyname = 'fit_check_select') THEN
    CREATE POLICY "fit_check_select" ON public.fit_check_analyses FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fit_check_analyses' AND policyname = 'fit_check_insert') THEN
    CREATE POLICY "fit_check_insert" ON public.fit_check_analyses FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fit_check_analyses' AND policyname = 'fit_check_delete') THEN
    CREATE POLICY "fit_check_delete" ON public.fit_check_analyses FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

-- 6. VIRTUAL TRY-ON GENERATIONS
CREATE TABLE IF NOT EXISTS public.virtual_try_on_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  garment_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
  garment_image_url TEXT NOT NULL,
  model_image_url TEXT NOT NULL,
  result_image_url TEXT,
  pose_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.virtual_try_on_generations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'virtual_try_on_generations' AND policyname = 'try_on_select') THEN
    CREATE POLICY "try_on_select" ON public.virtual_try_on_generations FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'virtual_try_on_generations' AND policyname = 'try_on_insert') THEN
    CREATE POLICY "try_on_insert" ON public.virtual_try_on_generations FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'virtual_try_on_generations' AND policyname = 'try_on_delete') THEN
    CREATE POLICY "try_on_delete" ON public.virtual_try_on_generations FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

-- 7. CARE LABELS (SAVED LABELS)
CREATE TABLE IF NOT EXISTS public.saved_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  brand_name VARCHAR(100),
  size_text VARCHAR(20),
  fabric_composition JSONB DEFAULT '[]',
  care_symbols JSONB DEFAULT '[]',
  washing_instruction TEXT,
  bleaching_instruction TEXT,
  drying_instruction TEXT,
  ironing_instruction TEXT,
  professional_care_instruction TEXT,
  raw_ocr_text TEXT,
  translated_text TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.saved_labels ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_labels' AND policyname = 'saved_labels_select') THEN
    CREATE POLICY "saved_labels_select" ON public.saved_labels FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_labels' AND policyname = 'saved_labels_insert') THEN
    CREATE POLICY "saved_labels_insert" ON public.saved_labels FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_labels' AND policyname = 'saved_labels_delete') THEN
    CREATE POLICY "saved_labels_delete" ON public.saved_labels FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

-- 8. AI RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  occasion TEXT,
  weather_context TEXT,
  reasoning TEXT,
  style_score NUMERIC(3,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_recommendations' AND policyname = 'ai_recommendations_select') THEN
    CREATE POLICY "ai_recommendations_select" ON public.ai_recommendations FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_recommendations' AND policyname = 'ai_recommendations_insert') THEN
    CREATE POLICY "ai_recommendations_insert" ON public.ai_recommendations FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.ai_recommendation_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_id UUID NOT NULL REFERENCES public.ai_recommendations(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  slot_category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_recommendation_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_recommendation_items' AND policyname = 'ai_recommendation_items_select') THEN
    CREATE POLICY "ai_recommendation_items_select" ON public.ai_recommendation_items FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_recommendation_items' AND policyname = 'ai_recommendation_items_insert') THEN
    CREATE POLICY "ai_recommendation_items_insert" ON public.ai_recommendation_items FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- 9. USER GAMIFICATION & STREAKS
CREATE TABLE IF NOT EXISTS public.user_gamification (
  user_id TEXT PRIMARY KEY REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_freezes_available INTEGER DEFAULT 2,
  style_score INTEGER DEFAULT 100,
  total_outfits_logged INTEGER DEFAULT 0,
  total_items_scanned INTEGER DEFAULT 0,
  total_care_labels_scanned INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_gamification' AND policyname = 'gamification_select') THEN
    CREATE POLICY "gamification_select" ON public.user_gamification FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_gamification' AND policyname = 'gamification_insert') THEN
    CREATE POLICY "gamification_insert" ON public.user_gamification FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_gamification' AND policyname = 'gamification_update') THEN
    CREATE POLICY "gamification_update" ON public.user_gamification FOR UPDATE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.streak_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  activity_date DATE DEFAULT CURRENT_DATE,
  activity_type VARCHAR(50) DEFAULT 'outfit_log',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.streak_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'streak_logs' AND policyname = 'streak_logs_select') THEN
    CREATE POLICY "streak_logs_select" ON public.streak_logs FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'streak_logs' AND policyname = 'streak_logs_insert') THEN
    CREATE POLICY "streak_logs_insert" ON public.streak_logs FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

-- 10. PLANNED EVENTS (CALENDAR)
CREATE TABLE IF NOT EXISTS public.planned_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_time TIME,
  occasion_label VARCHAR(100) NOT NULL,
  location VARCHAR(150),
  weather_temp_c NUMERIC(4,1),
  weather_condition VARCHAR(50),
  suggested_outfit_id UUID REFERENCES public.logged_outfits(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.planned_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'planned_events' AND policyname = 'planned_events_select') THEN
    CREATE POLICY "planned_events_select" ON public.planned_events FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'planned_events' AND policyname = 'planned_events_insert') THEN
    CREATE POLICY "planned_events_insert" ON public.planned_events FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'planned_events' AND policyname = 'planned_events_update') THEN
    CREATE POLICY "planned_events_update" ON public.planned_events FOR UPDATE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'planned_events' AND policyname = 'planned_events_delete') THEN
    CREATE POLICY "planned_events_delete" ON public.planned_events FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

-- 11. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  actor_id TEXT REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  reaction_type TEXT,
  title TEXT,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_select') THEN
    CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_insert') THEN
    CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_update') THEN
    CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_delete') THEN
    CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

-- 12. COMMUNITY & EXPLORE
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  style_tags TEXT[] DEFAULT '{}',
  item_tags JSONB DEFAULT '[]',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_posts' AND policyname = 'community_posts_select') THEN
    CREATE POLICY "community_posts_select" ON public.community_posts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_posts' AND policyname = 'community_posts_insert') THEN
    CREATE POLICY "community_posts_insert" ON public.community_posts FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_posts' AND policyname = 'community_posts_update') THEN
    CREATE POLICY "community_posts_update" ON public.community_posts FOR UPDATE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_posts' AND policyname = 'community_posts_delete') THEN
    CREATE POLICY "community_posts_delete" ON public.community_posts FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_likes' AND policyname = 'post_likes_select') THEN
    CREATE POLICY "post_likes_select" ON public.post_likes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_likes' AND policyname = 'post_likes_insert') THEN
    CREATE POLICY "post_likes_insert" ON public.post_likes FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_likes' AND policyname = 'post_likes_delete') THEN
    CREATE POLICY "post_likes_delete" ON public.post_likes FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.post_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_reactions' AND policyname = 'post_reactions_select') THEN
    CREATE POLICY "post_reactions_select" ON public.post_reactions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_reactions' AND policyname = 'post_reactions_insert') THEN
    CREATE POLICY "post_reactions_insert" ON public.post_reactions FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_reactions' AND policyname = 'post_reactions_delete') THEN
    CREATE POLICY "post_reactions_delete" ON public.post_reactions FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.post_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_saves' AND policyname = 'post_saves_select') THEN
    CREATE POLICY "post_saves_select" ON public.post_saves FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_saves' AND policyname = 'post_saves_insert') THEN
    CREATE POLICY "post_saves_insert" ON public.post_saves FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_saves' AND policyname = 'post_saves_delete') THEN
    CREATE POLICY "post_saves_delete" ON public.post_saves FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_comments' AND policyname = 'post_comments_select') THEN
    CREATE POLICY "post_comments_select" ON public.post_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_comments_insert') THEN
    CREATE POLICY "post_comments_insert" ON public.post_comments FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_comments' AND policyname = 'post_comments_delete') THEN
    CREATE POLICY "post_comments_delete" ON public.post_comments FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

-- 13. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_cat ON public.wardrobe_items(user_id, category);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_wear ON public.wardrobe_items(user_id, wear_count DESC);
CREATE INDEX IF NOT EXISTS idx_wear_logs_user_worn ON public.wear_logs(user_id, worn_at DESC);
CREATE INDEX IF NOT EXISTS idx_logged_outfits_user_date ON public.logged_outfits(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_user ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_fit_check_user ON public.fit_check_analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_try_on_user ON public.virtual_try_on_generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_planned_events_user_date ON public.planned_events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_streak_logs_user_date ON public.streak_logs(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_saved_labels_user ON public.saved_labels(user_id, created_at DESC);
