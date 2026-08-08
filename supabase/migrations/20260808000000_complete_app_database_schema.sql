-- ============================================================================
-- Migration: Complete Look-AI Database Schema & Architecture
-- Idempotent, Production-Ready Migration with Comprehensive Column Safeguards
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

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS nickname VARCHAR(50);
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS username VARCHAR(50);
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS body_type VARCHAR(50);
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS style_preferences TEXT[] DEFAULT '{}';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS referral_sources TEXT[] DEFAULT '{}';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS about TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS full_length_photos TEXT[] DEFAULT '{}';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

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
  user_id TEXT NOT NULL,
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

ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS custom_name TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS sub_category TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS color_hex VARCHAR(10);
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS secondary_colors TEXT[] DEFAULT '{}';
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS pattern TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS fabric_guess TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS fit TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS sleeve_type TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS neck_type TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS style TEXT[] DEFAULT '{}';
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS season TEXT[] DEFAULT '{}';
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS occasion TEXT[] DEFAULT '{}';
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS formality_score INTEGER;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS versatility_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 5;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS care_instructions TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS original_image_url TEXT;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS annotations JSONB DEFAULT '{}';
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS confidence NUMERIC(3,2);
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS wear_count INTEGER DEFAULT 0;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS last_worn_date DATE;
ALTER TABLE public.wardrobe_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

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

-- 3. WEAR LOGS
CREATE TABLE IF NOT EXISTS public.wear_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id UUID NOT NULL REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  worn_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wear_logs ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.wear_logs ADD COLUMN IF NOT EXISTS item_id UUID;
ALTER TABLE public.wear_logs ADD COLUMN IF NOT EXISTS worn_at TIMESTAMPTZ DEFAULT NOW();

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

-- 4. LOGGED OUTFITS
CREATE TABLE IF NOT EXISTS public.logged_outfits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  worn_time TIME NOT NULL,
  item_count INTEGER DEFAULT 1,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  description TEXT,
  occasion TEXT,
  weather_condition TEXT,
  weather_temp TEXT,
  image_url TEXT,
  is_planned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.logged_outfits ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.logged_outfits ADD COLUMN IF NOT EXISTS score INTEGER;
ALTER TABLE public.logged_outfits ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.logged_outfits ADD COLUMN IF NOT EXISTS occasion TEXT;
ALTER TABLE public.logged_outfits ADD COLUMN IF NOT EXISTS weather_condition TEXT;
ALTER TABLE public.logged_outfits ADD COLUMN IF NOT EXISTS weather_temp TEXT;
ALTER TABLE public.logged_outfits ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.logged_outfits ADD COLUMN IF NOT EXISTS is_planned BOOLEAN DEFAULT false;

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

-- 5. OUTFIT ITEMS
CREATE TABLE IF NOT EXISTS public.outfit_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  outfit_id UUID NOT NULL REFERENCES public.logged_outfits(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(outfit_id, item_id)
);

ALTER TABLE public.outfit_items ADD COLUMN IF NOT EXISTS outfit_id UUID;
ALTER TABLE public.outfit_items ADD COLUMN IF NOT EXISTS item_id UUID;

ALTER TABLE public.outfit_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfit_items' AND policyname = 'outfit_items_select') THEN
    CREATE POLICY "outfit_items_select" ON public.outfit_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.logged_outfits WHERE id = outfit_items.outfit_id AND ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text)));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfit_items' AND policyname = 'outfit_items_insert') THEN
    CREATE POLICY "outfit_items_insert" ON public.outfit_items FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.logged_outfits WHERE id = outfit_items.outfit_id AND ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text)));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfit_items' AND policyname = 'outfit_items_delete') THEN
    CREATE POLICY "outfit_items_delete" ON public.outfit_items FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.logged_outfits WHERE id = outfit_items.outfit_id AND ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text)));
  END IF;
END $$;

-- 6. FIT CHECK ANALYSES
CREATE TABLE IF NOT EXISTS public.fit_check_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
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

ALTER TABLE public.fit_check_analyses ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.fit_check_analyses ADD COLUMN IF NOT EXISTS color_harmony_score INTEGER;
ALTER TABLE public.fit_check_analyses ADD COLUMN IF NOT EXISTS proportion_score INTEGER;
ALTER TABLE public.fit_check_analyses ADD COLUMN IF NOT EXISTS formality_tag VARCHAR(50);
ALTER TABLE public.fit_check_analyses ADD COLUMN IF NOT EXISTS style_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.fit_check_analyses ADD COLUMN IF NOT EXISTS feedback_notes TEXT;
ALTER TABLE public.fit_check_analyses ADD COLUMN IF NOT EXISTS strengths TEXT[] DEFAULT '{}';
ALTER TABLE public.fit_check_analyses ADD COLUMN IF NOT EXISTS improvements TEXT[] DEFAULT '{}';

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

-- 7. VIRTUAL TRY-ON GENERATIONS
CREATE TABLE IF NOT EXISTS public.virtual_try_on_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  garment_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
  garment_image_url TEXT NOT NULL,
  model_image_url TEXT NOT NULL,
  result_image_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  pose_type VARCHAR(50) DEFAULT 'standing_front',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.virtual_try_on_generations ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.virtual_try_on_generations ADD COLUMN IF NOT EXISTS garment_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL;
ALTER TABLE public.virtual_try_on_generations ADD COLUMN IF NOT EXISTS pose_type VARCHAR(50) DEFAULT 'standing_front';
ALTER TABLE public.virtual_try_on_generations ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.virtual_try_on_generations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.virtual_try_on_generations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'virtual_try_on_generations' AND policyname = 'try_on_select') THEN
    CREATE POLICY "try_on_select" ON public.virtual_try_on_generations FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'virtual_try_on_generations' AND policyname = 'try_on_insert') THEN
    CREATE POLICY "try_on_insert" ON public.virtual_try_on_generations FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'virtual_try_on_generations' AND policyname = 'try_on_update') THEN
    CREATE POLICY "try_on_update" ON public.virtual_try_on_generations FOR UPDATE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'virtual_try_on_generations' AND policyname = 'try_on_delete') THEN
    CREATE POLICY "try_on_delete" ON public.virtual_try_on_generations FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

DROP TRIGGER IF EXISTS try_on_updated_at ON public.virtual_try_on_generations;
CREATE TRIGGER try_on_updated_at
  BEFORE UPDATE ON public.virtual_try_on_generations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. SAVED CLOTHING LABELS
CREATE TABLE IF NOT EXISTS public.saved_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  brand TEXT,
  size VARCHAR(30),
  fabric_composition JSONB DEFAULT '[]',
  care_symbols JSONB DEFAULT '[]',
  wash_instruction TEXT,
  dry_instruction TEXT,
  iron_instruction TEXT,
  bleach_instruction TEXT,
  dry_clean_instruction TEXT,
  original_text TEXT,
  translated_text TEXT,
  label_standard_guess TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.saved_labels ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.saved_labels ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.saved_labels ADD COLUMN IF NOT EXISTS size VARCHAR(30);
ALTER TABLE public.saved_labels ADD COLUMN IF NOT EXISTS fabric_composition JSONB DEFAULT '[]';
ALTER TABLE public.saved_labels ADD COLUMN IF NOT EXISTS care_symbols JSONB DEFAULT '[]';
ALTER TABLE public.saved_labels ADD COLUMN IF NOT EXISTS wash_instruction TEXT;
ALTER TABLE public.saved_labels ADD COLUMN IF NOT EXISTS dry_instruction TEXT;
ALTER TABLE public.saved_labels ADD COLUMN IF NOT EXISTS iron_instruction TEXT;
ALTER TABLE public.saved_labels ADD COLUMN IF NOT EXISTS bleach_instruction TEXT;
ALTER TABLE public.saved_labels ADD COLUMN IF NOT EXISTS dry_clean_instruction TEXT;
ALTER TABLE public.saved_labels ADD COLUMN IF NOT EXISTS original_text TEXT;
ALTER TABLE public.saved_labels ADD COLUMN IF NOT EXISTS translated_text TEXT;
ALTER TABLE public.saved_labels ADD COLUMN IF NOT EXISTS label_standard_guess TEXT;
ALTER TABLE public.saved_labels ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.saved_labels ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_labels' AND policyname = 'saved_labels_select') THEN
    CREATE POLICY "saved_labels_select" ON public.saved_labels FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_labels' AND policyname = 'saved_labels_insert') THEN
    CREATE POLICY "saved_labels_insert" ON public.saved_labels FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_labels' AND policyname = 'saved_labels_update') THEN
    CREATE POLICY "saved_labels_update" ON public.saved_labels FOR UPDATE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_labels' AND policyname = 'saved_labels_delete') THEN
    CREATE POLICY "saved_labels_delete" ON public.saved_labels FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

DROP TRIGGER IF EXISTS saved_labels_updated_at ON public.saved_labels;
CREATE TRIGGER saved_labels_updated_at
  BEFORE UPDATE ON public.saved_labels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. AI RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  suggested_date DATE NOT NULL DEFAULT CURRENT_DATE,
  occasion VARCHAR(50),
  weather_context JSONB DEFAULT '{}',
  outfit_score INTEGER CHECK (outfit_score >= 0 AND outfit_score <= 100),
  style_advice TEXT,
  feedback VARCHAR(20) CHECK (feedback IN ('liked', 'disliked', 'neutral', 'worn')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_recommendations ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.ai_recommendations ADD COLUMN IF NOT EXISTS occasion VARCHAR(50);
ALTER TABLE public.ai_recommendations ADD COLUMN IF NOT EXISTS outfit_score INTEGER;
ALTER TABLE public.ai_recommendations ADD COLUMN IF NOT EXISTS style_advice TEXT;

ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_recommendations' AND policyname = 'ai_recommendations_select') THEN
    CREATE POLICY "ai_recommendations_select" ON public.ai_recommendations FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_recommendations' AND policyname = 'ai_recommendations_insert') THEN
    CREATE POLICY "ai_recommendations_insert" ON public.ai_recommendations FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_recommendations' AND policyname = 'ai_recommendations_update') THEN
    CREATE POLICY "ai_recommendations_update" ON public.ai_recommendations FOR UPDATE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.ai_recommendation_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_id UUID NOT NULL REFERENCES public.ai_recommendations(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  slot_category VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recommendation_id, item_id)
);

ALTER TABLE public.ai_recommendation_items ADD COLUMN IF NOT EXISTS recommendation_id UUID;
ALTER TABLE public.ai_recommendation_items ADD COLUMN IF NOT EXISTS item_id UUID;
ALTER TABLE public.ai_recommendation_items ADD COLUMN IF NOT EXISTS slot_category VARCHAR(50);

ALTER TABLE public.ai_recommendation_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_recommendation_items' AND policyname = 'ai_rec_items_select') THEN
    CREATE POLICY "ai_rec_items_select" ON public.ai_recommendation_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.ai_recommendations WHERE id = ai_recommendation_items.recommendation_id AND ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text)));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_recommendation_items' AND policyname = 'ai_rec_items_insert') THEN
    CREATE POLICY "ai_rec_items_insert" ON public.ai_recommendation_items FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.ai_recommendations WHERE id = ai_recommendation_items.recommendation_id AND ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text)));
  END IF;
END $$;

-- 10. USER GAMIFICATION & STREAKS
CREATE TABLE IF NOT EXISTS public.user_gamification (
  user_id TEXT PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  streak_freezes_available INTEGER DEFAULT 1,
  style_score INTEGER DEFAULT 0 CHECK (style_score >= 0 AND style_score <= 100),
  last_logged_date DATE,
  total_outfits_logged INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_gamification ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.user_gamification ADD COLUMN IF NOT EXISTS streak_freezes_available INTEGER DEFAULT 1;
ALTER TABLE public.user_gamification ADD COLUMN IF NOT EXISTS total_outfits_logged INTEGER DEFAULT 0;
ALTER TABLE public.user_gamification ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_gamification' AND policyname = 'user_gamification_select') THEN
    CREATE POLICY "user_gamification_select" ON public.user_gamification FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_gamification' AND policyname = 'user_gamification_insert') THEN
    CREATE POLICY "user_gamification_insert" ON public.user_gamification FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_gamification' AND policyname = 'user_gamification_update') THEN
    CREATE POLICY "user_gamification_update" ON public.user_gamification FOR UPDATE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

DROP TRIGGER IF EXISTS user_gamification_updated_at ON public.user_gamification;
CREATE TRIGGER user_gamification_updated_at
  BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.streak_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  activity_date DATE NOT NULL,
  activity_type VARCHAR(50) DEFAULT 'outfit_logged',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

ALTER TABLE public.streak_logs ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.streak_logs ADD COLUMN IF NOT EXISTS activity_date DATE;
ALTER TABLE public.streak_logs ADD COLUMN IF NOT EXISTS activity_type VARCHAR(50) DEFAULT 'outfit_logged';

ALTER TABLE public.streak_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'streak_logs' AND policyname = 'streak_logs_select') THEN
    CREATE POLICY "streak_logs_select" ON public.streak_logs FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'streak_logs' AND policyname = 'streak_logs_insert') THEN
    CREATE POLICY "streak_logs_insert" ON public.streak_logs FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

-- 11. PLANNED EVENTS
CREATE TABLE IF NOT EXISTS public.planned_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME WITHOUT TIME ZONE,
  occasion_label TEXT NOT NULL,
  location TEXT,
  weather_snapshot JSONB,
  suggested_outfit_id UUID REFERENCES public.logged_outfits(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'tentative' CHECK (status IN ('tentative', 'confirmed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.planned_events ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.planned_events ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE public.planned_events ADD COLUMN IF NOT EXISTS event_time TIME WITHOUT TIME ZONE;
ALTER TABLE public.planned_events ADD COLUMN IF NOT EXISTS occasion_label TEXT;
ALTER TABLE public.planned_events ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.planned_events ADD COLUMN IF NOT EXISTS weather_snapshot JSONB;
ALTER TABLE public.planned_events ADD COLUMN IF NOT EXISTS suggested_outfit_id UUID;
ALTER TABLE public.planned_events ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'tentative';

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

-- 12. COMMUNITY / EXPLORE MODULE
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  style_tag VARCHAR(50),
  occasion VARCHAR(50),
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS style_tag VARCHAR(50);
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS occasion VARCHAR(50);
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

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

CREATE TABLE IF NOT EXISTS public.post_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  reaction_type VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_reactions ADD COLUMN IF NOT EXISTS post_id UUID;
ALTER TABLE public.post_reactions ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.post_reactions ADD COLUMN IF NOT EXISTS reaction_type VARCHAR(30);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_reactions' AND policyname = 'post_reactions_select') THEN
    CREATE POLICY "post_reactions_select" ON public.post_reactions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_reactions' AND policyname = 'post_reactions_insert') THEN
    CREATE POLICY "post_reactions_insert" ON public.post_reactions FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_reactions' AND policyname = 'post_reactions_update') THEN
    CREATE POLICY "post_reactions_update" ON public.post_reactions FOR UPDATE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_reactions' AND policyname = 'post_reactions_delete') THEN
    CREATE POLICY "post_reactions_delete" ON public.post_reactions FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.post_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_saves ADD COLUMN IF NOT EXISTS post_id UUID;
ALTER TABLE public.post_saves ADD COLUMN IF NOT EXISTS user_id TEXT;

ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_saves_select' AND policyname = 'post_saves_select') THEN
    CREATE POLICY "post_saves_select" ON public.post_saves FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_saves_insert' AND policyname = 'post_saves_insert') THEN
    CREATE POLICY "post_saves_insert" ON public.post_saves FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_saves_delete' AND policyname = 'post_saves_delete') THEN
    CREATE POLICY "post_saves_delete" ON public.post_saves FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS post_id UUID;
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS content TEXT;

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_comments_select' AND policyname = 'post_comments_select') THEN
    CREATE POLICY "post_comments_select" ON public.post_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_comments_insert' AND policyname = 'post_comments_insert') THEN
    CREATE POLICY "post_comments_insert" ON public.post_comments FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_comments_delete' AND policyname = 'post_comments_delete') THEN
    CREATE POLICY "post_comments_delete" ON public.post_comments FOR DELETE USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

-- 13. ENTITLEMENTS & BILLING
CREATE TABLE IF NOT EXISTS public.entitlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'premium')),
  plan_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN (
    'active', 'inactive', 'expired', 'cancelled',
    'pending', 'grace_period', 'on_hold', 'paused'
  )),
  purchase_token TEXT,
  order_id TEXT,
  expires_at TIMESTAMPTZ,
  grace_period_ends_at TIMESTAMPTZ,
  is_auto_renewing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';
ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS plan_id TEXT;
ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'inactive';
ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS purchase_token TEXT;
ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ;
ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS is_auto_renewing BOOLEAN DEFAULT false;
ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'entitlements' AND policyname = 'entitlement_select_own') THEN
    CREATE POLICY "entitlement_select_own" ON public.entitlements FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'entitlements' AND policyname = 'entitlement_service_insert') THEN
    CREATE POLICY "entitlement_service_insert" ON public.entitlements FOR INSERT WITH CHECK (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'entitlements' AND policyname = 'entitlement_service_update') THEN
    CREATE POLICY "entitlement_service_update" ON public.entitlements FOR UPDATE USING (auth.role() = 'service_role');
  END IF;
END $$;

DROP TRIGGER IF EXISTS entitlements_updated_at ON public.entitlements;
CREATE TRIGGER entitlements_updated_at
  BEFORE UPDATE ON public.entitlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.purchase_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  purchase_token TEXT UNIQUE NOT NULL,
  order_id TEXT,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  gpb_response JSONB
);

ALTER TABLE public.purchase_tokens ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.purchase_tokens ADD COLUMN IF NOT EXISTS product_id TEXT;
ALTER TABLE public.purchase_tokens ADD COLUMN IF NOT EXISTS purchase_token TEXT;
ALTER TABLE public.purchase_tokens ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE public.purchase_tokens ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.purchase_tokens ADD COLUMN IF NOT EXISTS gpb_response JSONB;

ALTER TABLE public.purchase_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchase_tokens' AND policyname = 'tokens_service_insert') THEN
    CREATE POLICY "tokens_service_insert" ON public.purchase_tokens FOR INSERT WITH CHECK (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchase_tokens' AND policyname = 'tokens_select_own') THEN
    CREATE POLICY "tokens_select_own" ON public.purchase_tokens FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  notification_type TEXT NOT NULL,
  purchase_token TEXT,
  product_id TEXT,
  payload JSONB,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.billing_events ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.billing_events ADD COLUMN IF NOT EXISTS notification_type TEXT;
ALTER TABLE public.billing_events ADD COLUMN IF NOT EXISTS purchase_token TEXT;
ALTER TABLE public.billing_events ADD COLUMN IF NOT EXISTS product_id TEXT;
ALTER TABLE public.billing_events ADD COLUMN IF NOT EXISTS payload JSONB;
ALTER TABLE public.billing_events ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'billing_events' AND policyname = 'billing_events_service_insert') THEN
    CREATE POLICY "billing_events_service_insert" ON public.billing_events FOR INSERT WITH CHECK (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'billing_events' AND policyname = 'billing_events_select_own') THEN
    CREATE POLICY "billing_events_select_own" ON public.billing_events FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text OR auth.uid()::text = user_id::text);
  END IF;
END $$;

-- 14. PERFORMANCE INDEXES
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
