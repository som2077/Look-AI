-- Persist the wardrobe item ids that make up a logged outfit.
-- This is the durable trail: when the AI suggests 4 items and the user
-- saves the look, we record exactly which wardrobe_items.id values were
-- in the suggestion (after the server has resolved them). Nullable so
-- old rows and free-form "outfit of the day" entries keep working.

ALTER TABLE public.logged_outfits
  ADD COLUMN IF NOT EXISTS item_ids UUID[];
