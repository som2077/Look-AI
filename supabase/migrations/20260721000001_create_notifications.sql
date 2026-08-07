-- =============================================
-- NOTIFICATIONS
-- =============================================
DROP TABLE IF EXISTS notifications;

CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  reaction_type TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "insert_notifications" ON notifications FOR INSERT
WITH CHECK (true); 

-- Trigger for New Reaction
CREATE OR REPLACE FUNCTION handle_new_reaction()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_user_id TEXT;
BEGIN
  -- Get the post owner's clerk user_id. 
  SELECT up.user_id INTO post_owner_user_id
  FROM community_posts cp
  JOIN user_profiles up ON cp.user_id = up.id
  WHERE cp.id = NEW.post_id;

  -- Only create notification if someone else reacted
  IF post_owner_user_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, post_id, reaction_type)
    VALUES (post_owner_user_id, NEW.user_id, 'reaction', NEW.post_id, NEW.reaction_type);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_reaction_created ON post_reactions;
CREATE TRIGGER on_reaction_created
  AFTER INSERT ON post_reactions
  FOR EACH ROW EXECUTE FUNCTION handle_new_reaction();

-- Trigger for Updated Reaction
CREATE OR REPLACE FUNCTION handle_updated_reaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE notifications
  SET reaction_type = NEW.reaction_type, created_at = NOW(), is_read = false
  WHERE type = 'reaction' AND post_id = NEW.post_id AND actor_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_reaction_updated ON post_reactions;
CREATE TRIGGER on_reaction_updated
  AFTER UPDATE ON post_reactions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_reaction();

-- Trigger for Deleted Reaction
CREATE OR REPLACE FUNCTION handle_deleted_reaction()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM notifications
  WHERE type = 'reaction' AND post_id = OLD.post_id AND actor_id = OLD.user_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_reaction_deleted ON post_reactions;
CREATE TRIGGER on_reaction_deleted
  AFTER DELETE ON post_reactions
  FOR EACH ROW EXECUTE FUNCTION handle_deleted_reaction();
