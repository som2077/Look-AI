-- =============================================
-- 0. UTILS
-- =============================================
CREATE OR REPLACE FUNCTION update_entitlement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 1. COMMUNITY POSTS
-- =============================================
-- The community_posts table already exists remotely with UUID user_id.
-- We skip its recreation to avoid conflict.

-- =============================================
-- 2. REFACTOR LOGGED OUTFITS
-- =============================================
-- logged_outfits doesn't exist on remote, so we create it properly from scratch
CREATE TABLE IF NOT EXISTS logged_outfits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  worn_time TIME NOT NULL,
  item_count INTEGER DEFAULT 1,
  score INTEGER,
  description TEXT,
  weather_condition TEXT,
  weather_temp TEXT,
  image_url TEXT,
  is_planned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE logged_outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_outfits" ON logged_outfits FOR SELECT
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "insert_own_outfits" ON logged_outfits FOR INSERT
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "update_own_outfits" ON logged_outfits FOR UPDATE
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "delete_own_outfits" ON logged_outfits FOR DELETE
USING (auth.jwt() ->> 'sub' = user_id);

-- Create Junction Table
CREATE TABLE IF NOT EXISTS outfit_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  outfit_id UUID NOT NULL REFERENCES logged_outfits(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES wardrobe_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(outfit_id, item_id)
);

ALTER TABLE outfit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_outfit_items" ON outfit_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM logged_outfits WHERE id = outfit_items.outfit_id AND user_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "insert_own_outfit_items" ON outfit_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM logged_outfits WHERE id = outfit_items.outfit_id AND user_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "delete_own_outfit_items" ON outfit_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM logged_outfits WHERE id = outfit_items.outfit_id AND user_id = auth.jwt() ->> 'sub'
  )
);

-- =============================================
-- 3. GAMIFICATION (STREAKS & BADGES)
-- =============================================
CREATE TABLE IF NOT EXISTS user_gamification (
  user_id TEXT PRIMARY KEY REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  style_score INTEGER DEFAULT 0 CHECK (style_score >= 0 AND style_score <= 100),
  last_logged_date DATE,
  total_outfits_logged INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_gamification" ON user_gamification FOR SELECT
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "update_own_gamification" ON user_gamification FOR UPDATE
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "insert_own_gamification" ON user_gamification FOR INSERT
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

DROP TRIGGER IF EXISTS gamification_updated_at ON user_gamification;
CREATE TRIGGER gamification_updated_at
  BEFORE UPDATE ON user_gamification
  FOR EACH ROW EXECUTE FUNCTION update_entitlement_updated_at();

-- Badges (Lookup Table)
CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_all_badges" ON badges FOR SELECT USING (true);

-- User Badges (Junction)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_badges" ON user_badges FOR SELECT
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "insert_own_badges" ON user_badges FOR INSERT
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- =============================================
-- 4. AI RECOMMENDATION HISTORY
-- =============================================
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  suggested_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weather_context JSONB,
  feedback TEXT CHECK (feedback IN ('liked', 'disliked', 'neutral', 'worn')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_ai_recommendations" ON ai_recommendations FOR SELECT
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "insert_own_ai_recommendations" ON ai_recommendations FOR INSERT
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "update_own_ai_recommendations" ON ai_recommendations FOR UPDATE
USING (auth.jwt() ->> 'sub' = user_id);

CREATE TABLE IF NOT EXISTS ai_recommendation_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_id UUID NOT NULL REFERENCES ai_recommendations(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES wardrobe_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recommendation_id, item_id)
);

ALTER TABLE ai_recommendation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_ai_recommendation_items" ON ai_recommendation_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ai_recommendations WHERE id = ai_recommendation_items.recommendation_id AND user_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "insert_own_ai_recommendation_items" ON ai_recommendation_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ai_recommendations WHERE id = ai_recommendation_items.recommendation_id AND user_id = auth.jwt() ->> 'sub'
  )
);
