-- Pehle purani table drop karo (agar hai toh)
DROP TABLE IF EXISTS user_profiles;

-- Nai table banao
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  nickname TEXT,
  username TEXT UNIQUE,
  age INTEGER,
  height INTEGER,
  gender TEXT,
  body_type TEXT,
  bio TEXT,
  about TEXT,
  style_preferences TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS enable karo
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Sirf apna data insert kar sake
CREATE POLICY "insert_own" ON user_profiles FOR INSERT
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Sirf apna data dekh sake
CREATE POLICY "select_own" ON user_profiles FOR SELECT
USING (auth.jwt() ->> 'sub' = user_id);

-- Sirf apna data update kar sake
CREATE POLICY "update_own" ON user_profiles FOR UPDATE
USING (auth.jwt() ->> 'sub' = user_id);

-- =============================================
-- GOOGLE PLAY BILLING TABLES
-- =============================================

-- entitlements: single source of truth for premium access
-- Written ONLY by the verify-purchase Edge Function (service role).
-- Client can only SELECT their own row.
DROP TABLE IF EXISTS entitlements;
CREATE TABLE entitlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free'
    CHECK (tier IN ('free', 'pro', 'premium')),
  plan_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (status IN (
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

ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;

-- Users can only read their own entitlement
CREATE POLICY "entitlement_select_own" ON entitlements FOR SELECT
USING (auth.jwt() ->> 'sub' = user_id);

-- Only service role (Edge Function) can insert/update
CREATE POLICY "entitlement_service_insert" ON entitlements FOR INSERT
WITH CHECK (true);

CREATE POLICY "entitlement_service_update" ON entitlements FOR UPDATE
USING (true);

-- purchase_tokens: audit log of every verified token (prevents replay attacks)
DROP TABLE IF EXISTS purchase_tokens;
CREATE TABLE purchase_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  purchase_token TEXT UNIQUE NOT NULL,
  order_id TEXT,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  gpb_response JSONB
);

ALTER TABLE purchase_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tokens_service_insert" ON purchase_tokens FOR INSERT
WITH CHECK (true);

CREATE POLICY "tokens_select_own" ON purchase_tokens FOR SELECT
USING (auth.jwt() ->> 'sub' = user_id);

-- billing_events: RTDN (Real-time Developer Notifications) webhook audit log
DROP TABLE IF EXISTS billing_events;
CREATE TABLE billing_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  notification_type TEXT NOT NULL,
  purchase_token TEXT,
  product_id TEXT,
  payload JSONB,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billing_events_service_insert" ON billing_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "billing_events_select_own" ON billing_events FOR SELECT
USING (auth.jwt() ->> 'sub' = user_id);

-- Auto-update updated_at on entitlements
CREATE OR REPLACE FUNCTION update_entitlement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS entitlements_updated_at ON entitlements;
CREATE TRIGGER entitlements_updated_at
  BEFORE UPDATE ON entitlements
  FOR EACH ROW EXECUTE FUNCTION update_entitlement_updated_at();

-- =============================================
-- LOGGED OUTFITS
-- =============================================
DROP TABLE IF EXISTS logged_outfits;
CREATE TABLE logged_outfits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  worn_time TIME NOT NULL,
  items_worn TEXT NOT NULL,
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

-- =============================================
-- WARDROBE ITEMS (DIGITAL CLOSET)
-- =============================================
DROP TABLE IF EXISTS wardrobe_items;
CREATE TABLE wardrobe_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id),
  custom_name TEXT,
  brand TEXT,
  
  -- Core Visual Attributes
  category TEXT NOT NULL,
  sub_category TEXT,
  primary_color TEXT,
  secondary_colors TEXT[],
  pattern TEXT,
  fabric_guess TEXT,
  fit TEXT,
  sleeve_type TEXT,
  neck_type TEXT,
  
  -- Styling Intelligence
  style TEXT[],
  season TEXT[],
  occasion TEXT[],
  formality_score INTEGER,
  versatility_tags TEXT[],
  
  -- Metadata
  image_url TEXT,
  original_image_url TEXT,
  confidence NUMERIC(3,2),
  source TEXT,
  
  -- Editable/Tracking
  is_favorite BOOLEAN DEFAULT false,
  wear_count INTEGER DEFAULT 0,
  last_worn_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_wardrobe" ON wardrobe_items FOR SELECT
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "insert_own_wardrobe" ON wardrobe_items FOR INSERT
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "update_own_wardrobe" ON wardrobe_items FOR UPDATE
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "delete_own_wardrobe" ON wardrobe_items FOR DELETE
USING (auth.jwt() ->> 'sub' = user_id);

-- Auto-update updated_at for wardrobe_items
DROP TRIGGER IF EXISTS wardrobe_items_updated_at ON wardrobe_items;
CREATE TRIGGER wardrobe_items_updated_at
  BEFORE UPDATE ON wardrobe_items
  FOR EACH ROW EXECUTE FUNCTION update_entitlement_updated_at();
