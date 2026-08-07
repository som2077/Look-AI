-- Optimize database for 10,000 active users by adding missing B-Tree indexes

-- 1. User Profiles Optimization
-- Help with fast user lookups by ID and username
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- 2. Community Posts Optimization
-- The Explore feed orders by created_at DESC, so this index speeds up feed loading significantly
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);

-- 3. Post Reactions Optimization
-- Counting reactions for posts in the Explore feed needs to be very fast
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON post_reactions(user_id);



-- 5. Logged Outfits Optimization
-- Similar to planned events, fetching logged outfits for history/analytics
CREATE INDEX IF NOT EXISTS idx_logged_outfits_user_date ON logged_outfits(user_id, date);

-- 6. Wardrobe Items Extension (From previous migrations)
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_id ON wardrobe_items(user_id);
