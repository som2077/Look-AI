-- Phase 3b follow-up: lock down remaining SECURITY DEFINER exposure + search_path.
--
-- Supabase's security advisor flagged:
--  1. handle_new_reaction / handle_updated_reaction / handle_deleted_reaction /
--     handle_post_like were anon-executable SECURITY DEFINER functions (anyone
--     could invoke them via /rest/v1/rpc to run code as the definer) with an
--     unpinned search_path (object-hijack risk). They are trigger helpers on
--     post_reactions / post_likes — never meant to be called directly.
--  2. rls_auto_enable (event trigger) was also anon-executable via RPC.
--  3. update_updated_at_column / update_entitlement_updated_at had mutable
--     search_path (INVOKER, low risk — pinned for hygiene).
--
-- Fix: recreate with SET search_path = '' + fully-qualified refs, then revoke
-- EXECUTE from PUBLIC and anon. authenticated + service_role keep EXECUTE so
-- the reaction/like triggers still fire for app writes (and edge functions).

-- ---------- Reaction/like trigger helpers ----------
CREATE OR REPLACE FUNCTION public.handle_new_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  post_owner_user_id TEXT;
BEGIN
  SELECT up.user_id INTO post_owner_user_id
  FROM public.community_posts cp
  JOIN public.user_profiles up ON up.user_id = cp.user_id
  WHERE cp.id = NEW.post_id;

  IF post_owner_user_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, post_id, reaction_type)
    VALUES (post_owner_user_id, NEW.user_id, 'reaction', NEW.post_id, NEW.reaction_type);
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.notifications
  SET reaction_type = NEW.reaction_type, created_at = NOW(), is_read = false
  WHERE type = 'reaction' AND post_id = NEW.post_id AND actor_id = NEW.user_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_deleted_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  DELETE FROM public.notifications
  WHERE type = 'reaction' AND post_id = OLD.post_id AND actor_id = OLD.user_id;
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_post_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts
    SET likes_count = COALESCE(likes_count, 0) - 1
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_new_reaction() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_reaction() FROM anon;
REVOKE ALL ON FUNCTION public.handle_updated_reaction() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_updated_reaction() FROM anon;
REVOKE ALL ON FUNCTION public.handle_deleted_reaction() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_deleted_reaction() FROM anon;
REVOKE ALL ON FUNCTION public.handle_post_like() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_post_like() FROM anon;

-- ---------- Event trigger ----------
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM anon;

-- ---------- updated_at helpers (INVOKER; pin search_path for hygiene) ----------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_entitlement_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
