-- =============================================
-- SAVED CLOTHING LABELS
-- =============================================
CREATE TABLE IF NOT EXISTS saved_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  brand TEXT,
  size TEXT,
  fabric_composition JSONB,
  care_symbols JSONB,
  original_text TEXT,
  translated_text TEXT,
  label_standard_guess TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE saved_labels ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "select_own_labels" ON saved_labels FOR SELECT
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "insert_own_labels" ON saved_labels FOR INSERT
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "update_own_labels" ON saved_labels FOR UPDATE
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "delete_own_labels" ON saved_labels FOR DELETE
USING (auth.jwt() ->> 'sub' = user_id);

-- Auto-update updated_at for saved_labels
CREATE TRIGGER saved_labels_updated_at
  BEFORE UPDATE ON saved_labels
  FOR EACH ROW EXECUTE FUNCTION update_entitlement_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_labels_user_id ON saved_labels(user_id);
