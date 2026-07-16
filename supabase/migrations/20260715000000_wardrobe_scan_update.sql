-- Migration: Add new columns for AI Cloth Scanning
-- Prompts 2: Update wardrobe_items table

ALTER TABLE wardrobe_items 
ADD COLUMN IF NOT EXISTS bg_removed_image_url TEXT,
ADD COLUMN IF NOT EXISTS raw_ai_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS cloth_color TEXT,
ADD COLUMN IF NOT EXISTS care_instructions TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS scan_source TEXT DEFAULT 'camera';

-- Note: season, occasion, category, brand, original_image_url already exist in the schema.
-- season and occasion are TEXT[] arrays natively, so we keep them as arrays.

-- Create indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_wardrobe_season ON wardrobe_items USING GIN (season);
CREATE INDEX IF NOT EXISTS idx_wardrobe_occasion ON wardrobe_items USING GIN (occasion);
CREATE INDEX IF NOT EXISTS idx_wardrobe_category ON wardrobe_items(category);

-- RLS policies already exist in schema.sql that allow users to read/write only their own items,
-- but we ensure they are explicitly set up for wardrobe_items.
-- (No new policies needed as select_own_wardrobe, insert_own_wardrobe, etc., are already covering this).
