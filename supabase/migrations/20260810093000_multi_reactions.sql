-- Drop the old unique constraint which restricted users to one reaction per post
ALTER TABLE public.post_reactions DROP CONSTRAINT IF EXISTS post_reactions_post_id_user_id_key;

-- Add a new unique constraint which allows one of each reaction type per user per post
ALTER TABLE public.post_reactions ADD CONSTRAINT post_reactions_multi_key UNIQUE (post_id, user_id, reaction_type);
